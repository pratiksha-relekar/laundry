import { useMemo } from 'react'
import AdminLayout from './components/AdminLayout'
import { products as CATALOG_PRODUCTS } from './data/products'
import { categories } from './data/categories'
import {
  BarChartIcon,
  PackageIcon,
  StarIcon,
  TrendingUpIcon,
  UsersIcon,
} from './components/Icons'

// Reads localStorage at render time to keep the dashboard live without
// adding cross-context coupling. The admin module is intentionally
// outside the consumer Auth/UserAds/Wishlist trees.
function readRegisteredUsers() {
  try {
    const raw = window.localStorage.getItem('laundry:users')
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readAllUserAds() {
  const out = []
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key || !key.startsWith('laundry:userAds:')) continue
      try {
        const value = JSON.parse(window.localStorage.getItem(key) || '[]')
        if (Array.isArray(value)) {
          const ownerId = key.replace('laundry:userAds:', '')
          for (const ad of value) {
            out.push({ ...ad, ownerId })
          }
        }
      } catch {
        /* skip bad blob */
      }
    }
  } catch {
    // localStorage unavailable
  }
  return out
}

function formatINR(value) {
  if (value == null || Number.isNaN(value)) return '₹0'
  return '₹' + Number(value).toLocaleString('en-IN')
}

function StatCard({ icon: Icon, label, value, trend, tone = 'brand' }) {
  return (
    <div className={`admin-stat admin-stat-${tone}`}>
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
    </div>
  )
}

export default function AdminDashboardPage() {
  const allUsers = useMemo(() => readRegisteredUsers(), [])
  const userAds = useMemo(() => readAllUserAds(), [])

  const totalProducts = CATALOG_PRODUCTS.length + userAds.length
  const totalUsers = allUsers.length
  const totalCategories = categories.length
  const activeAds = userAds.filter((a) => a.status !== 'sold').length

  // Top categories by listing count (catalog + user ads combined).
  const byCategory = useMemo(() => {
    const counts = new Map()
    for (const p of [...CATALOG_PRODUCTS, ...userAds]) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1)
    }
    return categories
      .map((c) => ({ ...c, count: counts.get(c.id) || 0 }))
      .sort((a, b) => b.count - a.count)
  }, [userAds])

  // Most recent user-posted ads.
  const recentAds = useMemo(() => {
    return [...userAds]
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 6)
  }, [userAds])

  const totalGMV = useMemo(() => {
    return [...CATALOG_PRODUCTS, ...userAds].reduce(
      (sum, p) => sum + (Number(p.price) || 0),
      0
    )
  }, [userAds])

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
          trend={`${activeAds} active user ads`}
          tone="brand"
        />
        <StatCard
          icon={UsersIcon}
          label="Registered users"
          value={totalUsers.toLocaleString('en-IN')}
          trend="across all sessions"
          tone="violet"
        />
        <StatCard
          icon={StarIcon}
          label="Reviews collected"
          value="0"
          trend="moderation coming soon"
          tone="amber"
        />
        <StatCard
          icon={BarChartIcon}
          label="Total catalog value"
          value={formatINR(totalGMV)}
          trend={`${totalCategories} categories`}
          tone="green"
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

      <section className="admin-quick">
        <h2 className="admin-quick-title">Coming up next</h2>
        <p className="admin-quick-sub">
          These pages will be wired up next — each will plug into the same
          sidebar.
        </p>
        <div className="admin-quick-grid">
          <div className="admin-quick-card">
            <PackageIcon size={20} />
            <h3>Products</h3>
            <p>Review, edit and remove listings across the catalogue.</p>
          </div>
          <div className="admin-quick-card">
            <UsersIcon size={20} />
            <h3>Users</h3>
            <p>Inspect accounts, suspend abuse and reset passwords.</p>
          </div>
          <div className="admin-quick-card">
            <StarIcon size={20} />
            <h3>Reviews</h3>
            <p>Moderate seller reviews and surface highlights.</p>
          </div>
          <div className="admin-quick-card">
            <BarChartIcon size={20} />
            <h3>Analytics</h3>
            <p>Track traffic, conversions and category performance.</p>
          </div>
        </div>
      </section>
    </AdminLayout>
  )
}
