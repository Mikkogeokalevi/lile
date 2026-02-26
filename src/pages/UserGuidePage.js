import React, { useEffect, useState } from 'react';

export default function UserGuidePage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${process.env.PUBLIC_URL}/user_guide.md`, { cache: 'no-cache' });
        if (!res.ok) throw new Error('Ohjeen lataus epäonnistui.');
        const t = await res.text();
        if (!mounted) return;
        setText(t);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Ohjeen lataus epäonnistui.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h2>Ohjekirja</h2>
      {loading ? <div>Haetaan ohjetta...</div> : null}
      {error ? <div className="error">{error}</div> : null}
      {!loading && !error ? <pre className="md">{text}</pre> : null}
    </div>
  );
}
