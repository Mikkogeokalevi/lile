import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <div>Ladataan...</div>;
  if (!user) return <Navigate to="/kirjaudu" replace state={{ from: location }} />;

  return children;
}
