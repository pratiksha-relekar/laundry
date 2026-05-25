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
//   'admin-products'  — admin products & categories management
//   'admin-users'     — admin user directory (registered accounts)
//   'admin-reviews'   — admin review moderation (product + seller reviews)
//   'admin-analytics' — admin marketplace analytics overview
//   'admin-settings'  — admin account, password and preferences
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

  const goAdminProducts = useCallback(() => {
    setView('admin-products')
    scrollTop()
  }, [])

  const goAdminUsers = useCallback(() => {
    setView('admin-users')
    scrollTop()
  }, [])

  const goAdminReviews = useCallback(() => {
    setView('admin-reviews')
    scrollTop()
  }, [])

  const goAdminAnalytics = useCallback(() => {
    setView('admin-analytics')
    scrollTop()
  }, [])

  const goAdminSettings = useCallback(() => {
    setView('admin-settings')
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
