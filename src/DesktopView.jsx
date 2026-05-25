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
import AdminLoginPage from './AdminLoginPage'
import AdminDashboardPage from './AdminDashboardPage'
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
])

const ADMIN_VIEWS = new Set(['admin-login', 'admin-dashboard'])

export default function DesktopView() {
  const { isFiltering, submittedQuery, allProductsByCategory } = useSearch()
  const { view, productId, goAdminLogin } = useNavigation()
  const { isAdmin } = useAdmin()
  const onAdmin = ADMIN_VIEWS.has(view)

  // Admin pages render in a completely separate shell — no consumer
  // header / footer / sidebar / bottom bar.
  if (onAdmin) {
    if (view === 'admin-login') return <AdminLoginPage />
    if (view === 'admin-dashboard') {
      if (!isAdmin) {
        // Guard the dashboard so a direct nav with no session bounces
        // back to the admin sign-in screen.
        setTimeout(goAdminLogin, 0)
        return <AdminLoginPage />
      }
      return <AdminDashboardPage />
    }
  }

  const onDetails = view === 'details'
  const onAuth = view === 'login' || view === 'signup'
  const onSecondary = SECONDARY_VIEWS.has(view)

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

  return (
    <div className="lx-app">
      <Header />
      {!onDetails && !onAuth && !onSecondary && <CategoryNav />}
      {!onDetails && !onAuth && !onSecondary && !isFiltering && <HeroBanner />}

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
      ) : (
        <>
          <div className="lx-breadcrumb-wrap">
            <div className="lx-breadcrumb">
              <a href="#">Home</a>
              <span className="bc-sep">/</span>
              <a href="#">
                {isFiltering
                  ? `Filtered results${filteringLabel ? ` · ${filteringLabel}` : ''}`
                  : 'Laundry Equipment'}
              </a>
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
