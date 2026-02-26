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
    <div className="login">
      <div className="login__card">
        <div className="login__brand">Lile</div>
        <div className="login__icon" aria-hidden="true">
          🔒
        </div>
        <div className="login__subtitle">Kirjaudu sisään käyttääksesi työkaluja.</div>

        <div className="login__actions">
          <button className="btn btn--primary" onClick={onGoogleLogin} disabled={busy}>
            Jatka Googlella
          </button>

          <div className="login__or">tai</div>

          <form onSubmit={onEmailSubmit} className="login__form">
            <div className="field">
              <label className="field__label">Sähköposti</label>
              <input
                className="field__input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <label className="field__label">Salasana</label>
              <input
                className="field__input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            <button className="btn btn--secondary" type="submit" disabled={busy}>
              {mode === 'login' ? 'Kirjaudu sisään' : 'Luo uusi tunnus'}
            </button>
          </form>

          <button
            className="btn btn--ghost"
            type="button"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            disabled={busy}
          >
            {mode === 'login' ? 'Luo uusi tunnus' : 'Minulla on jo tunnus'}
          </button>
        </div>

        <h2 className="login__title">{title}</h2>

        {error ? <div className="login__error">{error}</div> : null}
      </div>
    </div>
  );
}
