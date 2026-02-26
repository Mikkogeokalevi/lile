import React, { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';

import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import AddressSearch from '../components/AddressSearch';
import PlacesMap from '../components/PlacesMap';

export default function PlacesPage() {
  const { user } = useAuth();

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

  const canSave = Boolean(name.trim()) && Boolean(pickedLocation?.lat) && Boolean(pickedLocation?.lng);

  const cities = useMemo(() => {
    const set = new Set();
    for (const p of places) {
      const c = (p.city || '').trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fi'));
  }, [places]);

  const filteredPlaces = useMemo(() => {
    const q = (searchText || '').trim().toLowerCase();
    const city = (cityFilter || '').trim().toLowerCase();

    return places.filter((p) => {
      if (city) {
        const pc = String(p.city || '').toLowerCase();
        if (pc !== city) return false;
      }

      if (!q) return true;

      const hay = `${p.name || ''} ${p.address || ''} ${p.notes || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [places, searchText, cityFilter]);

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

      <div className="card" style={{ marginBottom: 16 }}>
        <h3>Haku</h3>
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

      <div className="grid-2">
        <div className="card">
          <h3>Lisää uusi paikka</h3>

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
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Lista</h3>
        {loading ? <div>Haetaan ruokapaikkoja...</div> : null}
        {loadError ? <div className="error">{loadError}</div> : null}
        {!loading && !places.length ? <div>Ei vielä ruokapaikkoja. Lisää ensimmäinen!</div> : null}
        {!loading && places.length && !filteredPlaces.length ? <div>Ei hakuehtoja vastaavia paikkoja.</div> : null}

        {filteredPlaces.length ? (
          <div className="list">
            {filteredPlaces.map((p) => (
              <button
                key={p.id}
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
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
