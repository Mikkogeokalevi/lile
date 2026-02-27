import React, { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import AddressSearch from '../components/AddressSearch';
import PlacesMap from '../components/PlacesMap';

const ADMIN_EMAIL = 'toni@kauppinen.info';

export default function PlacesPage() {
  const { user } = useAuth();

  const isAdmin = user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [addressValue, setAddressValue] = useState('');
  const [pickedLocation, setPickedLocation] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [searchText, setSearchText] = useState('');
  const [cityFilter, setCityFilter] = useState('');

  const [view, setView] = useState('map');

  const [editingPlace, setEditingPlace] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAddressValue, setEditAddressValue] = useState('');
  const [editPickedLocation, setEditPickedLocation] = useState(null);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState('');
  const [requestBusy, setRequestBusy] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');
  const [pendingRemovalRequest, setPendingRemovalRequest] = useState(null);
  const [pendingRemovalError, setPendingRemovalError] = useState('');

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [clusterPlaces, setClusterPlaces] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'places'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPlaces(items);
        setLoading(false);
      },
      (e) => {
        setLoadError(e?.message || 'Ruokapaikkojen lataus epäonnistui.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  function inferCityFromAddress(address) {
    const s = String(address || '');
    if (!s.includes(',')) return '';
    const parts = s
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const skip = (p) => {
      if (!p) return true;
      if (/\d/.test(p)) return true;
      if (p.length < 2 || p.length > 40) return true;
      if (/suomi/i.test(p)) return true;
      if (/manner-suomi/i.test(p)) return true;
      if (/maakunta/i.test(p)) return true;
      if (/seutukunta/i.test(p)) return true;
      if (/\b(finland)\b/i.test(p)) return true;
      if (/\b(paijat-hame|päijät-häme)\b/i.test(p)) return true;
      return false;
    };

    for (let i = parts.length - 1; i >= 0; i -= 1) {
      const p = parts[i];
      if (skip(p)) continue;
      return p;
    }

    return '';
  }

  function getCity(p) {
    return (p.city || '').trim() || inferCityFromAddress(p.address);
  }

  function fmtTs(ts) {
    if (!ts) return '';
    try {
      if (typeof ts?.toDate === 'function') {
        return ts.toDate().toLocaleString('fi-FI');
      }
      if (ts instanceof Date) return ts.toLocaleString('fi-FI');
    } catch {
      return '';
    }
    return '';
  }

  const canSave = Boolean(name.trim()) && Boolean(pickedLocation?.lat) && Boolean(pickedLocation?.lng);

  const cities = useMemo(() => {
    const set = new Set();
    for (const p of places) {
      const c = getCity(p);
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fi'));
  }, [places]);

  const filteredPlaces = useMemo(() => {
    const q = (searchText || '').trim().toLowerCase();
    const city = (cityFilter || '').trim().toLowerCase();

    return places.filter((p) => {
      if (city) {
        const pc = String(getCity(p) || '').toLowerCase();
        if (pc !== city) return false;
      }

      if (!q) return true;

      const hay = `${p.name || ''} ${p.address || ''} ${p.notes || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [places, searchText, cityFilter]);

  function startEdit(p) {
    setEditingPlace(p);
    setEditName(p?.name || '');
    setEditNotes(p?.notes || '');
    setEditAddressValue(p?.address || '');
    setEditPickedLocation(null);
    setEditError('');
    setRequestError('');
    setRequestSuccess('');
  }

  useEffect(() => {
    if (!editingPlace?.id) {
      setPendingRemovalRequest(null);
      setPendingRemovalError('');
      return;
    }

    const q = query(
      collection(db, 'placeRemovalRequests'),
      where('placeId', '==', editingPlace.id),
      where('status', '==', 'pending'),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const docs = [];
        snap.forEach((d) => docs.push({ id: d.id, ...d.data() }));
        setPendingRemovalRequest(docs[0] || null);
        setPendingRemovalError('');
      },
      (e) => {
        setPendingRemovalRequest(null);
        setPendingRemovalError(e?.message || 'Poistopyynnön tilan tarkistus epäonnistui.');
      }
    );

    return () => unsub();
  }, [editingPlace?.id]);

  async function saveEdit() {
    if (!user || !editingPlace) return;
    setEditBusy(true);
    setEditError('');

    try {
      const update = {
        name: (editName || '').trim(),
        notes: (editNotes || '').trim(),
        updatedAt: serverTimestamp(),
        updatedByUid: user.uid,
        updatedByEmail: user.email || null,
      };

      if (editPickedLocation?.address && Number.isFinite(editPickedLocation?.lat) && Number.isFinite(editPickedLocation?.lng)) {
        update.address = editPickedLocation.address;
        update.lat = editPickedLocation.lat;
        update.lng = editPickedLocation.lng;
        update.city = (editPickedLocation.city || '').trim();
      }

      await updateDoc(doc(db, 'places', editingPlace.id), update);

      setEditingPlace(null);
    } catch (e) {
      setEditError(e?.message || 'Tallennus epäonnistui.');
    } finally {
      setEditBusy(false);
    }
  }

  async function requestRemoval() {
    if (!user || !editingPlace) return;
    if (pendingRemovalRequest) return;
    setRequestBusy(true);
    setRequestError('');
    setRequestSuccess('');

    try {
      await addDoc(collection(db, 'placeRemovalRequests'), {
        placeId: editingPlace.id,
        placeName: editingPlace.name || '',
        requestedAt: serverTimestamp(),
        requestedByUid: user.uid,
        requestedByEmail: user.email || null,
        status: 'pending',
      });

      setRequestSuccess('Poistopyyntö lähetetty. Se odottaa ylläpidon käsittelyä.');
    } catch (e) {
      setRequestError(e?.message || 'Poistopyynnön lähetys epäonnistui.');
    } finally {
      setRequestBusy(false);
    }
  }

  async function onAddPlace(e) {
    e.preventDefault();
    if (!user) return;
    if (!canSave) return;

    setSaving(true);
    setSaveError('');
    try {
      await addDoc(collection(db, 'places'), {
        name: name.trim(),
        notes: notes.trim(),
        address: pickedLocation.address,
        city: (pickedLocation.city || '').trim(),
        lat: pickedLocation.lat,
        lng: pickedLocation.lng,
        createdAt: serverTimestamp(),
        createdByUid: user.uid,
        createdByEmail: user.email || null,
      });

      setName('');
      setNotes('');
      setAddressValue('');
      setPickedLocation(null);
    } catch (e2) {
      setSaveError(e2?.message || 'Tallennus epäonnistui.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h2>Ruokapaikat</h2>
      <p>
        Lisää ja selaa ruokapaikkoja. Kartasta voit avata paikan klikkaamalla markeria.
      </p>

      <details className="card disclosure" style={{ marginBottom: 16 }}>
        <summary className="disclosure__summary">Haku</summary>
        <div className="disclosure__body">
          <div className="filters">
            <div className="field">
              <label className="field__label">Hae (nimi, osoite, lisätiedot)</label>
              <input
                className="field__input"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Esim. lahti, pizza, ABC..."
              />
            </div>

            <div className="field">
              <label className="field__label">Paikkakunta</label>
              <select className="field__input" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
                <option value="">Kaikki</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hint">Näytetään {filteredPlaces.length} / {places.length}</div>
        </div>
      </details>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button
          type="button"
          className={view === 'map' ? 'tab tab--active' : 'tab'}
          onClick={() => setView('map')}
        >
          Kartta
        </button>
        <button
          type="button"
          className={view === 'list' ? 'tab tab--active' : 'tab'}
          onClick={() => setView('list')}
        >
          Lista
        </button>
      </div>

      <div className={view === 'map' ? 'grid-2' : 'grid-1'}>
        <details className="card disclosure" open>
          <summary className="disclosure__summary">Lisää uusi paikka</summary>
          <div className="disclosure__body">

          <form onSubmit={onAddPlace} className="form">
            <div className="field">
              <label className="field__label">Nimi</label>
              <input
                className="field__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Esim. Ravintola X"
                required
              />
            </div>

            <div className="field">
              <label className="field__label">Osoite (haku)</label>
              <AddressSearch
                value={addressValue}
                onPick={(picked) => {
                  setPickedLocation(picked);
                  setAddressValue(picked.label);
                }}
              />
              {pickedLocation ? (
                <div className="hint">
                  Valittu: {pickedLocation.address}
                </div>
              ) : null}
            </div>

            <div className="field">
              <label className="field__label">Lisätiedot (valinnainen)</label>
              <textarea
                className="field__input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Esim. annoskoko, vinkit, aukioloajat..."
              />
            </div>

            <button className="btn btn--primary" type="submit" disabled={!canSave || saving}>
              {saving ? 'Tallennetaan...' : 'Tallenna paikka'}
            </button>

            {saveError ? <div className="error">{saveError}</div> : null}
          </form>
          </div>
        </details>

        {view === 'map' ? (
          <div className="card">
            <h3>Kartta</h3>
            <PlacesMap
              places={filteredPlaces.map((p) => ({
                ...p,
                lat: typeof p.lat === 'number' ? p.lat : Number(p.lat),
                lng: typeof p.lng === 'number' ? p.lng : Number(p.lng),
              }))}
              onSelectPlace={(p) => {
                setSelectedPlace(p);
                setClusterPlaces([]);
              }}
              onSelectClusterPlaces={(list) => {
                setClusterPlaces(list);
                setSelectedPlace(null);
              }}
            />

            {clusterPlaces.length ? (
              <div className="cluster">
                <div className="cluster__header">
                  <strong>{clusterPlaces.length} paikkaa samalla alueella</strong>
                  <button className="btn btn--ghost" type="button" onClick={() => setClusterPlaces([])}>
                    Sulje
                  </button>
                </div>
                <div className="cluster__list">
                  {clusterPlaces.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="cluster__item"
                      onClick={() => {
                        setSelectedPlace(p);
                        setClusterPlaces([]);
                      }}
                    >
                      <div className="cluster__name">{p.name}</div>
                      <div className="cluster__addr">{p.address}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {selectedPlace ? (
              <div className="detail">
                <div className="detail__header">
                  <strong>{selectedPlace.name}</strong>
                  <button className="btn btn--ghost" type="button" onClick={() => setSelectedPlace(null)}>
                    Sulje
                  </button>
                </div>
                <div className="detail__body">
                  <div style={{ opacity: 0.9 }}>{selectedPlace.address}</div>
                  {selectedPlace.notes ? <div style={{ marginTop: 8 }}>{selectedPlace.notes}</div> : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {view === 'list' ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Lista</h3>
          {loading ? <div>Haetaan ruokapaikkoja...</div> : null}
          {loadError ? <div className="error">{loadError}</div> : null}
          {!loading && !places.length ? <div>Ei vielä ruokapaikkoja. Lisää ensimmäinen!</div> : null}
          {!loading && places.length && !filteredPlaces.length ? <div>Ei hakuehtoja vastaavia paikkoja.</div> : null}

          {filteredPlaces.length ? (
            <div className="list">
              {filteredPlaces.map((p) => (
                <div key={p.id} className="list__row">
                  <button
                    type="button"
                    className="list__item"
                    onClick={() => {
                      setSelectedPlace(p);
                      setClusterPlaces([]);
                    }}
                  >
                    <div className="list__name">{p.name}</div>
                    <div className="list__addr">{p.address}</div>
                  </button>

                  {isAdmin || p.createdByUid === user?.uid ? (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Muokkaa"
                      onClick={() => startEdit(p)}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 20H21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {editingPlace ? (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal__backdrop" onClick={() => setEditingPlace(null)} />
          <div className="modal__panel">
            <div className="modal__header">
              <strong>Muokkaa paikkaa</strong>
              <button className="btn btn--ghost" type="button" onClick={() => setEditingPlace(null)}>
                Sulje
              </button>
            </div>

            <div className="modal__meta">
              <div>Luotu: {fmtTs(editingPlace.createdAt) || '-'}</div>
              <div>Muokattu: {fmtTs(editingPlace.updatedAt) || '-'}</div>
            </div>

            <div className="field">
              <label className="field__label">Nimi</label>
              <input className="field__input" value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>

            <div className="field">
              <label className="field__label">Lisätiedot</label>
              <textarea
                className="field__input"
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="field__label">Osoite (haku)</label>
              <AddressSearch
                value={editAddressValue}
                onPick={(picked) => {
                  setEditPickedLocation(picked);
                  setEditAddressValue(picked.label);
                }}
              />
              {editPickedLocation ? <div className="hint">Valittu: {editPickedLocation.address}</div> : null}
            </div>

            <div className="modal__actions">
              <button className="btn btn--primary" type="button" onClick={saveEdit} disabled={editBusy}>
                {editBusy ? 'Tallennetaan...' : 'Tallenna'}
              </button>

              <button
                className="btn btn--secondary"
                type="button"
                onClick={requestRemoval}
                disabled={requestBusy || !!pendingRemovalRequest}
              >
                {requestBusy
                  ? 'Lähetetään...'
                  : pendingRemovalRequest
                    ? 'Poistopyyntö lähetetty'
                    : 'Pyydä poistoa'}
              </button>
            </div>

            {editError ? <div className="error">{editError}</div> : null}
            {requestError ? <div className="error">{requestError}</div> : null}
            {requestSuccess ? <div className="hint">{requestSuccess}</div> : null}

            {pendingRemovalRequest ? (
              <div className="hint" style={{ marginTop: 8 }}>
                Poistopyyntö odottaa käsittelyä.
              </div>
            ) : null}
            {!pendingRemovalRequest && pendingRemovalError ? (
              <div className="hint" style={{ marginTop: 8 }}>
                Poistopyynnön tilaa ei voitu tarkistaa.
              </div>
            ) : null}
            {!requestError && !requestBusy ? (
              <div className="hint">Poistopyyntö menee ylläpitäjälle hyväksyttäväksi.</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
