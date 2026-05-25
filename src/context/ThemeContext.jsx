import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// =====================================================================
// ThemeContext
// ---------------------------------------------------------------------
// Light / dark theme switcher. The active theme is mirrored onto the
// <html> element as `data-theme="light|dark"`, which the CSS variables
// in index.css listen to.
//
// Resolution order on first paint:
//   1. localStorage value (explicit user choice)
//   2. prefers-color-scheme media query (system preference)
//   3. default to "light"
// =====================================================================

const ThemeContext = createContext(null)
const STORAGE_KEY = 'laundry:theme'

function readInitial() {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitial)

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  // If the user hasn't picked manually, follow the system preference
  // when it changes (e.g. macOS auto-switch at sunset).
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    let manual = false
    try {
      manual = !!localStorage.getItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    if (manual) return

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme, isDark: theme === 'dark' }),
    [theme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside a ThemeProvider')
  }
  return ctx
}
