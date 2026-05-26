import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useNavigation } from '../context/NavigationContext'
import { useProducts } from '../context/ProductsContext'
import { readReviewCount } from './useAdminReviews'
import { subscribeToUsers } from '../auth/users'
import {
  ArrowLeftIcon,
  BarChartIcon,
  MailIcon,
  PackageIcon,
  SettingsIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from '../components/Icons'

function formatINR(value) {
  if (value == null || Number.isNaN(value)) return '₹0'
  return '₹' + Number(value).toLocaleString('en-IN')
}

function StatCard({ icon: Icon, label, value, trend, tone = 'brand', onClick }) {
  const className = `admin-stat admin-stat-${tone}${
    onClick ? ' admin-stat-clickable' : ''
  }`
  const body = (
    <>
      <span className="admin-stat-icon">
        <Icon size={22} />
      </span>
      <div className="admin-stat-body">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-value">{value}</span>
        {trend && (
          <span className="admin-stat-trend">
            <TrendingUpIcon size={14} /> {trend}
          </span>
        )}
      </div>
    </>
  )
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    )
  }
  return <div className={className}>{body}</div>
}

export default function AdminDashboardPage() {
  const {
    goAdminProducts,
    goAdminUsers,
    goAdminReviews,
    goAdminAnalytics,
    goAdminSettings,
  } = useNavigation()
  const [allUsers, setAllUsers] = useState([])
  useEffect(() => subscribeToUsers(setAllUsers), [])
  const { products: allProducts, categories, marketplaceProducts } = useProducts()
  const reviewCount = useMemo(() => readReviewCount(), [])

  const userAds = useMemo(
    () => marketplaceProducts.filter((p) => p.source === 'user'),
    [marketplaceProducts]
  )

  // Last 5 users to register — falls back to natural order when records
  // pre-date the `createdAt` enrichment.
  const recentUsers = useMemo(() => {
    const copy = [...allUsers]
    copy.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    return copy.slice(0, 5)
  }, [allUsers])

  const totalProducts = allProducts.length
  const totalUsers = allUsers.length
  const totalCategories = categories.length
  const activeAds = marketplaceProducts.filter(
    (a) => a.status !== 'sold'
  ).length

  // Top categories by listing count (catalog + user + admin combined).
  const byCategory = useMemo(() => {
    const counts = new Map()
    for (const p of allProducts) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1)
    }
    return categories
      .map((c) => ({ ...c, count: counts.get(c.id) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [allProducts, categories])

  // Most recent user-posted ads.
  const recentAds = useMemo(() => {
    return [...userAds]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 6)
  }, [userAds])

  const totalGMV = useMemo(() => {
    return allProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0)
  }, [allProducts])

  return (
    <AdminLayout
      title="Dashboard"
      subtitle="High-level health of the Laundry marketplace."
    >
      <section className="admin-stats">
        <StatCard
          icon={PackageIcon}
          label="Total products"
          value={totalProducts.toLocaleString('en-IN')}
          trend={`${activeAds} active listings`}
          tone="brand"
          onClick={goAdminProducts}
        />
        <StatCard
          icon={UsersIcon}
          label="Registered users"
          value={totalUsers.toLocaleString('en-IN')}
          trend="across all sessions"
          tone="violet"
          onClick={goAdminUsers}
        />
        <StatCard
          icon={StarIcon}
          label="Reviews collected"
          value={reviewCount.toLocaleString('en-IN')}
          trend="product & seller feedback"
          tone="amber"
          onClick={goAdminReviews}
        />
        <StatCard
          icon={BarChartIcon}
          label="Total catalog value"
          value={formatINR(totalGMV)}
          trend={`${totalCategories} categories`}
          tone="green"
          onClick={goAdminAnalytics}
        />
      </section>

      <section className="admin-grid">
        <div className="admin-card admin-card-categories">
          <div className="admin-card-head">
            <h2>Listings by category</h2>
            <p>Distribution across the {totalCategories} laundry categories</p>
          </div>
          <ul className="admin-cat-list">
            {byCategory.map((c) => {
              const max = byCategory[0]?.count || 1
              const pct = Math.max(4, Math.round((c.count / max) * 100))
              return (
                <li key={c.id} className="admin-cat-row">
                  <span className="admin-cat-name">{c.name}</span>
                  <span className="admin-cat-bar">
                    <span
                      className="admin-cat-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="admin-cat-count">{c.count}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="admin-card admin-card-recent">
          <div className="admin-card-head">
            <h2>Recent user listings</h2>
            <p>
              Latest ads posted via <strong>Sell</strong>. Moderation tools land
              with the Products page.
            </p>
          </div>
          {recentAds.length === 0 ? (
            <div className="admin-empty">
              No user-posted ads yet — seller submissions will appear here.
            </div>
          ) : (
            <ul className="admin-recent-list">
              {recentAds.map((ad) => (
                <li key={ad.id} className="admin-recent-row">
                  <span
                    className="admin-recent-thumb"
                    style={
                      ad.image
                        ? { backgroundImage: `url(${ad.image})` }
                        : undefined
                    }
                  />
                  <div className="admin-recent-meta">
                    <span className="admin-recent-title">{ad.title}</span>
                    <span className="admin-recent-sub">
                      {ad.seller?.name || 'Seller'} · {ad.location || '—'}
                    </span>
                  </div>
                  <span className="admin-recent-price">
                    {formatINR(ad.price)}
                  </span>
                  <span
                    className={`admin-badge admin-badge-${ad.status || 'active'}`}
                  >
                    {ad.status || 'active'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="admin-card admin-card-recent-users">
        <div className="admin-card-head admin-card-head-row">
          <div>
            <h2>Recent users</h2>
            <p>
              The five most recently registered accounts. Click any row to
              jump straight to the full Users page.
            </p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={goAdminUsers}
          >
            View all
            <ArrowLeftIcon size={14} className="admin-btn-arrow-flip" />
          </button>
        </div>

        {recentUsers.length === 0 ? (
          <div className="admin-empty">
            No registered users yet — sign-ups will appear here.
          </div>
        ) : (
          <ul className="admin-recent-list admin-recent-users-list">
            {recentUsers.map((u) => {
              const userInitial = (u.fullName || u.email || 'U')
                .toString()
                .trim()
                .charAt(0)
                .toUpperCase()
              return (
                <li
                  key={u.id}
                  className="admin-recent-row admin-recent-user-row"
                  onClick={goAdminUsers}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      goAdminUsers()
                    }
                  }}
                >
                  <span className="admin-user-avatar-lg">{userInitial}</span>
                  <div className="admin-recent-meta">
                    <span className="admin-recent-title">
                      {u.fullName || 'Unnamed user'}
                    </span>
                    <span className="admin-recent-sub">
                      <MailIcon size={11} /> {u.email}
                    </span>
                  </div>
                  <span
                    className={`admin-provider admin-provider-${
                      u.provider || 'email'
                    }`}
                  >
                    {u.provider === 'google' ? 'Google' : 'Email'}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="admin-quick">
        <h2 className="admin-quick-title">Quick access</h2>
        <p className="admin-quick-sub">
          Jump straight into any admin tool — all of them are wired up and
          live.
        </p>
        <div className="admin-quick-grid admin-quick-grid-5">
          <button
            type="button"
            className="admin-quick-card admin-quick-card-link"
            onClick={goAdminProducts}
          >
            <PackageIcon size={20} />
            <h3>Products</h3>
            <p>Review, edit and remove listings across the catalogue.</p>
          </button>
          <button
            type="button"
            className="admin-quick-card admin-quick-card-link"
            onClick={goAdminUsers}
          >
            <UsersIcon size={20} />
            <h3>Users</h3>
            <p>Inspect accounts, suspend abuse and reset passwords.</p>
          </button>
          <button
            type="button"
            className="admin-quick-card admin-quick-card-link"
            onClick={goAdminReviews}
          >
            <StarIcon size={20} />
            <h3>Reviews</h3>
            <p>Moderate seller reviews and surface highlights.</p>
          </button>
          <button
            type="button"
            className="admin-quick-card admin-quick-card-link"
            onClick={goAdminAnalytics}
          >
            <BarChartIcon size={20} />
            <h3>Analytics</h3>
            <p>Track traffic, conversions and category performance.</p>
          </button>
          <button
            type="button"
            className="admin-quick-card admin-quick-card-link"
            onClick={goAdminSettings}
          >
            <SettingsIcon size={20} />
            <h3>Settings</h3>
            <p>Edit your admin profile, password and preferences.</p>
          </button>
        </div>
      </section>
    </AdminLayout>
  )
}
