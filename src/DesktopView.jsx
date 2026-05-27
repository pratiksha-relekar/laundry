import Header from './components/Header'
import CategoryNav from './components/CategoryNav'
import HeroBanner from './components/HeroBanner'
import Sidebar from './components/Sidebar'
import CategorySection from './components/CategorySection'
import SearchResults from './components/SearchResults'
import Footer from './components/Footer'
import BottomAppBar from './components/BottomAppBar'
import ProductDetailsPage from './ProductDetailsPage'
import LoginPage from './LoginPage'
import SignupPage from './SignupPage'
import WishlistPage from './WishlistPage'
import ChatsPage from './ChatsPage'
import MyAdsPage from './MyAdsPage'
import AccountPage from './AccountPage'
import SellPage from './SellPage'
import EditAdPage from './EditAdPage'
import AdminLoginPage from './admin/AdminLoginPage'
import AdminDashboardPage from './admin/AdminDashboardPage'
import AdminProductsPage from './admin/AdminProductsPage'
import AdminUsersPage from './admin/AdminUsersPage'
import AdminReviewsPage from './admin/AdminReviewsPage'
import AdminAnalyticsPage from './admin/AdminAnalyticsPage'
import AdminSettingsPage from './admin/AdminSettingsPage'
import CategoryBrowsePage from './components/CategoryBrowsePage'
import { useSearch } from './context/SearchContext'
import { useNavigation } from './context/NavigationContext'
import { useAdmin } from './context/AdminContext'
import { categories, totalListings } from './data/categories'
import { ChevronDown } from './components/Icons'
import './styles/desktop.css'

const SECONDARY_VIEWS = new Set([
  'wishlist',
  'chats',
  'my-ads',
  'account',
  'sell',
  'edit-ad',
])

const ADMIN_VIEWS = new Set([
  'admin-login',
  'admin-dashboard',
  'admin-products',
  'admin-users',
  'admin-reviews',
  'admin-analytics',
  'admin-settings',
])

export default function DesktopView() {
  const { isFiltering, submittedQuery, allProductsByCategory } = useSearch()
  const { view, productId, goAdminLogin, goHome } = useNavigation()
  const { isAdmin } = useAdmin()
  const onAdmin = ADMIN_VIEWS.has(view)

  // Admin pages render in a completely separate shell — no consumer
  // header / footer / sidebar / bottom bar.
  if (onAdmin) {
    if (view === 'admin-login') return <AdminLoginPage />
    // Every other admin route requires an authenticated admin session.
    if (!isAdmin) {
      // Guard so a direct nav with no session bounces back to login.
      setTimeout(goAdminLogin, 0)
      return <AdminLoginPage />
    }
    if (view === 'admin-dashboard') return <AdminDashboardPage />
    if (view === 'admin-products') return <AdminProductsPage />
    if (view === 'admin-users') return <AdminUsersPage />
    if (view === 'admin-reviews') return <AdminReviewsPage />
    if (view === 'admin-analytics') return <AdminAnalyticsPage />
    if (view === 'admin-settings') return <AdminSettingsPage />
  }

  const onDetails = view === 'details'
  const onAuth = view === 'login' || view === 'signup'
  const onSecondary = SECONDARY_VIEWS.has(view)
  const onCategory = view === 'category'

  let filteringLabel = ''
  if (isFiltering) {
    if (submittedQuery.trim()) filteringLabel = `"${submittedQuery}"`
    else filteringLabel = 'matching budget'
  }

  let secondaryPage = null
  if (view === 'wishlist') secondaryPage = <WishlistPage />
  else if (view === 'chats') secondaryPage = <ChatsPage />
  else if (view === 'my-ads') secondaryPage = <MyAdsPage />
  else if (view === 'account') secondaryPage = <AccountPage />
  else if (view === 'sell') secondaryPage = <SellPage />
  else if (view === 'edit-ad') secondaryPage = <EditAdPage productId={productId} />

  return (
    <div className="lx-app">
      <Header />
      {!onDetails && !onAuth && !onSecondary && <CategoryNav />}
      {!onDetails && !onAuth && !onSecondary && !isFiltering && !onCategory && (
        <HeroBanner />
      )}

      {onAuth ? (
        <main className="lx-main lx-main-auth">
          {view === 'login' ? <LoginPage /> : <SignupPage />}
        </main>
      ) : onSecondary ? (
        <main className="lx-main lx-main-secondary">{secondaryPage}</main>
      ) : onDetails ? (
        <main className="lx-main lx-main-details">
          <ProductDetailsPage productId={productId} />
        </main>
      ) : onCategory ? (
        <main className="lx-main">
          <Sidebar />
          <div className="lx-content">
            <CategoryBrowsePage />
          </div>
        </main>
      ) : (
        <>
          <div className="lx-breadcrumb-wrap">
            <div className="lx-breadcrumb">
              <button type="button" className="bc-link" onClick={goHome}>
                Home
              </button>
              <span className="bc-sep">/</span>
              <span className="bc-current">
                {isFiltering
                  ? `Filtered results${filteringLabel ? ` · ${filteringLabel}` : ''}`
                  : 'Laundry Equipment'}
              </span>
            </div>
            <h1 className="lx-page-title">
              {isFiltering
                ? `Showing products ${filteringLabel}`.trim()
                : 'Buy \u0026 Sell Laundry Equipment in India'}
            </h1>
          </div>

          <main className="lx-main">
            <Sidebar />

            <div className="lx-content">
              {isFiltering ? (
                <SearchResults />
              ) : (
                <>
                  <div className="content-head">
                    <h2 className="content-title">
                      {totalListings.toLocaleString('en-IN')} ads across India
                    </h2>
                    <div className="grid-sort">
                      <span className="grid-sort-label">SORT BY :</span>
                      <button className="grid-sort-btn" type="button">
                        Date Published
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  {categories.map((cat) => (
                    <CategorySection
                      key={cat.id}
                      category={cat}
                      products={allProductsByCategory[cat.id] || []}
                    />
                  ))}
                </>
              )}
            </div>
          </main>
        </>
      )}

      {!onAuth && !onSecondary && <Footer />}

      <BottomAppBar />
    </div>
  )
}
