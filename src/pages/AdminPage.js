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

import { db } from '../firebase';

export default function AdminPage() {
  const [requests, setRequests] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState('pending');
  const [busyId, setBusyId] = React.useState('');
  const [error, setError] = React.useState('');

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
