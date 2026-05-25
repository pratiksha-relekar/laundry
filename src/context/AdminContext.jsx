import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

// =====================================================================
// AdminContext
// ---------------------------------------------------------------------
// Manages the admin session. Completely separate from the consumer-side
// AuthContext — an admin is NOT a regular user. Credentials default to:
//
//   username: admin
//   password: admin123
//
// The password is editable from the Settings page and is persisted in
// localStorage so it survives reloads. Profile fields (name, email) are
// likewise editable + persisted alongside the session.
// =====================================================================

const AdminContext = createContext(null)
const STORAGE_KEY = 'laundry:admin'
const PASSWORD_KEY = 'laundry:admin:password'
const PROFILE_KEY = 'laundry:admin:profile'

const ADMIN_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'admin123'
const DEFAULT_PROFILE = {
  name: 'Administrator',
  email: 'admin@laundry.app',
  role: 'Super admin',
}

function readStored() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function readStoredPassword() {
  if (typeof window === 'undefined') return DEFAULT_PASSWORD
  try {
    const raw = window.localStorage.getItem(PASSWORD_KEY)
    return raw && raw.length > 0 ? raw : DEFAULT_PASSWORD
  } catch {
    return DEFAULT_PASSWORD
  }
}

function writeStoredPassword(value) {
  try {
    window.localStorage.setItem(PASSWORD_KEY, value)
  } catch {
    /* quota / privacy mode — ignore */
  }
}

function readStoredProfile() {
  if (typeof window === 'undefined') return { ...DEFAULT_PROFILE }
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return { ...DEFAULT_PROFILE, ...(parsed || {}) }
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

function writeStoredProfile(value) {
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(readStored)
  const [profile, setProfile] = useState(readStoredProfile)
  // Password is tracked as state (so consumers can reactively show
  // "default password in use" warnings) AND mirrored to a ref so event
  // handlers below can read the latest value without stale closures.
  const [password, setPassword] = useState(readStoredPassword)
  const passwordRef = useRef(password)

  useEffect(() => {
    passwordRef.current = password
  }, [password])

  useEffect(() => {
    try {
      if (admin) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(admin))
      } else {
        window.localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [admin])

  useEffect(() => {
    writeStoredProfile(profile)
  }, [profile])

  const login = useCallback(
    ({ username, password }) => {
      const u = (username || '').trim()
      const p = password || ''
      if (!u)
        return { ok: false, field: 'username', error: 'Username is required' }
      if (!p)
        return { ok: false, field: 'password', error: 'Password is required' }
      if (u !== ADMIN_USERNAME) {
        return { ok: false, field: 'username', error: 'Unknown admin username' }
      }
      if (p !== passwordRef.current) {
        return { ok: false, field: 'password', error: 'Incorrect password' }
      }
      const session = {
        username: ADMIN_USERNAME,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        loggedInAt: new Date().toISOString(),
      }
      setAdmin(session)
      return { ok: true, admin: session }
    },
    [profile.name, profile.email, profile.role]
  )

  const logout = useCallback(() => setAdmin(null), [])

  const updateProfile = useCallback((updates) => {
    if (!updates || typeof updates !== 'object') {
      return { ok: false, error: 'Nothing to update.' }
    }
    const name = (updates.name ?? '').toString().trim()
    const email = (updates.email ?? '').toString().trim()
    if (Object.prototype.hasOwnProperty.call(updates, 'name') && !name) {
      return { ok: false, field: 'name', error: 'Name cannot be empty.' }
    }
    if (
      Object.prototype.hasOwnProperty.call(updates, 'email') &&
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return { ok: false, field: 'email', error: 'Enter a valid email address.' }
    }
    const next = { ...profile }
    if (Object.prototype.hasOwnProperty.call(updates, 'name')) next.name = name
    if (Object.prototype.hasOwnProperty.call(updates, 'email'))
      next.email = email
    setProfile(next)
    // Mirror the changes into the live session so the topbar updates.
    setAdmin((prev) =>
      prev ? { ...prev, name: next.name, email: next.email } : prev
    )
    return { ok: true, profile: next }
  }, [profile])

  const changePassword = useCallback(({ current, next, confirm }) => {
    const cur = current || ''
    const nxt = next || ''
    const cnf = confirm || ''
    if (!cur) {
      return {
        ok: false,
        field: 'current',
        error: 'Enter your current password.',
      }
    }
    if (cur !== passwordRef.current) {
      return {
        ok: false,
        field: 'current',
        error: 'Current password is incorrect.',
      }
    }
    if (!nxt || nxt.length < 6) {
      return {
        ok: false,
        field: 'next',
        error: 'New password must be at least 6 characters.',
      }
    }
    if (nxt === cur) {
      return {
        ok: false,
        field: 'next',
        error: 'New password must be different from the current one.',
      }
    }
    if (nxt !== cnf) {
      return {
        ok: false,
        field: 'confirm',
        error: 'Passwords do not match.',
      }
    }
    writeStoredPassword(nxt)
    setPassword(nxt)
    return { ok: true }
  }, [])

  const resetPasswordToDefault = useCallback(() => {
    writeStoredPassword(DEFAULT_PASSWORD)
    setPassword(DEFAULT_PASSWORD)
    return { ok: true }
  }, [])

  const value = useMemo(
    () => ({
      admin,
      profile,
      isAdmin: !!admin,
      defaultUsername: ADMIN_USERNAME,
      isUsingDefaultPassword: password === DEFAULT_PASSWORD,
      login,
      logout,
      updateProfile,
      changePassword,
      resetPasswordToDefault,
    }),
    [
      admin,
      profile,
      password,
      login,
      logout,
      updateProfile,
      changePassword,
      resetPasswordToDefault,
    ]
  )

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) {
    throw new Error('useAdmin must be used inside an AdminProvider')
  }
  return ctx
}
