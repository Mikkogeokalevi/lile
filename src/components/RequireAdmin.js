import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ADMIN_EMAIL = 'toni@kauppinen.info';

export default function RequireAdmin({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <div>Ladataan...</div>;
  if (!user) return <Navigate to="/kirjaudu" replace state={{ from: location }} />;

  const isAdmin = user?.email && user.email.toLowerCase() === ADMIN_EMAIL;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
}
