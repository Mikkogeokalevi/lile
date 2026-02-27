import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

import { onSnapshot, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

import { auth, db } from '../firebase';

export default function RequireAuth({ children }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  const [status, setStatus] = React.useState('');
  const [statusLoading, setStatusLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user?.uid) {
      setStatus('');
      setStatusLoading(false);
      return undefined;
    }

    setStatusLoading(true);
    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const s = snap.exists() ? String(snap.data()?.status || '') : '';
        setStatus(s);
        setStatusLoading(false);
      },
      () => {
        setStatus('');
        setStatusLoading(false);
      }
    );
    return () => unsub();
  }, [user?.uid]);

  React.useEffect(() => {
    if (!user) return;
    if (status !== 'blocked' && status !== 'deleted') return;
    signOut(auth).catch(() => {});
  }, [status, user]);

  if (initializing) return <div>Ladataan...</div>;
  if (!user) return <Navigate to="/kirjaudu" replace state={{ from: location }} />;
  if (statusLoading) return <div>Ladataan...</div>;
  if (status === 'blocked' || status === 'deleted') {
    return <Navigate to="/kirjaudu" replace state={{ from: location, blocked: true }} />;
  }

  return children;
}
