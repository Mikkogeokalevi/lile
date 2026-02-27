import React from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { httpsCallable } from 'firebase/functions';

import { db, functions } from '../firebase';

export default function AdminPage() {
  const [requests, setRequests] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState('pending');
  const [busyId, setBusyId] = React.useState('');
  const [error, setError] = React.useState('');

  const [users, setUsers] = React.useState([]);
  const [userError, setUserError] = React.useState('');
  const [userBusyId, setUserBusyId] = React.useState('');
  const [userQuery, setUserQuery] = React.useState('');

  React.useEffect(() => {
    const q = query(collection(db, 'placeRemovalRequests'), orderBy('requestedAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, ...d.data() }));
        setRequests(rows);
        setError('');
      },
      (e) => {
        setError(e?.message || 'Poistopyyntöjen haku epäonnistui.');
      }
    );
    return () => unsub();
  }, []);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setUserError('');
      try {
        const fn = httpsCallable(functions, 'adminListUsers');
        const res = await fn({ limit: 200 });
        const rows = Array.isArray(res?.data?.users) ? res.data.users : [];
        if (!active) return;
        setUsers(rows);
      } catch (e) {
        if (!active) return;
        setUserError(e?.message || 'Käyttäjien haku epäonnistui.');
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    if (statusFilter === 'all') return requests;
    return requests.filter((r) => (r.status || 'pending') === statusFilter);
  }, [requests, statusFilter]);

  async function approve(req) {
    if (!req?.id) return;

    const placeLabel = req.placeName ? `“${req.placeName}”` : 'tämä paikka';
    const ok = window.confirm(
      `Hyväksytäänkö poistopyyntö ja poistetaanko ${placeLabel}?\n\nTätä ei voi perua.`
    );
    if (!ok) return;

    setBusyId(req.id);
    setError('');
    try {
      if (req.placeId) {
        await deleteDoc(doc(db, 'places', req.placeId));
      }

      // Resolve all pending requests for the same place (prevents duplicates lingering)
      if (req.placeId) {
        const q = query(
          collection(db, 'placeRemovalRequests'),
          where('placeId', '==', req.placeId),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        let updatedAny = false;
        snap.forEach((d) => {
          batch.update(d.ref, { status: 'approved', resolvedAt: serverTimestamp() });
          updatedAny = true;
        });
        if (!updatedAny) {
          batch.update(doc(db, 'placeRemovalRequests', req.id), { status: 'approved', resolvedAt: serverTimestamp() });
        }
        await batch.commit();
      } else {
        await updateDoc(doc(db, 'placeRemovalRequests', req.id), {
          status: 'approved',
          resolvedAt: serverTimestamp(),
        });
      }
    } catch (e) {
      setError(e?.message || 'Hyväksyntä epäonnistui.');
    } finally {
      setBusyId('');
    }
  }

  async function toggleBlocked(u) {
    if (!u?.uid) return;
    const nextBlocked = !u.disabled;
    const emailLabel = u.email ? ` (${u.email})` : '';
    const ok = window.confirm(
      nextBlocked
        ? `Estetäänkö käyttäjä${emailLabel} kirjautumasta?`
        : `Sallitaanko käyttäjän${emailLabel} kirjautua taas?`
    );
    if (!ok) return;

    setUserBusyId(u.uid);
    setUserError('');
    try {
      const fn = httpsCallable(functions, 'adminSetUserBlocked');
      await fn({ uid: u.uid, blocked: nextBlocked });
      setUsers((prev) => prev.map((row) => (row.uid === u.uid ? { ...row, disabled: nextBlocked } : row)));
    } catch (e) {
      setUserError(e?.message || 'Toiminto epäonnistui.');
    } finally {
      setUserBusyId('');
    }
  }

  async function deleteUser(u) {
    if (!u?.uid) return;
    const emailLabel = u.email ? ` (${u.email})` : '';
    const ok = window.confirm(
      `Poistetaanko käyttäjä${emailLabel} kokonaan?\n\nTätä ei voi perua.`
    );
    if (!ok) return;

    setUserBusyId(u.uid);
    setUserError('');
    try {
      const fn = httpsCallable(functions, 'adminDeleteUser');
      await fn({ uid: u.uid });
      setUsers((prev) => prev.filter((row) => row.uid !== u.uid));
    } catch (e) {
      setUserError(e?.message || 'Poisto epäonnistui.');
    } finally {
      setUserBusyId('');
    }
  }

  const filteredUsers = React.useMemo(() => {
    const q = String(userQuery || '').trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.email || '').toLowerCase().includes(q));
  }, [users, userQuery]);

  async function reject(req) {
    if (!req?.id) return;
    setBusyId(req.id);
    setError('');
    try {
      await updateDoc(doc(db, 'placeRemovalRequests', req.id), {
        status: 'rejected',
        resolvedAt: serverTimestamp(),
      });
    } catch (e) {
      setError(e?.message || 'Hylkäys epäonnistui.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <div>
      <h2>Admin</h2>
      <p>Tämä näkymä on vain ylläpitäjälle.</p>

      <h3>Käyttäjät</h3>

      <div className="field" style={{ marginBottom: 12, maxWidth: 420 }}>
        <label className="field__label">Hae sähköpostilla</label>
        <input
          className="field__input"
          value={userQuery}
          onChange={(e) => setUserQuery(e.target.value)}
          placeholder="esim. nimi@domain.fi"
        />
      </div>

      {userError ? <div className="error">{userError}</div> : null}

      {filteredUsers.length === 0 ? <div className="nav-muted">Ei käyttäjiä.</div> : null}

      <div className="places-list" style={{ marginTop: 12 }}>
        {filteredUsers.map((u) => {
          const busy = userBusyId === u.uid;
          const created = u.creationTime ? new Date(u.creationTime).toLocaleString('fi-FI') : '';
          const last = u.lastSignInTime ? new Date(u.lastSignInTime).toLocaleString('fi-FI') : '';
          return (
            <div key={u.uid} className="place-item">
              <div className="place-main">
                <div className="place-title">{u.email || '(ei sähköpostia)'}</div>
                <div className="place-sub">
                  <span className="badge">{u.disabled ? 'blocked' : 'active'}</span>
                  {created ? (
                    <span className="nav-muted" style={{ marginLeft: 8 }}>
                      Rek.: {created}
                    </span>
                  ) : null}
                  {last ? (
                    <span className="nav-muted" style={{ marginLeft: 8 }}>
                      Viime: {last}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="place-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button className="btn btn--secondary" type="button" onClick={() => toggleBlocked(u)} disabled={busy}>
                  {u.disabled ? 'Salli' : 'Estä'}
                </button>
                <button className="btn" type="button" onClick={() => deleteUser(u)} disabled={busy}>
                  Poista
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <h3>Ruokapaikkojen poistopyynnöt</h3>

      <div className="tabs" style={{ marginBottom: 12 }}>
        <button
          className={statusFilter === 'pending' ? 'tab tab--active' : 'tab'}
          type="button"
          onClick={() => setStatusFilter('pending')}
        >
          Odottaa
        </button>
        <button
          className={statusFilter === 'approved' ? 'tab tab--active' : 'tab'}
          type="button"
          onClick={() => setStatusFilter('approved')}
        >
          Hyväksytty
        </button>
        <button
          className={statusFilter === 'rejected' ? 'tab tab--active' : 'tab'}
          type="button"
          onClick={() => setStatusFilter('rejected')}
        >
          Hylätty
        </button>
        <button
          className={statusFilter === 'all' ? 'tab tab--active' : 'tab'}
          type="button"
          onClick={() => setStatusFilter('all')}
        >
          Kaikki
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}

      {filtered.length === 0 ? <div className="nav-muted">Ei poistopyyntöjä.</div> : null}

      <div className="places-list" style={{ marginTop: 12 }}>
        {filtered.map((r) => {
          const status = r.status || 'pending';
          const busy = busyId === r.id;
          return (
            <div key={r.id} className="place-item">
              <div className="place-main">
                <div className="place-title">{r.placeName || '(nimetön paikka)'}</div>
                <div className="place-sub">
                  <span className="badge">{status}</span>
                  <span className="nav-muted" style={{ marginLeft: 8 }}>
                    {r.requestedByEmail || 'tuntematon käyttäjä'}
                  </span>
                </div>
              </div>

              <div className="place-actions" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {status === 'pending' ? (
                  <>
                    <button className="btn" type="button" onClick={() => approve(r)} disabled={busy}>
                      {busy ? '...' : 'Hyväksy (poista paikka)'}
                    </button>
                    <button className="btn btn--secondary" type="button" onClick={() => reject(r)} disabled={busy}>
                      Hylkää
                    </button>
                  </>
                ) : (
                  <span className="nav-muted">Käsitelty</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
