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
  getRedirectResult,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile as updateAuthProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../auth/firebase'
import {
  ROLES,
  emailKey,
  ensureUserProfile,
  mapFirebaseAuthError,
  setUserRole as fbSetUserRole,
  touchLastLogin,
  updateUserProfile,
  userIsAdmin,
  userIsSeller,
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

  /**
   * Build a minimal user object straight from the Firebase Auth
   * credential so the UI can navigate instantly after login/signup.
   * The full Firestore profile arrives in the background via
   * `hydrateUser` (or the `onAuthStateChanged` listener) and patches in
   * any extra fields (phone, location, role, etc.).
   */
  const optimisticUserFromAuth = useCallback((authUser, overrides = {}) => {
    if (!authUser) return null
    const provider =
      authUser.providerData?.[0]?.providerId === 'google.com'
        ? 'google'
        : 'email'
    const id = emailKey(authUser.email)
    return {
      // We use the email (lowercased) as the user id so the Firestore
      // doc ids stay human-readable. The Firebase Auth UID is kept on
      // the side as `uid` for security-rule checks.
      id,
      uid: authUser.uid,
      fullName:
        overrides.fullName ||
        authUser.displayName ||
        authUser.email?.split('@')[0] ||
        '',
      email: authUser.email || id,
      phone: '',
      location: '',
      about: '',
      photoURL: authUser.photoURL || '',
      provider,
      role: ROLES.USER,
      roles: [ROLES.USER],
      wishlist: [],
      adsCount: 0,
      chatsCount: 0,
      ...overrides,
    }
  }, [])

  /**
   * Pulls (and if necessary migrates) the Firestore profile for the
   * given auth user. `ensureUserProfile` handles three cases:
   * already-email-keyed doc, legacy uid-keyed doc (auto-migrates), or
   * brand-new account.
   *
   * `overrides` lets the caller supply fields that aren't on the
   * Firebase Auth user yet (e.g. a freshly entered display name
   * during signup, before `updateProfile` has resolved).
   */
  const hydrateUser = useCallback(async (authUser, overrides = {}) => {
    if (!authUser) {
      setUser(null)
      return
    }
    const proxy = {
      uid: authUser.uid,
      email: authUser.email,
      displayName: overrides.displayName || authUser.displayName,
      photoURL: overrides.photoURL || authUser.photoURL,
      providerData: authUser.providerData,
    }
    const profile = await ensureUserProfile(proxy)
    if (isMounted.current && profile) setUser(profile)
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

  // When the popup flow was blocked we fall back to a full-page
  // redirect (`signInWithRedirect`). After Google redirects the user
  // back to the app, `getRedirectResult` resolves with the credential
  // on the very next render — hydrate the Firestore doc and we're
  // logged in. Returns null when there's no pending redirect, so this
  // is safe to call on every load.
  useEffect(() => {
    let cancelled = false
    getRedirectResult(auth)
      .then(async (cred) => {
        if (cancelled || !cred?.user) return
        try {
          await hydrateUser(cred.user)
          await touchLastLogin(emailKey(cred.user.email)).catch(() => {})
        } catch (err) {
          console.warn('[auth] redirect hydrate failed:', err?.message)
        }
      })
      .catch((err) => {
        // `null` (no pending redirect) is fine; everything else is
        // worth logging but not surfacing to the user — they'll see
        // the next login attempt's error if any.
        console.warn('[auth] getRedirectResult:', err?.message)
      })
    return () => {
      cancelled = true
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
          field: 'firstName',
          error: 'Please enter your first name.',
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
        // Snap the UI to the new session right away — the rest of the
        // writes happen in the background so navigation feels instant.
        if (isMounted.current) {
          setUser(optimisticUserFromAuth(cred.user, { fullName: name, email: mail }))
        }
        // Fire-and-forget: keep the Firebase Auth `displayName` and
        // the Firestore profile in sync. `ensureUserProfile` (inside
        // hydrateUser) writes the doc using the email as the key.
        updateAuthProfile(cred.user, { displayName: name }).catch(() => {})
        hydrateUser(cred.user, { displayName: name }).catch((err) =>
          console.warn('[auth] hydrate after signup failed:', err?.message)
        )
        return { ok: true }
      } catch (err) {
        return { ok: false, ...mapFirebaseAuthError(err) }
      }
    },
    [hydrateUser, optimisticUserFromAuth]
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
        if (isMounted.current) {
          setUser((prev) => prev || optimisticUserFromAuth(cred.user))
        }
        touchLastLogin(emailKey(cred.user.email)).catch(() => {})
        hydrateUser(cred.user).catch(() => {})
        return { ok: true }
      } catch (err) {
        return { ok: false, ...mapFirebaseAuthError(err) }
      }
    },
    [hydrateUser, optimisticUserFromAuth]
  )

  // -------------------- loginGoogle ----------------------------------
  // Tries the popup flow first (best UX) and silently falls back to the
  // redirect flow when the browser blocks the popup. The redirect
  // result is picked up by the `getRedirectResult` effect on mount so
  // the user always lands signed-in.
  //
  // Duplicate-protection: `ensureUserProfile` keys the Firestore doc
  // by email, so the same Google account / same email never creates a
  // second row in the `users` collection. If the account already
  // exists with a different sign-in method (e.g. email/password),
  // Firebase returns `auth/account-exists-with-different-credential`
  // which `mapFirebaseAuthError` surfaces with a friendly message.
  const loginGoogle = useCallback(async () => {
    const completeSignIn = (authUser) => {
      if (!authUser) return
      if (isMounted.current) {
        setUser((prev) => prev || optimisticUserFromAuth(authUser))
      }
      ;(async () => {
        try {
          await hydrateUser(authUser)
          await touchLastLogin(emailKey(authUser.email)).catch(() => {})
        } catch (err) {
          console.warn('[auth] google hydrate failed:', err?.message)
        }
      })()
    }

    try {
      const cred = await signInWithPopup(auth, googleProvider)
      completeSignIn(cred.user)
      return { ok: true }
    } catch (err) {
      const code = err?.code || ''
      // Pop-up couldn't open (blocked by the browser / extension) →
      // fall back to a full-page redirect so the user doesn't have to
      // unblock anything. The redirect result is picked up on the
      // next render by `getRedirectResult` below.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        try {
          await signInWithRedirect(auth, googleProvider)
          return { ok: true, redirecting: true }
        } catch (redirErr) {
          return { ok: false, ...mapFirebaseAuthError(redirErr) }
        }
      }
      // `popup-closed-by-user` / `cancelled-popup-request` are user
      // choices — surface them but don't trigger a redirect loop.
      return { ok: false, ...mapFirebaseAuthError(err) }
    }
  }, [hydrateUser, optimisticUserFromAuth])

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

  /**
   * Promote the signed-in user to seller (or any allowed role). Returns
   * the same `{ ok, error? }` shape used by the other auth methods.
   * Self-upgrade to admin is blocked — only existing admins can grant
   * admin via the admin Users page.
   */
  const becomeSeller = useCallback(async () => {
    if (!user) return { ok: false, error: 'You must be logged in.' }
    if (userIsSeller(user)) return { ok: true }
    try {
      await fbSetUserRole(user.id, ROLES.SELLER)
      setUser((prev) =>
        prev
          ? { ...prev, role: ROLES.SELLER, roles: ['user', 'seller'] }
          : prev
      )
      if (auth.currentUser) {
        await hydrateUser(auth.currentUser).catch(() => {})
      }
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err?.message || 'Could not update role.' }
    }
  }, [user, hydrateUser])

  /** Re-read Firestore profile after role changes (e.g. seller → buyer). */
  const refreshUserProfile = useCallback(async () => {
    const authUser = auth.currentUser
    if (!authUser) return
    await hydrateUser(authUser)
  }, [hydrateUser])

  const applyBuyerRoleLocally = useCallback(() => {
    setUser((prev) =>
      prev
        ? { ...prev, role: ROLES.USER, roles: [ROLES.USER], adsCount: 0 }
        : prev
    )
  }, [])

  const role = user?.role || ROLES.USER
  const isAdmin = userIsAdmin(user)
  const isSeller = userIsSeller(user)

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      role,
      isAdmin,
      isSeller,
      signup,
      login,
      loginGoogle,
      logout,
      updateProfile,
      becomeSeller,
      refreshUserProfile,
      applyBuyerRoleLocally,
    }),
    [
      user,
      loading,
      role,
      isAdmin,
      isSeller,
      signup,
      login,
      loginGoogle,
      logout,
      updateProfile,
      becomeSeller,
      refreshUserProfile,
      applyBuyerRoleLocally,
    ]
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
