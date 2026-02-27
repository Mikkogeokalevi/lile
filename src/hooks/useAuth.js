import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
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
        const ref = doc(db, 'users', nextUser.uid);
        runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          if (!snap.exists()) {
            tx.set(ref, {
              uid: nextUser.uid,
              email: nextUser.email || '',
              displayName: nextUser.displayName || '',
              status: 'active',
              createdAt: serverTimestamp(),
              lastSeenAt: serverTimestamp(),
            });
            return;
          }

          tx.update(ref, {
            email: nextUser.email || '',
            displayName: nextUser.displayName || '',
            lastSeenAt: serverTimestamp(),
          });
        }).catch(() => {});
      }
    });

    return () => unsub();
  }, []);

  return { user, initializing };
}
