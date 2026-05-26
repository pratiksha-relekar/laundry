import { useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { useAdminReviews } from './useAdminReviews'
import { useProducts } from '../context/ProductsContext'
import { subscribeToUsers } from '../auth/users'
import {
  BarChartIcon,
  CheckIcon,
  MailIcon,
  PackageIcon,
  PinIcon,
  ShieldIcon,
  StarIcon,
  TrendingUpIcon,
} from '../components/Icons'

// =====================================================================
// AdminAnalyticsPage
// ---------------------------------------------------------------------
// Marketing-style overview of the marketplace that combines real data
// (catalog + admin-added products + user ads + reviews + accounts) with
// deterministic mock time-series for the activity chart. Charts are
// rendered as inline SVG so the page stays free of any chart library —
// everything is themed via the existing CSS tokens.
//
// Layout follows the same `admin-grid` two-column rhythm used on the
// dashboard so the page feels native to the rest of the admin panel.
// =====================================================================

const ACTIVITY_TABS = [
  { key: 'listings', label: 'Listings posted', seed: 0xa53f7c, min: 4, max: 26 },
  { key: 'signups', label: 'New sign-ups', seed: 0xb9d143, min: 1, max: 12 },
  { key: 'reviews', label: 'Reviews submitted', seed: 0xc6e290, min: 2, max: 14 },
]

const DAYS = 30
const STATUS_COLORS = {
  active: '#10b981',
  pending: '#f59e0b',
  sold: '#94a3b8',
}
const PROVIDER_COLORS = {
  email: '#1B6FFF',
  google: '#ea4335',
}

function formatINR(value) {
  if (value == null || Number.isNaN(value)) return '₹0'
  return '₹' + Math.round(Number(value)).toLocaleString('en-IN')
}

function formatINRShort(value) {
  const n = Number(value) || 0
  if (n >= 1_00_00_000) return '₹' + (n / 1_00_00_000).toFixed(2) + 'Cr'
  if (n >= 1_00_000) return '₹' + (n / 1_00_000).toFixed(2) + 'L'
  if (n >= 1_000) return '₹' + (n / 1_000).toFixed(1) + 'K'
  return '₹' + n.toLocaleString('en-IN')
}

// Cheap deterministic series: LCG noise + weekly oscillation + slight
// upward trend so each metric looks alive without ever changing.
function generateSeries(seed, days, min, max) {
  let s = seed >>> 0 || 1
  const out = []
  for (let i = 0; i < days; i++) {
    s = (s * 1664525 + 1013904223) >>> 0
    const noise = s / 0x100000000
    const week = Math.sin((i / 7) * Math.PI * 2) * 0.18
    const trend = (i / (days - 1)) * 0.3
    const norm = Math.max(0, Math.min(1, 0.5 + week + trend))
    const val = min + (max - min) * norm * (0.7 + noise * 0.6)
    out.push(Math.max(0, Math.round(val)))
  }
  return out
}

function shortCity(loc) {
  if (!loc) return ''
  return loc.split(',')[0].trim()
}

export default function AdminAnalyticsPage() {
  const {
    products: allProducts,
    categories: CATALOG_CATEGORIES,
    marketplaceProducts,
  } = useProducts()
  const { reviews, stats: reviewStats } = useAdminReviews()

  const [users, setUsers] = useState([])
  useEffect(() => subscribeToUsers(setUsers), [])

  const totalGMV = useMemo(
    () => allProducts.reduce((sum, p) => sum + (Number(p.price) || 0), 0),
    [allProducts]
  )
  const activeCount = useMemo(
    () => allProducts.filter((p) => (p.status || 'active') !== 'sold').length,
    [allProducts]
  )
  const avgPrice = allProducts.length > 0 ? totalGMV / allProducts.length : 0

  // Listings by status — catalog products have no explicit status, treat
  // them as `active`. User ads + admin products bring their own.
  const statusBreakdown = useMemo(() => {
    const counts = { active: 0, pending: 0, sold: 0 }
    for (const p of allProducts) {
      const s = p.status || 'active'
      if (counts[s] != null) counts[s]++
      else counts.active++
    }
    return [
      { key: 'active', label: 'Active', value: counts.active, color: STATUS_COLORS.active },
      { key: 'pending', label: 'Pending', value: counts.pending, color: STATUS_COLORS.pending },
      { key: 'sold', label: 'Sold', value: counts.sold, color: STATUS_COLORS.sold },
    ]
  }, [allProducts])

  // Top categories — combine the static seed count with live listings
  // (user + admin) for the same slug.
  const topCategories = useMemo(() => {
    const counts = new Map()
    for (const c of CATALOG_CATEGORIES) counts.set(c.id, c.count || 0)
    for (const p of marketplaceProducts) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1)
    }
    return CATALOG_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      count: counts.get(c.id) || 0,
    }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [CATALOG_CATEGORIES, marketplaceProducts])

  // Top cities — pulled from every product's `location` field.
  const topCities = useMemo(() => {
    const counts = new Map()
    for (const p of allProducts) {
      const city = shortCity(p.location)
      if (!city) continue
      counts.set(city, (counts.get(city) || 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }, [allProducts])

  // Sign-up provider breakdown.
  const providerBreakdown = useMemo(() => {
    let email = 0
    let google = 0
    for (const u of users) {
      if (u.provider === 'google') google++
      else email++
    }
    return [
      { key: 'email', label: 'Email', value: email, color: PROVIDER_COLORS.email },
      {
        key: 'google',
        label: 'Google',
        value: google,
        color: PROVIDER_COLORS.google,
      },
    ]
  }, [users])

  // Rating distribution (1..5) from real reviews.
  const ratingDist = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]
    for (const r of reviews) counts[r.rating - 1]++
    return [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: counts[rating - 1] || 0,
    }))
  }, [reviews])

  return (
    <AdminLayout
      title="Analytics"
      subtitle="Marketplace health, activity trends and category demand at a glance."
    >
      <section className="admin-stats">
        <StatCard
          icon={BarChartIcon}
          label="Catalog GMV"
          value={formatINRShort(totalGMV)}
          trend={`${allProducts.length.toLocaleString('en-IN')} total listings`}
          tone="brand"
        />
        <StatCard
          icon={PackageIcon}
          label="Active listings"
          value={activeCount.toLocaleString('en-IN')}
          trend={`${(
            (activeCount / Math.max(1, allProducts.length)) *
            100
          ).toFixed(0)}% of catalog`}
          tone="green"
        />
        <StatCard
          icon={TrendingUpIcon}
          label="Avg listing price"
          value={formatINR(avgPrice)}
          trend="across every category"
          tone="violet"
        />
        <StatCard
          icon={StarIcon}
          label="Avg review rating"
          value={
            reviewStats.average ? reviewStats.average.toFixed(1) + ' ★' : '—'
          }
          trend={`${reviewStats.total.toLocaleString('en-IN')} reviews`}
          tone="amber"
        />
      </section>

      <section className="admin-grid admin-grid-2-1">
        <ActivityCard />
        <StatusDonutCard segments={statusBreakdown} total={allProducts.length} />
      </section>

      <section className="admin-grid">
        <CategoryBarCard categories={topCategories} />
        <CityBarCard cities={topCities} />
      </section>

      <section className="admin-grid admin-grid-2-1">
        <RatingHistogramCard
          distribution={ratingDist}
          total={reviewStats.total}
          average={reviewStats.average}
        />
        <ProviderDonutCard
          segments={providerBreakdown}
          total={users.length}
        />
      </section>
    </AdminLayout>
  )
}

