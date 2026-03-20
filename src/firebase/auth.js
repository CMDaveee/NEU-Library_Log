import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, provider } from './config.js';
import { ADMIN_EMAILS } from '../data/constants.js';

/** Sign in with Google popup */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user   = result.user;
  return {
    uid:     user.uid,
    email:   user.email,
    name:    user.displayName,
    photo:   user.photoURL,
    isAdmin: ADMIN_EMAILS.includes(user.email),
    isNew:   result._tokenResponse?.isNewUser ?? false,
  };
}

/** Sign out */
export async function logOut() {
  await signOut(auth);
}

/** Subscribe to auth state changes — returns unsubscribe fn */
export function onAuthChange(cb) {
  return onAuthStateChanged(auth, firebaseUser => {
    if (!firebaseUser) { cb(null); return; }
    cb({
      uid:     firebaseUser.uid,
      email:   firebaseUser.email,
      name:    firebaseUser.displayName,
      photo:   firebaseUser.photoURL,
      isAdmin: ADMIN_EMAILS.includes(firebaseUser.email),
    });
  });
}
