import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { db } from '../firebase';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setInitializing(false);

      if (nextUser?.uid) {
        setDoc(
          doc(db, 'users', nextUser.uid),
          {
            uid: nextUser.uid,
            email: nextUser.email || '',
            displayName: nextUser.displayName || '',
            status: 'active',
            lastSeenAt: serverTimestamp(),
          },
          { merge: true }
        ).catch(() => {});
      }
    });

    return () => unsub();
  }, []);

  return { user, initializing };
}
