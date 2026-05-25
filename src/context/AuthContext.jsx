import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateAuthProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../auth/firebase'
import {
  createUserProfile,
  fetchUserProfile,
  mapFirebaseAuthError,
  touchLastLogin,
  updateUserProfile,
} from '../auth/users'

// =====================================================================
// AuthContext (Firebase-backed)
// ---------------------------------------------------------------------
// All user identity data now lives in Firebase:
//   • Firebase Auth       — credentials, session, password
//   • Firestore `users/{uid}` — profile fields (name, phone, etc.)
//
// The signed-in user object exposed to the rest of the app is the
// merged Firestore profile (id, fullName, email, phone, location, etc.)
// which keeps the existing UI code untouched.
//
// API (every method returns a Promise resolving to { ok, field?, error? }):
//   signup({ fullName, email, password, confirmPassword })
//   login({ email, password })
//   loginGoogle()
//   logout()
//   updateProfile({ fullName?, phone?, location?, about?, settings? })
//
// Additional state:
//   loading            — true while Firebase is hydrating the session
//   isAuthenticated    — boolean shortcut
// =====================================================================

const AuthContext = createContext(null)

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  // Tracks whether we have a Firebase Auth subscription yet — used to
  // ignore stale `onAuthStateChanged` callbacks after logout, etc.
  const isMounted = useRef(true)

  /** Pulls the Firestore profile for the given auth user and stores it. */
  const hydrateUser = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null)
      return
    }
    let profile = await fetchUserProfile(authUser.uid)
    if (!profile) {
      // Auth account exists but the Firestore doc was wiped / never
      // created. Recreate it from the auth metadata so the app stays
      // consistent.
      await createUserProfile(authUser.uid, {
        fullName: authUser.displayName || authUser.email?.split('@')[0] || 'User',
        email: authUser.email || '',
        photoURL: authUser.photoURL || '',
        provider: authUser.providerData?.[0]?.providerId === 'google.com'
          ? 'google'
          : 'email',
      })
      profile = await fetchUserProfile(authUser.uid)
    }
    if (isMounted.current) setUser(profile)
  }, [])

  useEffect(() => {
    isMounted.current = true
    const unsubscribe = onAuthStateChanged(
      auth,
      async (authUser) => {
        try {
          await hydrateUser(authUser)
        } catch (err) {
          console.warn('[auth] hydrate failed:', err?.message)
          if (isMounted.current) setUser(null)
        } finally {
          if (isMounted.current) setLoading(false)
        }
      },
      (err) => {
        console.warn('[auth] subscription error:', err?.message)
        if (isMounted.current) {
          setUser(null)
          setLoading(false)
        }
      }
    )
    return () => {
      isMounted.current = false
      unsubscribe()
    }
  }, [hydrateUser])

  // -------------------- signup ---------------------------------------
  const signup = useCallback(
    async ({ fullName, email, password, confirmPassword }) => {
      const name = (fullName || '').trim()
      const mail = (email || '').trim().toLowerCase()

      // Local validation first — match the previous synchronous behaviour
      // so the UI never has to wait on a network round-trip for obvious
      // input errors.
      if (!name)
        return {
          ok: false,
          field: 'fullName',
          error: 'Please enter your full name.',
        }
      if (!mail) return { ok: false, field: 'email', error: 'Email is required.' }
      if (!isValidEmail(mail))
        return { ok: false, field: 'email', error: 'Enter a valid email address.' }
      if (!password || password.length < 6)
        return {
          ok: false,
          field: 'password',
          error: 'Password must be at least 6 characters.',
        }
      if (password !== confirmPassword)
        return {
          ok: false,
          field: 'confirmPassword',
          error: 'Passwords do not match.',
        }

      try {
        const cred = await createUserWithEmailAndPassword(auth, mail, password)
        // Mirror the name to the Firebase Auth profile (useful for the
        // Google-style "displayName" surfaces).
        try {
          await updateAuthProfile(cred.user, { displayName: name })
        } catch {
          /* non-fatal */
        }
        // Create the Firestore document — UID is the doc id.
        await createUserProfile(cred.user.uid, {
          fullName: name,
          email: mail,
          provider: 'email',
        })
        await hydrateUser(cred.user)
        return { ok: true }
      } catch (err) {
        return { ok: false, ...mapFirebaseAuthError(err) }
      }
    },
    [hydrateUser]
  )

  // -------------------- login ----------------------------------------
  const login = useCallback(
    async ({ email, password }) => {
      const mail = (email || '').trim().toLowerCase()
      if (!mail) return { ok: false, field: 'email', error: 'Email is required.' }
      if (!isValidEmail(mail))
        return { ok: false, field: 'email', error: 'Enter a valid email address.' }
      if (!password)
        return { ok: false, field: 'password', error: 'Password is required.' }

      try {
        const cred = await signInWithEmailAndPassword(auth, mail, password)
        // Bump `lastLoginAt`. If the doc doesn't exist yet (legacy /
        // imported users) hydrateUser will recreate it.
        try {
          await touchLastLogin(cred.user.uid)
        } catch {
          /* non-fatal — hydrate below may create the doc */
        }
        await hydrateUser(cred.user)
        return { ok: true }
      } catch (err) {
        return { ok: false, ...mapFirebaseAuthError(err) }
      }
    },
    [hydrateUser]
  )

  // -------------------- loginGoogle ----------------------------------
  const loginGoogle = useCallback(async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      const authUser = cred.user
      // Check if a profile already exists; otherwise create one.
      const existing = await fetchUserProfile(authUser.uid)
      if (!existing) {
        await createUserProfile(authUser.uid, {
          fullName: authUser.displayName || 'Google User',
          email: authUser.email || '',
          photoURL: authUser.photoURL || '',
          provider: 'google',
        })
      } else {
        try {
          await touchLastLogin(authUser.uid)
        } catch {
          /* non-fatal */
        }
      }
      await hydrateUser(authUser)
      return { ok: true }
    } catch (err) {
      return { ok: false, ...mapFirebaseAuthError(err) }
    }
  }, [hydrateUser])

  // -------------------- logout ---------------------------------------
  const logout = useCallback(async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.warn('[auth] sign-out failed:', err?.message)
    }
    setUser(null)
    return { ok: true }
  }, [])

  // -------------------- updateProfile --------------------------------
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) return { ok: false, error: 'You must be logged in.' }
      const allowed = ['fullName', 'phone', 'location', 'about', 'settings']
      const patch = {}
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          patch[key] = updates[key]
        }
      }
      if (Object.keys(patch).length === 0) {
        return { ok: false, error: 'Nothing to update.' }
      }

      try {
        await updateUserProfile(user.id, patch)
        // Mirror the displayName onto the Firebase Auth account so it
        // shows up in Auth-driven UI (e.g. Google badges).
        if (patch.fullName && auth.currentUser) {
          try {
            await updateAuthProfile(auth.currentUser, { displayName: patch.fullName })
          } catch {
            /* non-fatal */
          }
        }
        setUser((prev) => (prev ? { ...prev, ...patch } : prev))
        return { ok: true }
      } catch (err) {
        return { ok: false, error: err?.message || 'Failed to update profile.' }
      }
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      signup,
      login,
      loginGoogle,
      logout,
      updateProfile,
    }),
    [user, loading, signup, login, loginGoogle, logout, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}
