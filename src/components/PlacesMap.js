import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
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

  const placesById = useMemo(() => {
    const m = new Map();
    for (const p of places || []) m.set(p.id, p);
    return m;
  }, [places]);

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

        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          disableClusteringAtZoom={13}
          eventHandlers={{
            clusterclick: (e) => {
              const markers = e.layer.getAllChildMarkers();
              const ids = markers
                .map((m) => m?.options?.placeId)
                .filter(Boolean);
              const unique = Array.from(new Set(ids));
              const list = unique.map((id) => placesById.get(id)).filter(Boolean);
              if (list.length === 1) onSelectPlace(list[0]);
              else if (list.length > 1) onSelectClusterPlaces(list);
            },
          }}
        >
          {(places || [])
            .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
            .map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                placeId={p.id}
                eventHandlers={{
                  click: () => onSelectPlace(p),
                }}
              >
                <Popup>
                  <div style={{ display: 'grid', gap: 6 }}>
                    <strong>{p.name}</strong>
                    <div style={{ opacity: 0.85 }}>{p.address}</div>
                    <button className="btn btn--secondary" onClick={() => onSelectPlace(p)}>
                      Avaa
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
