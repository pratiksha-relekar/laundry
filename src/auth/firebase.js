 // =====================================================================
// Firebase client setup
// ---------------------------------------------------------------------
// Single source of truth for the Firebase JS SDK on the consumer side
// of the Laundry app. Import the named exports from this file anywhere
// you need to talk to Firebase — never call `initializeApp` again.
//
//   import { auth, db, storage, googleProvider } from '../auth/firebase'
//
// NOTE on the API key: client-side Firebase config is *not* a secret.
// The key only identifies the Firebase project; real security lives in
// the Firestore / Storage / Auth rules configured in the Firebase
// console. If you would still rather move it into env vars later, drop
// it into a `.env` file as `VITE_FIREBASE_API_KEY=...` and swap the
// literals below for `import.meta.env.VITE_FIREBASE_API_KEY` etc.
// =====================================================================

import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import {
  getAnalytics,
  isSupported as isAnalyticsSupported,
} from 'firebase/analytics'

// ---- Project configuration ----------------------------------------------
// Pulled straight from the Firebase console (laundry-af623).
export const firebaseConfig = {
  apiKey: 'AIzaSyCI7PHi9Am8Zages7wcpOZvZbf4YQTWrcY',
  authDomain: 'laundry-af623.firebaseapp.com',
  projectId: 'laundry-af623',
  storageBucket: 'laundry-af623.firebasestorage.app',
  messagingSenderId: '197991972366',
  appId: '1:197991972366:web:23f97a37a8ea2a8829865f',
  measurementId: 'G-KJ8TEV71W9',
}

// ---- App singleton ------------------------------------------------------
// Hot module reloads (Vite dev) can re-evaluate this file. Guard against
// re-initialising the default app, which would otherwise throw.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

// ---- Auth ---------------------------------------------------------------
export const auth = getAuth(app)

// Google sign-in provider, pre-configured to always show the account
// picker (avoids silently re-using whichever Google account is cached
// in the browser).
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

// ---- Firestore + Storage ------------------------------------------------
export const db = getFirestore(app)
export const storage = getStorage(app)

// ---- Analytics ----------------------------------------------------------
// Analytics requires `window` + a supporting browser. Falls back to
// `null` in environments where it can't run (SSR, unsupported browsers,
// blocked by tracking-protection, etc.) so callers can `if (analytics)`
// before logging events.
let analyticsInstance = null

if (typeof window !== 'undefined') {
  isAnalyticsSupported()
    .then((supported) => {
      if (supported) {
        try {
          analyticsInstance = getAnalytics(app)
        } catch (err) {
          // Analytics is best-effort — never let it crash the app.
          console.warn('[firebase] analytics init failed:', err?.message)
        }
      }
    })
    .catch(() => {
      /* not supported — ignore */
    })
}

/** Returns the live `Analytics` instance, or `null` if unavailable. */
export function getAnalyticsSafe() {
  return analyticsInstance
}

export default app
