import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// =====================================================================
// AuthContext
// ---------------------------------------------------------------------
// Front-end-only auth for the Laundry prototype.
//   - "Registered users" are stored in localStorage under USERS_KEY.
//   - The active session user is stored under SESSION_KEY.
//   - login()        – verifies credentials against the user store.
//   - signup()       – creates a new user, then logs them in.
//   - loginGoogle()  – simulates a successful Google OAuth roundtrip.
//   - logout()       – clears the session.
// =====================================================================

const AuthContext = createContext(null)

const USERS_KEY = 'laundry:users'
const SESSION_KEY = 'laundry:user'

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    /* storage disabled — ignore */
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'u_' + Math.random().toString(36).slice(2, 11)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession)

  useEffect(() => {
    try {
      if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      /* ignore */
    }
  }, [user])

  const signup = useCallback(({ fullName, email, password, confirmPassword }) => {
    const name = (fullName || '').trim()
    const mail = (email || '').trim().toLowerCase()

    if (!name) return { ok: false, field: 'fullName', error: 'Please enter your full name.' }
    if (!mail) return { ok: false, field: 'email', error: 'Email is required.' }
    if (!isValidEmail(mail))
      return { ok: false, field: 'email', error: 'Enter a valid email address.' }
    if (!password || password.length < 6)
      return { ok: false, field: 'password', error: 'Password must be at least 6 characters.' }
    if (password !== confirmPassword)
      return { ok: false, field: 'confirmPassword', error: 'Passwords do not match.' }

    const users = readUsers()
    if (users.some((u) => u.email === mail)) {
      return {
        ok: false,
        field: 'email',
        error: 'An account with this email already exists. Try logging in.',
      }
    }

    const record = { id: newId(), fullName: name, email: mail, password, provider: 'email' }
    users.push(record)
    writeUsers(users)
    setUser({ id: record.id, fullName: record.fullName, email: record.email, provider: 'email' })
    return { ok: true }
  }, [])

  const login = useCallback(({ email, password }) => {
    const mail = (email || '').trim().toLowerCase()

    if (!mail) return { ok: false, field: 'email', error: 'Email is required.' }
    if (!isValidEmail(mail))
      return { ok: false, field: 'email', error: 'Enter a valid email address.' }
    if (!password) return { ok: false, field: 'password', error: 'Password is required.' }

    const users = readUsers()
    const found = users.find((u) => u.email === mail && u.password === password)
    if (!found) {
      return {
        ok: false,
        field: 'password',
        error: 'Invalid email or password. Please try again.',
      }
    }
    setUser({
      id: found.id,
      fullName: found.fullName,
      email: found.email,
      provider: found.provider || 'email',
    })
    return { ok: true }
  }, [])

  const loginGoogle = useCallback(() => {
    // Simulated Google OAuth — produces a stable mock account that
    // persists across logins so the experience feels like a real
    // returning-user flow.
    const mail = 'guest@gmail.com'
    const users = readUsers()
    let record = users.find((u) => u.email === mail)
    if (!record) {
      record = {
        id: newId(),
        fullName: 'Google User',
        email: mail,
        password: null,
        provider: 'google',
      }
      users.push(record)
      writeUsers(users)
    }
    setUser({
      id: record.id,
      fullName: record.fullName,
      email: record.email,
      provider: 'google',
    })
    return { ok: true }
  }, [])

  const logout = useCallback(() => setUser(null), [])

  const updateProfile = useCallback(
    (updates) => {
      if (!user) return { ok: false, error: 'You must be logged in.' }
      const allowed = [
        'fullName',
        'phone',
        'location',
        'about',
        'settings',
      ]
      const patch = {}
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          patch[key] = updates[key]
        }
      }

      const users = readUsers()
      const idx = users.findIndex((u) => u.id === user.id)
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...patch }
        writeUsers(users)
      }
      setUser((prev) => ({ ...prev, ...patch }))
      return { ok: true }
    },
    [user]
  )

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      signup,
      login,
      loginGoogle,
      logout,
      updateProfile,
    }),
    [user, signup, login, loginGoogle, logout, updateProfile]
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
