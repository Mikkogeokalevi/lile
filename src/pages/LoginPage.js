import React, { useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => (mode === 'login' ? 'Kirjaudu sisään' : 'Luo tunnus'), [mode]);

  async function onGoogleLogin() {
    setError('');
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(e?.message || 'Kirjautuminen epäonnistui.');
    } finally {
      setBusy(false);
    }
  }

  async function onEmailSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e) {
      setError(e?.message || 'Toiminto epäonnistui.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>{title}</h2>

      <div style={{ display: 'grid', gap: 12, maxWidth: 420 }}>
        <button onClick={onGoogleLogin} disabled={busy}>
          Jatka Googlella
        </button>

        <div style={{ opacity: 0.8 }}>tai</div>

        <form onSubmit={onEmailSubmit} style={{ display: 'grid', gap: 8 }}>
          <label style={{ display: 'grid', gap: 4, textAlign: 'left' }}>
            Sähköposti
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label style={{ display: 'grid', gap: 4, textAlign: 'left' }}>
            Salasana
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          <button type="submit" disabled={busy}>
            {mode === 'login' ? 'Kirjaudu' : 'Luo tunnus'}
          </button>
        </form>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            disabled={busy}
          >
            {mode === 'login' ? 'Luo uusi tunnus' : 'Minulla on jo tunnus'}
          </button>
        </div>

        {error ? (
          <div style={{ color: '#b00020', textAlign: 'left' }}>
            {error}
          </div>
        ) : null}
      </div>
    </div>
  );
}
