import React, { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

import logo from '../assets/lilelogo.jpeg';

const ADMIN_EMAIL = 'toni@kauppinen.info';

export default function AppLayout() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  if (!initializing && user && location.pathname === '/kirjaudu') {
    return <Navigate to="/" replace />;
  }

  if (!initializing && !user && location.pathname !== '/kirjaudu') {
    return <Navigate to="/kirjaudu" replace />;
  }

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
                {initializing ? <span className="nav-muted">Tarkistetaan...</span> : null}

                <div className="appbar__desktop">
                  {initializing ? null : (
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

                <div className="appbar__mobile">
                  <button
                    className="icon-btn appbar__menuBtn"
                    type="button"
                    aria-label={mobileMenuOpen ? 'Sulje valikko' : 'Avaa valikko'}
                    aria-expanded={mobileMenuOpen}
                    onClick={() => setMobileMenuOpen((v) => !v)}
                  >
                    <span className="appbar__menuLabel" aria-hidden="true">
                      Valikko
                    </span>
                    {mobileMenuOpen ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6 6l12 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M3 12h18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 6h18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3 18h18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="appbar__tagline">Tämä on työkalu ruokapaikkojen ja reseptien jakamiseen.</div>

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

            {mobileMenuOpen ? (
              <div className="appbar__menu" role="dialog" aria-label="Valikko">
                <div className="appbar__menuGrid">
                  <NavLink className="menu-link" to="/" end>
                    Etusivu
                  </NavLink>
                  <NavLink className="menu-link" to="/ruokapaikat">
                    Ruokapaikat
                  </NavLink>
                  <NavLink className="menu-link" to="/reseptit">
                    Reseptit
                  </NavLink>
                  <NavLink className="menu-link" to="/ohjekirja">
                    Ohjekirja
                  </NavLink>
                  <NavLink className="menu-link" to="/versiohistoria">
                    Versiohistoria
                  </NavLink>

                  <div className="menu-sep" />

                  <div className="menu-meta">
                    <span className="nav-muted">{user.email || user.displayName}</span>
                    {isAdmin ? (
                      <NavLink className="chip chip--primary" to="/admin">
                        Admin
                      </NavLink>
                    ) : null}
                    <button className="linkish" onClick={() => signOut(auth)}>
                      Kirjaudu ulos
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
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