/* -------------------------------------------------------------------- */
/*  Reused stat card                                                     */
/* -------------------------------------------------------------------- */

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
          <span className="admin-stat-trend admin-stat-trend-muted">
            <CheckIcon size={14} /> {trend}
          </span>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Activity card (with switch tabs + SVG area chart)                    */
/* -------------------------------------------------------------------- */

function ActivityCard() {
  const [active, setActive] = useState('listings')

  const series = useMemo(() => {
    const tab = ACTIVITY_TABS.find((t) => t.key === active) || ACTIVITY_TABS[0]
    return generateSeries(tab.seed, DAYS, tab.min, tab.max)
  }, [active])

  const total = useMemo(() => series.reduce((s, v) => s + v, 0), [series])
  const peak = useMemo(() => Math.max(...series, 1), [series])
  const last7 = useMemo(
    () => series.slice(-7).reduce((s, v) => s + v, 0),
    [series]
  )

  return (
    <div className="admin-card">
      <div className="admin-card-head admin-card-head-row">
        <div>
          <h2>Activity over the last 30 days</h2>
          <p>
            Synthetic timeline of marketplace activity — switch between the
            three core metrics.
          </p>
        </div>
        <div className="admin-chart-totals">
          <span className="admin-chart-total-big">
            {total.toLocaleString('en-IN')}
          </span>
          <span className="admin-chart-total-sub">
            last 7d: <strong>{last7.toLocaleString('en-IN')}</strong>
          </span>
        </div>
      </div>

      <div className="admin-chart-switch" role="tablist">
        {ACTIVITY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active === tab.key}
            className={`admin-chart-switch-btn ${
              active === tab.key ? 'is-active' : ''
            }`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <AreaChart series={series} peak={peak} />

      <div className="admin-chart-axis">
        <span>30 days ago</span>
        <span>21d</span>
        <span>14d</span>
        <span>7d</span>
        <span>today</span>
      </div>
    </div>
  )
}

function AreaChart({ series, peak }) {
  const W = 600
  const H = 200
  const padX = 12
  const padTop = 14
  const padBottom = 26
  const innerW = W - padX * 2
  const innerH = H - padTop - padBottom

  const n = series.length
  const points = series.map((v, i) => {
    const x = padX + (i / Math.max(1, n - 1)) * innerW
    const y = padTop + innerH - (v / Math.max(1, peak)) * innerH
    return { x, y, v }
  })

  const linePath =
    'M ' +
    points.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L ')
  const areaPath = `${linePath} L ${points[n - 1].x.toFixed(
    1
  )} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(
    padTop + innerH
  ).toFixed(1)} Z`

  // 4 horizontal gridlines (incl. baseline)
  const gridLines = [0.25, 0.5, 0.75, 1].map((t) => padTop + innerH * t)

  return (
    <div className="admin-chart-area">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Daily activity area chart"
      >
        <defs>
          <linearGradient id="admin-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((y, i) => (
          <line
            key={i}
            x1={padX}
            x2={W - padX}
            y1={y}
            y2={y}
            stroke="var(--border)"
            strokeDasharray="3 4"
            strokeWidth="1"
          />
        ))}

        <path d={areaPath} fill="url(#admin-area-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--brand)"
          strokeWidth="2.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) =>
          // Sparse dots — every 5th point + last for readability
          i % 5 === 0 || i === n - 1 ? (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3.2"
              fill="var(--bg)"
              stroke="var(--brand)"
              strokeWidth="2"
            />
          ) : null
        )}

        <text
          x={W - padX}
          y={padTop - 4}
          textAnchor="end"
          fontSize="11"
          fill="var(--muted-strong)"
          fontWeight="700"
        >
          peak · {peak}
        </text>
      </svg>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Donut card — listings by status                                      */
