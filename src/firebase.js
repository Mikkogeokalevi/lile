import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBl26SC7qSuHRqhKA4WoK6CsN5Paj4mi58',
  authDomain: 'lile-ry.firebaseapp.com',
  projectId: 'lile-ry',
  storageBucket: 'lile-ry.firebasestorage.app',
  messagingSenderId: '465367382667',
  appId: '1:465367382667:web:72649de9dbf85f03d5b28e',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
