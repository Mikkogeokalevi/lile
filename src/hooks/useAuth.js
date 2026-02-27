import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
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
        (async () => {
          try {
            const snap = await getDoc(ref);
            if (!snap.exists()) {
              await setDoc(ref, {
                uid: nextUser.uid,
                email: nextUser.email || '',
                displayName: nextUser.displayName || '',
                status: 'active',
                createdAt: serverTimestamp(),
                lastSeenAt: serverTimestamp(),
              });
              return;
            }

            await updateDoc(ref, {
              email: nextUser.email || '',
              displayName: nextUser.displayName || '',
              lastSeenAt: serverTimestamp(),
            });
          } catch {
            // ignore
          }
        })();
      }
    });

    return () => unsub();
  }, []);

  return { user, initializing };
}
