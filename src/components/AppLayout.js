import React from 'react';
import { Link, NavLink, Outlet, Navigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../hooks/useAuth';

const ADMIN_EMAIL = 'toni@kauppinen.info';

export default function AppLayout() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  const isAdmin = user?.email && user.email.toLowerCase() === ADMIN_EMAIL;

  if (!initializing && !user && location.pathname !== '/kirjaudu') {
    return <Navigate to="/kirjaudu" replace />;
  }

  return (
    <div className={user ? 'App' : 'App App--locked'}>
      {user ? (
        <>
          <header className="App-header">
            <Link to="/" className="brand">
              <h1>Lihavuusleikattujen tukiryhmä</h1>
            </Link>
            <p>Tervetuloa! Tämä on työkalu ruokapaikkojen ja reseptien jakamiseen.</p>
          </header>

          <nav className="top-nav">
            <NavLink to="/" end>
              Etusivu
            </NavLink>
            <NavLink to="/ruokapaikat">Ruokapaikat</NavLink>
            <NavLink to="/reseptit">Reseptit</NavLink>
            <NavLink to="/versiohistoria">Versiohistoria</NavLink>

            <div className="nav-spacer" />

            {initializing ? (
              <span className="nav-muted">Tarkistetaan kirjautuminen...</span>
            ) : (
              <>
                <span className="nav-muted">{user.email || user.displayName}</span>
                {isAdmin ? <NavLink to="/admin">Admin</NavLink> : null}
                <button className="linkish" onClick={() => signOut(auth)}>
                  Kirjaudu ulos
                </button>
              </>
            )}
          </nav>

          <main className="content">
            <Outlet />
          </main>

          <footer className="footer">
            <span className="nav-muted">Lile</span>
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