/* -------------------------------------------------------------------- */

function StatusDonutCard({ segments, total }) {
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h2>Listings by status</h2>
        <p>Breakdown across {total.toLocaleString('en-IN')} listings.</p>
      </div>

      <div className="admin-donut-wrap">
        <Donut segments={segments} size={170} thickness={28} centerLabel={total} />
        <ul className="admin-donut-legend">
          {segments.map((s) => {
            const pct = total > 0 ? Math.round((s.value / total) * 100) : 0
            return (
              <li key={s.key}>
                <span
                  className="admin-donut-swatch"
                  style={{ background: s.color }}
                />
                <span className="admin-donut-legend-label">{s.label}</span>
                <span className="admin-donut-legend-val">
                  {s.value.toLocaleString('en-IN')}{' '}
                  <small>· {pct}%</small>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Donut card — sign-up providers                                       */
/* -------------------------------------------------------------------- */

function ProviderDonutCard({ segments, total }) {
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h2>Sign-up sources</h2>
        <p>
          Where the {total.toLocaleString('en-IN')} registered accounts came
          from.
        </p>
      </div>

      {total === 0 ? (
        <div className="admin-empty">
          No users yet — sign-ups will be split out by provider here.
        </div>
      ) : (
        <div className="admin-donut-wrap">
          <Donut
            segments={segments}
            size={150}
            thickness={24}
            centerLabel={total}
          />
          <ul className="admin-donut-legend">
            {segments.map((s) => {
              const pct =
                total > 0 ? Math.round((s.value / total) * 100) : 0
              return (
                <li key={s.key}>
                  <span
                    className="admin-donut-swatch"
                    style={{ background: s.color }}
                  />
                  <span className="admin-donut-legend-label">
                    {s.key === 'google' ? (
                      <>
                        <ShieldIcon size={12} /> {s.label}
                      </>
                    ) : (
                      <>
                        <MailIcon size={12} /> {s.label}
                      </>
                    )}
                  </span>
                  <span className="admin-donut-legend-val">
                    {s.value.toLocaleString('en-IN')}{' '}
                    <small>· {pct}%</small>
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Reusable Donut SVG                                                   */
/* -------------------------------------------------------------------- */

function Donut({ segments, size = 150, thickness = 22, centerLabel }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Breakdown donut chart"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--soft)"
        strokeWidth={thickness}
      />
      {total > 0 &&
        segments.map((s, i) => {
          if (!s.value) return null
          const dash = (s.value / total) * c
          const gap = c - dash
          const slice = (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          )
          offset += dash
          return slice
        })}

      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="900"
        fontSize={Math.max(16, size * 0.18)}
        fill="var(--text)"
      >
        {centerLabel}
      </text>
      <text
        x={size / 2}
        y={size / 2 + Math.max(14, size * 0.14)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontWeight="700"
        fontSize="10"
        letterSpacing="1"
        fill="var(--muted-strong)"
      >
        TOTAL
      </text>
    </svg>
  )
}

/* -------------------------------------------------------------------- */
/*  Category & City bar list cards                                       */
/* -------------------------------------------------------------------- */

function CategoryBarCard({ categories }) {
  const max = categories[0]?.count || 1
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h2>Top categories</h2>
        <p>Live demand based on listings in each laundry category.</p>
      </div>
      <ul className="admin-cat-list">
        {categories.map((c) => {
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
              <span className="admin-cat-count">
                {c.count.toLocaleString('en-IN')}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CityBarCard({ cities }) {
  if (cities.length === 0) {
    return (
      <div className="admin-card">
        <div className="admin-card-head">
          <h2>Top cities</h2>
          <p>Where the bulk of listings come from.</p>
        </div>
        <div className="admin-empty">
          No location data yet — listings will populate this list.
        </div>
      </div>
    )
  }
  const max = cities[0]?.count || 1
  return (
    <div className="admin-card">
      <div className="admin-card-head">
        <h2>Top cities</h2>
        <p>Where the bulk of listings come from.</p>
      </div>
      <ul className="admin-cat-list admin-city-list">
        {cities.map((c) => {
          const pct = Math.max(4, Math.round((c.count / max) * 100))
          return (
            <li key={c.name} className="admin-cat-row">
              <span className="admin-cat-name admin-city-name">
                <PinIcon size={13} /> {c.name}
              </span>
              <span className="admin-cat-bar">
                <span
                  className="admin-cat-bar-fill admin-cat-bar-fill-violet"
                  style={{ width: `${pct}%` }}
                />
              </span>
              <span className="admin-cat-count">
                {c.count.toLocaleString('en-IN')}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Rating distribution histogram                                         */
/* -------------------------------------------------------------------- */

function RatingHistogramCard({ distribution, total, average }) {
  const max = Math.max(...distribution.map((d) => d.count), 1)
  return (
    <div className="admin-card">
      <div className="admin-card-head admin-card-head-row">
        <div>
          <h2>Rating distribution</h2>
          <p>
            Spread of star ratings across {total.toLocaleString('en-IN')}{' '}
            reviews.
          </p>
        </div>
        <div className="admin-chart-totals">
          <span className="admin-chart-total-big">
            {average ? average.toFixed(1) : '—'}
          </span>
          <span className="admin-chart-total-sub">average rating</span>
        </div>
      </div>

      {total === 0 ? (
        <div className="admin-empty">
          No reviews yet — the histogram fills in once feedback comes in.
        </div>
      ) : (
        <ul className="admin-rating-hist">
          {distribution.map((row) => {
            const pct = Math.max(4, Math.round((row.count / max) * 100))
            const share =
              total > 0 ? Math.round((row.count / total) * 100) : 0
            return (
              <li key={row.rating} className="admin-rating-hist-row">
                <span className="admin-rating-hist-label">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <StarIcon
                      key={i}
                      size={12}
                      filled={i <= row.rating}
                      className={
                        i <= row.rating ? 'admin-star-on' : 'admin-star-off'
                      }
                    />
                  ))}
                </span>
                <span className="admin-cat-bar">
                  <span
                    className="admin-cat-bar-fill admin-cat-bar-fill-amber"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="admin-rating-hist-count">
                  <strong>{row.count.toLocaleString('en-IN')}</strong>
                  <small>{share}%</small>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
