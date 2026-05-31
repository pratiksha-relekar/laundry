// =====================================================================
// Firestore — `users` collection helpers
// ---------------------------------------------------------------------
// Single source of truth for reading / writing user profile data on
// Firestore. The document id is the user's email (lowercased) so the
// Firebase Console reads like `users/jane@example.com` instead of an
// opaque hash. The original Firebase Auth UID is preserved as the
// `uid` field on the doc so security rules can still verify ownership
// (`resource.data.uid == request.auth.uid`).
//
// users/{email}                — profile document
//   ├ uid, fullName, email, phone, location, about, photoURL,
//   │ provider, settings, createdAt, lastLoginAt
//   └ wishlist: string[]       — product ids the user has hearted
//
// Chats live in the top-level `chats` collection (see
// src/auth/chats.js) so both the buyer and the seller see the same
// thread in real-time — the previous private subcollection schema
// was buyer-only, which is why earlier messages never reached the
// seller's inbox.
//
// Listings the user has posted live in the top-level `products`
// collection (see src/auth/products.js) so every visitor sees every
// listing — query by `sellerId == email` for the user's own ads.
// =====================================================================

import {
  arrayUnion,
  arrayRemove,
  collection,
  deleteDoc,
  doc,
  getDoc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'

const USERS_COLLECTION = 'users'

/**
 * Normalise an email address into a value that's safe — and readable —
 * as a Firestore document id. Firestore allows `@` and `.` in doc ids
 * so we only need to trim and lowercase.
 */
export function emailKey(email) {
  return (email || '').trim().toLowerCase()
}

// ---------------------------------------------------------------------
//   Roles / privileges
// ---------------------------------------------------------------------
// Every user document carries a `role` field plus a `roles` array.
//   role  — primary role used for simple checks
//   roles — array of every privilege granted (supports stacking, e.g.
//           an admin who also wants to sell will have
//           ['user','seller','admin'])
//
// Hierarchy (highest → lowest):
//   admin   — full website access; can manage users, products, reviews,
//             analytics and roles
//   seller  — can list / manage products on the marketplace
//   user    — default; can browse, wishlist, chat
// ---------------------------------------------------------------------

export const ROLES = Object.freeze({
  USER: 'user',
  SELLER: 'seller',
  ADMIN: 'admin',
})

export const ROLE_LABEL = {
  [ROLES.USER]: 'User',
  [ROLES.SELLER]: 'Seller',
  [ROLES.ADMIN]: 'Admin',
}

/** Returns the canonical `roles` array that matches a given primary role. */
function rolesForPrimary(role) {
  switch (role) {
    case ROLES.ADMIN:
      return [ROLES.USER, ROLES.SELLER, ROLES.ADMIN]
    case ROLES.SELLER:
      return [ROLES.USER, ROLES.SELLER]
    case ROLES.USER:
    default:
      return [ROLES.USER]
  }
}

/** Does this profile object grant the given role? */
export function userHasRole(user, role) {
  if (!user || !role) return false
  if (user.role === role) return true
  return Array.isArray(user.roles) && user.roles.includes(role)
}

export function userIsAdmin(user) {
  return userHasRole(user, ROLES.ADMIN)
}

export function userIsSeller(user) {
  return userHasRole(user, ROLES.SELLER) || userIsAdmin(user)
}

/**
 * Returns a `DocumentReference` for the given user. The `id` argument
 * is the document key — i.e. the lowercased email address (call
 * `emailKey()` first if you have a raw value from the user). For
 * backward compatibility we still accept a Firebase Auth UID; callers
 * are responsible for routing the right value.
 */
export function userDocRef(id) {
  return doc(db, USERS_COLLECTION, id)
}

/** Returns the live `users` `CollectionReference` (admin-side reads). */
export function usersCollectionRef() {
  return collection(db, USERS_COLLECTION)
}

/**
 * Convert any Firestore Timestamp fields into plain JS millis so the
 * rest of the UI can format dates without depending on Firestore types.
 */
function tsToMs(v) {
  if (!v) return undefined
  if (typeof v.toMillis === 'function') return v.toMillis()
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Date.parse(v)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

export function normaliseUserDoc(id, data) {
  if (!data) return null
  const role =
    data.role && Object.values(ROLES).includes(data.role) ? data.role : ROLES.USER
  const roles = Array.isArray(data.roles) && data.roles.length > 0
    ? data.roles.filter((r) => Object.values(ROLES).includes(r))
    : rolesForPrimary(role)
  return {
    id,
    uid: data.uid || '',
    fullName: data.fullName || '',
    email: data.email || id,
    phone: data.phone || '',
    location: data.location || '',
    about: data.about || '',
    photoURL: data.photoURL || '',
    provider: data.provider || 'email',
    settings: data.settings || {},
    role,
    roles,
    wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
    adsCount: typeof data.adsCount === 'number' ? data.adsCount : 0,
    chatsCount: typeof data.chatsCount === 'number' ? data.chatsCount : 0,
    createdAt: tsToMs(data.createdAt),
    lastLoginAt: tsToMs(data.lastLoginAt),
  }
}

/** One-shot fetch of a single user document by email-key. */
export async function fetchUserProfile(id) {
  const snap = await getDoc(userDocRef(id))
  if (!snap.exists()) return null
  return normaliseUserDoc(id, snap.data())
}

/**
 * Create a brand-new user document (signup, or first-time Google
 * sign-in). The doc id is the user's email; the Firebase Auth UID is
 * stored as the `uid` field so security rules can verify ownership.
 * Uses `setDoc` with `merge: true` so callers don't have to worry
 * about clobbering an already-existing record.
 */
export async function createUserProfile(id, payload) {
  const role =
    payload.role && Object.values(ROLES).includes(payload.role)
      ? payload.role
      : ROLES.USER
  const data = {
    uid: payload.uid || '',
    fullName: payload.fullName || '',
    email: payload.email || id,
    phone: payload.phone || '',
    location: payload.location || '',
    about: payload.about || '',
    photoURL: payload.photoURL || '',
    provider: payload.provider || 'email',
    settings: payload.settings || {},
    role,
    roles: rolesForPrimary(role),
    wishlist: Array.isArray(payload.wishlist) ? payload.wishlist : [],
    adsCount: 0,
    chatsCount: 0,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  }
  await setDoc(userDocRef(id), data, { merge: true })
}

/**
 * Look up — and if necessary migrate — the Firestore profile for a
 * given Firebase Auth user. Resolution order:
 *
 *   1. If `users/{emailKey}` exists, return it.
 *   2. Else if a legacy `users/{uid}` doc exists, copy it to
 *      `users/{emailKey}` (with `uid` + `email` fields populated) and
 *      delete the old doc so the console stays clean.
 *   3. Otherwise create a brand-new email-keyed doc seeded from the
 *      Firebase Auth profile.
 *
 * Returns the normalised profile, or `null` if anything went wrong.
 */
export async function ensureUserProfile(authUser) {
  if (!authUser?.email) return null
  const id = emailKey(authUser.email)
  if (!id) return null

  const newRef = userDocRef(id)
  const existing = await getDoc(newRef)
  if (existing.exists()) {
    const data = existing.data()
    // Backfill uid on legacy email-keyed docs that pre-date this
    // change (the security rules need it to verify ownership).
    if (!data.uid && authUser.uid) {
      try {
        await updateDoc(newRef, { uid: authUser.uid })
      } catch {
        /* non-fatal */
      }
      data.uid = authUser.uid
    }
    return normaliseUserDoc(id, data)
  }

  // 2. Try to migrate from a legacy `users/{uid}` doc.
  if (authUser.uid) {
    const legacyRef = userDocRef(authUser.uid)
    const legacySnap = await getDoc(legacyRef)
    if (legacySnap.exists()) {
      const legacyData = legacySnap.data()
      const migrated = {
        ...legacyData,
        uid: authUser.uid,
        email: authUser.email || legacyData.email || id,
        migratedFrom: authUser.uid,
        migratedAt: serverTimestamp(),
      }
      try {
        await setDoc(newRef, migrated, { merge: true })
        // Tidy up — delete the old hash-named doc now that the data
        // is safely under the email-keyed id.
        await deleteDoc(legacyRef)
      } catch (err) {
        console.warn('[users] legacy migration failed:', err?.message)
      }
      return normaliseUserDoc(id, migrated)
    }
  }

  // 3. Brand-new account.
  await createUserProfile(id, {
    uid: authUser.uid,
    fullName:
      authUser.displayName || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    photoURL: authUser.photoURL || '',
    provider:
      authUser.providerData?.[0]?.providerId === 'google.com'
        ? 'google'
        : 'email',
  })
  const fresh = await getDoc(newRef)
  return fresh.exists() ? normaliseUserDoc(id, fresh.data()) : null
}

/**
 * Live-subscribe to a single user's profile document. Useful for
 * fields that change at runtime (e.g. wishlist).
 */
export function subscribeToUserDoc(id, onChange, onError) {
  if (!id) {
    onChange(null)
    return () => {}
  }
  return onSnapshot(
    userDocRef(id),
    (snap) => {
      onChange(snap.exists() ? normaliseUserDoc(id, snap.data()) : null)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('[firestore/users] doc subscribe error:', err?.message)
      onChange(null)
    }
  )
}

/** Patch arbitrary profile fields. Only the keys provided are written. */
export async function updateUserProfile(id, patch) {
  await updateDoc(userDocRef(id), patch)
}

/** Bump `lastLoginAt` to a fresh server timestamp. */
export async function touchLastLogin(id) {
  await updateDoc(userDocRef(id), { lastLoginAt: serverTimestamp() })
}

/**
 * Delete a user profile document. NOTE: removing the underlying
 * Firebase Auth account requires the Admin SDK and cannot be done from
 * the browser — the auth credential will remain valid until the user
 * deletes their own account or it's removed server-side. The profile
 * doc going away is enough for the admin "users" listing to drop the
 * row.
 */
export async function deleteUserProfile(id) {
  await deleteDoc(userDocRef(id))
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
      // Stable alphabetical order so the admin list is easy to scan
      // (email-based ids show up in sequence: a… → z…).
      list.sort((a, b) => (a.id || '').localeCompare(b.id || ''))
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

// ---------------------------------------------------------------------
//   Role management
// ---------------------------------------------------------------------

/**
 * Set a user's primary role. Also resets the `roles` array so it matches
 * the hierarchy (admin grants seller + user implicitly, seller grants
 * user implicitly). Intended for admin use.
 */
export async function setUserRole(id, role) {
  if (!id) throw new Error('setUserRole: missing id')
  if (!Object.values(ROLES).includes(role)) {
    throw new Error(`setUserRole: invalid role "${role}"`)
  }
  await updateDoc(userDocRef(id), {
    role,
    roles: rolesForPrimary(role),
  })
}

/** Grant an additional role without changing the primary role. */
export async function grantRole(id, role) {
  if (!id || !Object.values(ROLES).includes(role)) return
  await updateDoc(userDocRef(id), { roles: arrayUnion(role) })
}

/** Revoke a role (cannot revoke the base 'user' role). */
export async function revokeRole(id, role) {
  if (!id || !Object.values(ROLES).includes(role)) return
  if (role === ROLES.USER) return
  await updateDoc(userDocRef(id), { roles: arrayRemove(role) })
}

// ---------------------------------------------------------------------
//   Wishlist (array field on the user doc)
// ---------------------------------------------------------------------

/** Add a product id to the user's wishlist (idempotent via arrayUnion). */
export async function addToWishlist(id, productId) {
  if (!id || !productId) return
  await updateDoc(userDocRef(id), { wishlist: arrayUnion(productId) })
}

/** Remove a product id from the user's wishlist. */
export async function removeFromWishlist(id, productId) {
  if (!id || !productId) return
  await updateDoc(userDocRef(id), { wishlist: arrayRemove(productId) })
}

/** Wipe the entire wishlist. */
export async function clearWishlist(id) {
  if (!id) return
  await updateDoc(userDocRef(id), { wishlist: [] })
}

// ---------------------------------------------------------------------
//   Seller ad counters (the listings themselves live in
//   src/auth/products.js — top-level `products` collection)
// ---------------------------------------------------------------------

/** Bump the seller's adsCount when a new product is published. */
export async function bumpAdsCount(id, delta = 1) {
  if (!id) return
  try {
    await updateDoc(userDocRef(id), { adsCount: increment(delta) })
  } catch (err) {
    // Non-fatal — the live `products` query is the source of truth.
    console.warn('[users] bumpAdsCount failed:', err?.message)
  }
}

/**
 * When a seller deletes their last listing, demote primary role to buyer (`user`).
 * Does not run for sellers who simply have not posted yet. Admins are never demoted.
 *
 * @param {string} sellerId — user doc id (email key)
 * @param {number} listingCount — live count from `countSellerProducts`
 */
export async function demoteToBuyerIfNoListings(sellerId, listingCount) {
  const id = emailKey(sellerId)
  if (!id || listingCount > 0) return false

  const snap = await getDoc(userDocRef(id))
  if (!snap.exists()) return false

  const data = snap.data()
  const roles = Array.isArray(data.roles) ? data.roles : []

  if (data.role === ROLES.ADMIN || roles.includes(ROLES.ADMIN)) {
    return false
  }

  const isSeller =
    data.role === ROLES.SELLER || roles.includes(ROLES.SELLER)
  if (!isSeller) return false

  await updateDoc(userDocRef(id), {
    role: ROLES.USER,
    roles: rolesForPrimary(ROLES.USER),
    adsCount: 0,
  })
  return true
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
    case 'auth/expired-action-code':
      return {
        field: 'form',
        error: 'This reset link has expired. Go to login and request a new one.',
      }
    case 'auth/invalid-action-code':
      return {
        field: 'form',
        error: 'This reset link is invalid or already used. Request a new one from login.',
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
      // The AuthContext now auto-falls-back to a full-page redirect
      // when this error fires, so end-users shouldn't usually see this
      // string — but we keep it readable for the rare case where the
      // redirect also fails (e.g. inside an embedded webview).
      return {
        field: 'form',
        error:
          'Pop-up was blocked. We tried redirecting instead — if nothing happens, please allow pop-ups for this site and try again.',
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
          'An account with this email already exists. Please sign in with the original method (e.g. email + password) instead of Google.',
      }
    case 'auth/credential-already-in-use':
      return {
        field: 'form',
        error:
          'This Google account is already linked to another user. Sign out and try again.',
      }
    default:
      return {
        field: 'form',
        error: err?.message || 'Something went wrong. Please try again.',
      }
  }
}
