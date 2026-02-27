import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

export default function PlacesMap({ places, onSelectPlace, onSelectClusterPlaces }) {
  const center = useMemo(() => [60.9827, 25.6615], []);
  const [map, setMap] = useState(null);
  const [myLocation, setMyLocation] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function locateOnce() {
    setError('');

    if (!('geolocation' in navigator)) {
      setError('Paikannus ei ole käytettävissä tässä laitteessa.');
      return;
    }

    if (!map) return;

    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLocation({ lat, lng });
        map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
        setBusy(false);
      },
      () => {
        setError('Paikannus epäonnistui tai lupa evättiin.');
        setBusy(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  const groupedPlaces = useMemo(() => {
    const groups = new Map();
    for (const p of places || []) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      const key = `${Number(p.lat).toFixed(5)},${Number(p.lng).toFixed(5)}`;
      const list = groups.get(key) || [];
      list.push(p);
      groups.set(key, list);
    }
    return Array.from(groups.entries()).map(([key, list]) => {
      const [latStr, lngStr] = key.split(',');
      return { key, lat: Number(latStr), lng: Number(lngStr), list };
    });
  }, [places]);

  function multiIcon(count) {
    return L.divIcon({
      className: 'multi-marker',
      html: `<div class="multi-marker__bubble">${count}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -34],
    });
  }

  return (
    <div className="map">
      <div className="map__controls">
        <button className="btn btn--secondary map__btn" type="button" onClick={locateOnce} disabled={busy || !map}>
          {busy ? 'Paikannetaan...' : 'Paikanna minut'}
        </button>
        {error ? <div className="map__error">{error}</div> : null}
      </div>

      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        style={{ height: 420, width: '100%' }}
        whenReady={(e) => setMap(e.target)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {myLocation ? (
          <Marker position={[myLocation.lat, myLocation.lng]}>
            <Popup>
              <strong>Sinä olet tässä</strong>
            </Popup>
          </Marker>
        ) : null}

        {groupedPlaces.map((g) =>
          g.list.length === 1 ? (
            <Marker
              key={g.list[0].id}
              position={[g.lat, g.lng]}
              placeId={g.list[0].id}
              eventHandlers={{
                click: () => onSelectPlace(g.list[0]),
              }}
            >
              <Popup>
                <div style={{ display: 'grid', gap: 6 }}>
                  <strong>{g.list[0].name}</strong>
                  <div style={{ opacity: 0.85 }}>{g.list[0].address}</div>
                  <button className="btn btn--secondary" onClick={() => onSelectPlace(g.list[0])}>
                    Avaa
                  </button>
                </div>
              </Popup>
            </Marker>
          ) : (
            <Marker
              key={g.key}
              position={[g.lat, g.lng]}
              icon={multiIcon(g.list.length)}
              eventHandlers={{
                click: () => onSelectClusterPlaces(g.list),
              }}
            >
              <Popup>
                <div style={{ display: 'grid', gap: 6 }}>
                  <strong>{g.list.length} paikkaa samalla kohdalla</strong>
                  <button className="btn btn--secondary" onClick={() => onSelectClusterPlaces(g.list)}>
                    Avaa lista
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        )}
      </MapContainer>
    </div>
  );
}
