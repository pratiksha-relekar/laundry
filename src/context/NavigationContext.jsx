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
// NavigationContext
// ---------------------------------------------------------------------
// Tiny hash-based client-side router for the Laundry app. The current
// view is stored both in React state and mirrored to
// `window.location.hash` so:
//   • Refreshing the page on Vercel keeps the user on the same view
//   • URLs are shareable / bookmarkable
//   • Browser back/forward work naturally
//
// Hash format:
//   #home              — landing page (we also accept an empty hash)
//   #details/<id>      — product details page
//   #login             — login screen
//   #signup            — signup screen
//   #wishlist          — saved items
//   #chats             — chats inbox + thread
//   #my-ads            — current user's listings
//   #account           — account hub
//   #sell              — post-an-ad form
//   #admin-login       — admin sign-in screen
//   #admin-dashboard   — admin control panel
//   #admin-products    — admin products & categories management
//   #admin-users       — admin user directory
//   #admin-reviews     — admin review moderation
//   #admin-analytics   — admin analytics overview
//   #admin-settings    — admin account / password / preferences
// =====================================================================

const NavigationContext = createContext(null)

const KNOWN_VIEWS = new Set([
  'home',
  'login',
  'signup',
  'wishlist',
  'chats',
  'my-ads',
  'account',
  'sell',
  'admin-login',
  'admin-dashboard',
  'admin-products',
  'admin-users',
  'admin-reviews',
  'admin-analytics',
  'admin-settings',
])

/**
 * Parse `window.location.hash` into `{ view, productId }`. Unknown
 * hashes fall back to the home view so bad URLs never break the app.
 */
function parseHash(hash) {
  const raw = (hash || '').replace(/^#\/?/, '').trim()
  if (!raw) return { view: 'home', productId: null }
  if (raw.startsWith('details/')) {
    const id = decodeURIComponent(raw.slice('details/'.length))
    return { view: 'details', productId: id || null }
  }
  if (KNOWN_VIEWS.has(raw)) return { view: raw, productId: null }
  return { view: 'home', productId: null }
}

/** Inverse of `parseHash`. Home stays as an empty hash so `/` is clean. */
function buildHash(view, productId) {
  if (view === 'home') return ''
  if (view === 'details' && productId)
    return '#details/' + encodeURIComponent(productId)
  return '#' + view
}

function scrollTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}

function readInitial() {
  if (typeof window === 'undefined') return { view: 'home', productId: null }
  return parseHash(window.location.hash)
}

export function NavigationProvider({ children }) {
  // Single state object keeps view + productId in lock-step and lets us
  // initialise both from the URL hash with one lazy call.
  const [route, setRoute] = useState(readInitial)
  const { view, productId } = route
  // Guards the hashchange listener so internally-triggered hash writes
  // don't accidentally cause a redundant state update.
  const internalWrite = useRef(false)

  // ---- hash write helpers ------------------------------------------
  const writeHash = useCallback((nextView, nextProductId, replace = false) => {
    if (typeof window === 'undefined') return
    const target = buildHash(nextView, nextProductId)
    const current = window.location.hash || ''
    if (current === target) return
    const url =
      window.location.pathname + window.location.search + target
    internalWrite.current = true
    try {
      if (replace) window.history.replaceState(null, '', url)
      else window.history.pushState(null, '', url)
    } catch {
      // Some browsers (e.g. file://) reject pushState — fall back to a
      // direct hash assignment which still fires hashchange.
      window.location.hash = target
    }
    // The microtask below resets the flag *after* any synchronous
    // hashchange would have fired, so external changes are still seen.
    Promise.resolve().then(() => {
      internalWrite.current = false
    })
  }, [])

  /**
   * Single internal helper every public navigation action goes through.
   * Always updates React state, writes the hash, and scrolls the page
   * back to the top for a fresh-page feel.
   */
  const navigate = useCallback(
    (nextView, nextProductId = null) => {
      setRoute({ view: nextView, productId: nextProductId })
      writeHash(nextView, nextProductId)
      scrollTop()
    },
    [writeHash]
  )

  // ---- effects ------------------------------------------------------
  // On first mount: normalize the URL so e.g. visiting `#garbage`
  // rewrites it to `#home` (or strips it entirely for home).
  useEffect(() => {
    writeHash(route.view, route.productId, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync state ← URL whenever the hash changes (browser back/forward,
  // manual edits, link clicks with `href="#..."`).
  useEffect(() => {
    function onHashChange() {
      if (internalWrite.current) return
      setRoute(parseHash(window.location.hash))
      scrollTop()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // ---- public actions -----------------------------------------------
  const openProduct = useCallback(
    (id) => {
      navigate('details', id)
    },
    [navigate]
  )

  const goHome = useCallback(() => navigate('home'), [navigate])
  const goLogin = useCallback(() => navigate('login'), [navigate])
  const goSignup = useCallback(() => navigate('signup'), [navigate])
  const goWishlist = useCallback(() => navigate('wishlist'), [navigate])
  const goChats = useCallback(() => navigate('chats'), [navigate])
  const goMyAds = useCallback(() => navigate('my-ads'), [navigate])
  const goAccount = useCallback(() => navigate('account'), [navigate])
  const goSell = useCallback(() => navigate('sell'), [navigate])
  const goAdminLogin = useCallback(() => navigate('admin-login'), [navigate])
  const goAdminDashboard = useCallback(
    () => navigate('admin-dashboard'),
    [navigate]
  )
  const goAdminProducts = useCallback(
    () => navigate('admin-products'),
    [navigate]
  )
  const goAdminUsers = useCallback(() => navigate('admin-users'), [navigate])
  const goAdminReviews = useCallback(
    () => navigate('admin-reviews'),
    [navigate]
  )
  const goAdminAnalytics = useCallback(
    () => navigate('admin-analytics'),
    [navigate]
  )
  const goAdminSettings = useCallback(
    () => navigate('admin-settings'),
    [navigate]
  )

  const value = useMemo(
    () => ({
      view,
      productId,
      openProduct,
      goHome,
      goLogin,
      goSignup,
      goWishlist,
      goChats,
      goMyAds,
      goAccount,
      goSell,
      goAdminLogin,
      goAdminDashboard,
      goAdminProducts,
      goAdminUsers,
      goAdminReviews,
      goAdminAnalytics,
      goAdminSettings,
    }),
    [
      view,
      productId,
      openProduct,
      goHome,
      goLogin,
      goSignup,
      goWishlist,
      goChats,
      goMyAds,
      goAccount,
      goSell,
      goAdminLogin,
      goAdminDashboard,
      goAdminProducts,
      goAdminUsers,
      goAdminReviews,
      goAdminAnalytics,
      goAdminSettings,
    ]
  )

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const ctx = useContext(NavigationContext)
  if (!ctx) {
    throw new Error('useNavigation must be used inside a NavigationProvider')
  }
  return ctx
}
