import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// =====================================================================
// AdminContext
// ---------------------------------------------------------------------
// Manages the admin session. Completely separate from the consumer-side
// AuthContext — an admin is NOT a regular user. Credentials for this
// front-end-only mock are hardcoded:
//
//   username: admin
//   password: admin123
//
// On a successful login we drop a tiny marker into localStorage so the
// admin stays signed-in across reloads.
// =====================================================================

const AdminContext = createContext(null)
const STORAGE_KEY = 'laundry:admin'
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'admin123'

function readStored() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(readStored)

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

  const login = useCallback(({ username, password }) => {
    const u = (username || '').trim()
    const p = password || ''
    if (!u) return { ok: false, field: 'username', error: 'Username is required' }
    if (!p) return { ok: false, field: 'password', error: 'Password is required' }
    if (u !== ADMIN_USERNAME) {
      return { ok: false, field: 'username', error: 'Unknown admin username' }
    }
    if (p !== ADMIN_PASSWORD) {
      return { ok: false, field: 'password', error: 'Incorrect password' }
    }
    const session = {
      username: ADMIN_USERNAME,
      name: 'Administrator',
      loggedInAt: new Date().toISOString(),
    }
    setAdmin(session)
    return { ok: true, admin: session }
  }, [])

  const logout = useCallback(() => setAdmin(null), [])

  const value = useMemo(
    () => ({
      admin,
      isAdmin: !!admin,
      login,
      logout,
    }),
    [admin, login, logout]
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
