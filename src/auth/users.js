// =====================================================================
// Firestore — `users` collection helpers
// ---------------------------------------------------------------------
// Single source of truth for reading / writing user profile data on
// Firestore. The document id is the Firebase Auth UID, so the
// signed-in user can always be located via `doc(db, 'users', uid)`.
//
// Document shape:
//   {
//     id:          <uid>,            // mirrored from doc id for convenience
//     fullName:    string,
//     email:       string,
//     phone:       string?,
//     location:    string?,
//     about:       string?,
//     photoURL:    string?,          // Google sign-in avatar
//     provider:    'email' | 'google',
//     settings:    Record<string, any>?,
//     createdAt:   serverTimestamp,
//     lastLoginAt: serverTimestamp,
//   }
// =====================================================================

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const USERS_COLLECTION = 'users'

/** Returns a `DocumentReference` for the given uid. */
export function userDocRef(uid) {
  return doc(db, USERS_COLLECTION, uid)
}

/** Returns the live `users` `CollectionReference` (admin-side reads). */
export function usersCollectionRef() {
  return collection(db, USERS_COLLECTION)
}

/**
 * Convert any Firestore Timestamp fields into plain JS millis so the
 * rest of the UI can format dates without depending on Firestore types.
 */
export function normaliseUserDoc(uid, data) {
  if (!data) return null
  const tsToMs = (v) => {
    if (!v) return undefined
    if (typeof v.toMillis === 'function') return v.toMillis()
    if (typeof v === 'number') return v
    if (typeof v === 'string') {
      const n = Date.parse(v)
      return Number.isNaN(n) ? undefined : n
    }
    return undefined
  }
  return {
    id: uid,
    fullName: data.fullName || '',
    email: data.email || '',
    phone: data.phone || '',
    location: data.location || '',
    about: data.about || '',
    photoURL: data.photoURL || '',
    provider: data.provider || 'email',
    settings: data.settings || {},
    createdAt: tsToMs(data.createdAt),
    lastLoginAt: tsToMs(data.lastLoginAt),
  }
}

/** One-shot fetch of a single user document. */
export async function fetchUserProfile(uid) {
  const snap = await getDoc(userDocRef(uid))
  if (!snap.exists()) return null
  return normaliseUserDoc(uid, snap.data())
}

/**
 * Create a brand-new user document (signup, or first-time Google
 * sign-in). Uses `setDoc` with `merge: true` so callers don't have to
 * worry about clobbering an already-existing record.
 */
export async function createUserProfile(uid, payload) {
  const data = {
    fullName: payload.fullName || '',
    email: payload.email || '',
    phone: payload.phone || '',
    location: payload.location || '',
    about: payload.about || '',
    photoURL: payload.photoURL || '',
    provider: payload.provider || 'email',
    settings: payload.settings || {},
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }
  await setDoc(userDocRef(uid), data, { merge: true })
}

/** Patch arbitrary profile fields. Only the keys provided are written. */
export async function updateUserProfile(uid, patch) {
  await updateDoc(userDocRef(uid), patch)
}

/** Bump `lastLoginAt` to a fresh server timestamp. */
export async function touchLastLogin(uid) {
  await updateDoc(userDocRef(uid), { lastLoginAt: serverTimestamp() })
}

/**
 * Delete a user profile document. NOTE: removing the underlying
 * Firebase Auth account requires the Admin SDK and cannot be done from
 * the browser — the auth credential will remain valid until the user
 * deletes their own account or it's removed server-side. The profile
 * doc going away is enough for the admin "users" listing to drop the
 * row.
 */
export async function deleteUserProfile(uid) {
  await deleteDoc(userDocRef(uid))
}

/**
 * Subscribe to live updates for the entire `users` collection. Returns
 * the unsubscribe function — call it from a cleanup effect.
 *
 *   useEffect(() => subscribeToUsers(setUsers), [])
 */
export function subscribeToUsers(onChange, onError) {
  return onSnapshot(
    usersCollectionRef(),
    (snap) => {
      const list = snap.docs.map((d) => normaliseUserDoc(d.id, d.data()))
      onChange(list)
    },
    (err) => {
      // Surface the error so the caller can show a banner, then
      // emit an empty list so the page doesn't get stuck.
      if (onError) onError(err)
      else console.warn('[firestore/users] snapshot error:', err?.message)
      onChange([])
    }
  )
}

/**
 * Map a Firebase Auth `error.code` into the
 * `{ field, error }` shape the auth UI already understands.
 */
export function mapFirebaseAuthError(err) {
  const code = err?.code || ''
  switch (code) {
    case 'auth/email-already-in-use':
      return {
        field: 'email',
        error: 'An account with this email already exists. Try logging in.',
      }
    case 'auth/invalid-email':
      return { field: 'email', error: 'Enter a valid email address.' }
    case 'auth/missing-email':
      return { field: 'email', error: 'Email is required.' }
    case 'auth/weak-password':
      return {
        field: 'password',
        error: 'Password must be at least 6 characters.',
      }
    case 'auth/missing-password':
      return { field: 'password', error: 'Password is required.' }
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return {
        field: 'password',
        error: 'Invalid email or password. Please try again.',
      }
    case 'auth/too-many-requests':
      return {
        field: 'form',
        error:
          'Too many failed attempts. Try again later or reset your password.',
      }
    case 'auth/user-disabled':
      return {
        field: 'form',
        error: 'This account has been disabled. Please contact support.',
      }
    case 'auth/network-request-failed':
      return {
        field: 'form',
        error: 'Network error. Check your connection and try again.',
      }
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return { field: 'form', error: 'Sign-in was cancelled.' }
    case 'auth/popup-blocked':
      return {
        field: 'form',
        error: 'Pop-up was blocked. Please allow pop-ups and try again.',
      }
    case 'auth/unauthorized-domain':
      return {
        field: 'form',
        error:
          'This website domain is not authorized in Firebase. Add laundry-five-pied.vercel.app in Firebase Authentication settings.',
      }
    case 'auth/account-exists-with-different-credential':
      return {
        field: 'form',
        error:
          'An account already exists with a different sign-in method for this email.',
      }
    default:
      return {
        field: 'form',
        error: err?.message || 'Something went wrong. Please try again.',
      }
  }
}
