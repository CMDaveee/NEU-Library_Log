import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyAMNPEQy9ViWEDt6Ehqmh5QBY8v1RO_nsw',
  authDomain:        'neu-library-log-bd990.firebaseapp.com',
  projectId:         'neu-library-log-bd990',
  storageBucket:     'neu-library-log-bd990.firebasestorage.app',
  messagingSenderId: '12855431980',
  appId:             '1:12855431980:web:a1373ca48df3a18947d289',
  measurementId:     'G-MVF1SRGK78',
};

const app       = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth      = getAuth(app);
const db        = getFirestore(app);
const provider  = new GoogleAuthProvider();

// Force account picker every time
provider.setCustomParameters({ prompt: 'select_account' });

export { app, analytics, auth, db, provider };
