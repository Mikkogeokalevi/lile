import React from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

import logo from '../assets/lilelogo.jpeg';

const ADMIN_EMAIL = 'toni@kauppinen.info';

export default function AppLayout() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  const isAdmin = user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  if (!initializing && user && location.pathname === '/kirjaudu') {
    return <Navigate to="/" replace />;
  }

  if (!initializing && !user && location.pathname !== '/kirjaudu') {
    return <Navigate to="/kirjaudu" replace />;
  }

  return (
    <div className={user ? 'App' : 'App App--locked'}>
      {user ? (
        <>
          <header className="appbar">
            <div className="appbar__row">
              <Link to="/" className="appbar__brand" aria-label="Etusivu">
                <img className="appbar__logo" src={logo} alt="Lile Lahti" />
                <span className="appbar__title">Lile Lahti</span>
              </Link>

              <div className="appbar__right">
                {initializing ? (
                  <span className="nav-muted">Tarkistetaan...</span>
                ) : (
                  <>
                    <span className="chip chip--muted" title={user.email || user.displayName}>
                      {user.email || user.displayName}
                    </span>
                    {isAdmin ? (
                      <NavLink className="chip chip--primary" to="/admin">
                        Admin
                      </NavLink>
                    ) : null}
                    <button className="icon-btn" type="button" aria-label="Kirjaudu ulos" onClick={() => signOut(auth)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 17l5-5-5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M21 12H9"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>

            <nav className="appbar__nav" aria-label="Päävalikko">
              <NavLink className="nav-pill" to="/" end>
                Etusivu
              </NavLink>
              <NavLink className="nav-pill" to="/ruokapaikat">
                Ruokapaikat
              </NavLink>
              <NavLink className="nav-pill" to="/reseptit">
                Reseptit
              </NavLink>
              <NavLink className="nav-pill" to="/ohjekirja">
                Ohjekirja
              </NavLink>
              <NavLink className="nav-pill" to="/versiohistoria">
                Versiohistoria
              </NavLink>
            </nav>
          </header>

          <main className="content">
            <Outlet />
          </main>

          <footer className="footer">
            <span className="nav-muted">Lile Lahti</span>
          </footer>
        </>
      ) : (
        <main className="locked">
          <Outlet />
        </main>
      )}
    </div>
  );
}
