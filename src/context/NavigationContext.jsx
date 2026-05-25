import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// =====================================================================
// NavigationContext
// ---------------------------------------------------------------------
// Tiny client-side router for the Laundry app. The current view is one of:
//   'home'            — landing page / search results
//   'details'         — product details page (also needs `productId`)
//   'login'           — login screen
//   'signup'          — signup screen
//   'wishlist'        — saved items
//   'chats'           — chats inbox + thread
//   'my-ads'          — current user's listings
//   'account'         — account hub (profile, settings, help, logout)
//   'sell'            — post-an-ad / "become a seller" form
//   'admin-login'     — admin sign-in screen
//   'admin-dashboard' — admin control panel (products, users, reviews…)
// =====================================================================

const NavigationContext = createContext(null)

function scrollTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }
}

export function NavigationProvider({ children }) {
  const [view, setView] = useState('home')
  const [productId, setProductId] = useState(null)

  const openProduct = useCallback((id) => {
    setProductId(id)
    setView('details')
    scrollTop()
  }, [])

  const goHome = useCallback(() => {
    setProductId(null)
    setView('home')
    scrollTop()
  }, [])

  const goLogin = useCallback(() => {
    setView('login')
    scrollTop()
  }, [])

  const goSignup = useCallback(() => {
    setView('signup')
    scrollTop()
  }, [])

  const goWishlist = useCallback(() => {
    setView('wishlist')
    scrollTop()
  }, [])

  const goChats = useCallback(() => {
    setView('chats')
    scrollTop()
  }, [])

  const goMyAds = useCallback(() => {
    setView('my-ads')
    scrollTop()
  }, [])

  const goAccount = useCallback(() => {
    setView('account')
    scrollTop()
  }, [])

  const goSell = useCallback(() => {
    setView('sell')
    scrollTop()
  }, [])

  const goAdminLogin = useCallback(() => {
    setView('admin-login')
    scrollTop()
  }, [])

  const goAdminDashboard = useCallback(() => {
    setView('admin-dashboard')
    scrollTop()
  }, [])

  // Treat the browser Back button as "go to home" for any non-home view.
  useEffect(() => {
    function handlePop() {
      setProductId(null)
      setView('home')
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

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
