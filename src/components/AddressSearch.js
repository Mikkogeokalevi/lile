import React, { useEffect, useMemo, useState } from 'react';

export default function AddressSearch({ value, onPick, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const resolvedPlaceholder = useMemo(
    () => placeholder || 'Hae osoitetta tai paikkaa (esim. ravintola, katuosoite)',
    [placeholder]
  );

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    const q = (query || '').trim();
    if (q.length < 3) {
      setResults([]);
      setError('');
      return;
    }

    const handle = setTimeout(async () => {
      setBusy(true);
      setError('');
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '6');
        url.searchParams.set('q', q);

        const res = await fetch(url.toString(), {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!res.ok) throw new Error('Osoitehaku epäonnistui.');
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        setResults([]);
        setError(e?.message || 'Osoitehaku epäonnistui.');
      } finally {
        setBusy(false);
      }
    }, 450);

    return () => clearTimeout(handle);
  }, [query]);

  function pick(r) {
    const lat = Number(r.lat);
    const lng = Number(r.lon);

    const addr = r.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.hamlet ||
      addr.county ||
      '';

    onPick({
      label: r.display_name,
      address: r.display_name,
      lat,
      lng,
      city,
      raw: r,
    });

    setQuery(r.display_name);
    setResults([]);
  }

  return (
    <div className="addr">
      <input
        className="field__input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={resolvedPlaceholder}
      />

      {busy ? <div className="addr__hint">Haetaan...</div> : null}
      {error ? <div className="addr__error">{error}</div> : null}

      {results.length ? (
        <div className="addr__results">
          {results.map((r) => (
            <button
              key={`${r.place_id}`}
              type="button"
              className="addr__result"
              onClick={() => pick(r)}
            >
              {r.display_name}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
