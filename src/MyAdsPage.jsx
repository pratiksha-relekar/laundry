import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigation } from './context/NavigationContext'
import { useUserAds } from './context/UserAdsContext'
import { useWishlist } from './context/WishlistContext'
import ProductCard from './components/ProductCard'
import {
  ArrowLeftIcon,
  EditIcon,
  EyeStatsIcon,
  HeartIcon,
  PackageIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from './components/Icons'

function formatPrice(n) {
  return `₹ ${(n ?? 0).toLocaleString('en-IN')}`
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'sold', label: 'Sold' },
]

function MyAdRow({ ad, onOpen, onEdit, onDelete }) {
  return (
    <article className="myad-row">
      <button type="button" className="myad-thumb" onClick={() => onOpen(ad.id)}>
        <img src={ad.image} alt="" loading="lazy" />
      </button>

      <div className="myad-info">
        <div className="myad-info-top">
          <span className={`myad-status myad-status-${ad.status || 'active'}`}>
            {ad.status || 'active'}
          </span>
          <span className="myad-date">Posted {ad.date}</span>
        </div>
        <button
          type="button"
          className="myad-title-btn"
          onClick={() => onOpen(ad.id)}
        >
          {ad.title}
        </button>
        <div className="myad-price">{formatPrice(ad.price)}</div>
        <div className="myad-stats">
          <span>
            <EyeStatsIcon size={14} />
            <strong>{ad.views ?? 0}</strong> views
          </span>
          <span>
            <UserIcon size={14} />
            <strong>{ad.chats ?? 0}</strong> chats
          </span>
        </div>
      </div>

      <div className="myad-actions">
        <button
          type="button"
          className="myad-action"
          onClick={() => onEdit(ad.id)}
        >
          <EditIcon size={14} /> Edit
        </button>
        <button
          type="button"
          className="myad-action myad-action-danger"
          onClick={() => onDelete(ad.id)}
        >
          <TrashIcon size={14} /> Delete
        </button>
      </div>
    </article>
  )
}

export default function MyAdsPage({ scrollToWishlist = false }) {
  const { user, loading: authLoading } = useAuth()
  const { goHome, goLogin, goSell, openProduct, goEditAd } = useNavigation()
  const { ads, removeAd } = useUserAds()
  const {
    items: wishlistItems,
    count: wishlistCount,
    clear: clearWishlist,
    clearing: clearingWishlist,
  } = useWishlist()

  const [tab, setTab] = useState('all')
  const wishlistRef = useRef(null)

  const visible = useMemo(
    () => (tab === 'all' ? ads : ads.filter((a) => (a.status || 'active') === tab)),
    [ads, tab]
  )

  const counts = useMemo(
    () => ({
      all: ads.length,
      active: ads.filter((a) => (a.status || 'active') === 'active').length,
      pending: ads.filter((a) => a.status === 'pending').length,
      sold: ads.filter((a) => a.status === 'sold').length,
    }),
    [ads]
  )

  useEffect(() => {
    if (!scrollToWishlist || authLoading || !user) return
    const el = wishlistRef.current
    if (!el) return
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [scrollToWishlist, authLoading, user])

  const scrollToWishlistSection = () => {
    wishlistRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (authLoading) {
    return (
      <div className="lx-page myads-page">
        <div className="lx-page-head">
          <button type="button" className="details-back" onClick={goHome}>
            <ArrowLeftIcon size={16} /> Back to listings
          </button>
          <h1 className="lx-page-h1">My ADS</h1>
        </div>
        <div className="myads-loading" aria-live="polite">
          Loading your listings…
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="lx-page myads-page">
        <div className="lx-page-head">
          <button type="button" className="details-back" onClick={goHome}>
            <ArrowLeftIcon size={16} /> Back to listings
          </button>
          <h1 className="lx-page-h1">My ADS</h1>
        </div>
        <div className="myads-empty">
          <div className="myads-empty-icon" aria-hidden>
            <UserIcon size={36} />
          </div>
          <h2>Login to see your ads</h2>
          <p>Sign in to manage your listings and saved items.</p>
          <button type="button" className="auth-submit" onClick={goLogin}>
            Login or Sign up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lx-page myads-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={goHome}>
          <ArrowLeftIcon size={16} /> Back to listings
        </button>

        <div className="lx-page-title-row">
          <div>
            <h1 className="lx-page-h1">My ADS</h1>
            <p className="lx-page-sub">
              {counts.all === 0
                ? "You haven't posted any ads yet."
                : `${counts.all} listing${counts.all === 1 ? '' : 's'} · ${counts.active} active`}
              {wishlistCount > 0
                ? ` · ${wishlistCount} saved`
                : ''}
            </p>
          </div>
          <button type="button" className="myads-post" onClick={goSell}>
            <PlusIcon size={16} /> Post a new Ads
          </button>
        </div>

        <div className="myads-stats" aria-label="Account summary">
          <div className="myads-stat">
            <PackageIcon size={18} />
            <div>
              <strong>{counts.all}</strong>
              <span>Listing{counts.all === 1 ? '' : 's'}</span>
            </div>
          </div>
          <button
            type="button"
            className="myads-stat myads-stat-link"
            onClick={scrollToWishlistSection}
            aria-label={`Wishlist — ${wishlistCount} saved`}
          >
            <HeartIcon size={18} filled={wishlistCount > 0} />
            <div>
              <strong>{wishlistCount}</strong>
              <span>Saved</span>
            </div>
          </button>
        </div>

        <div className="myads-tabs" role="tablist" aria-label="Listing filters">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === tab}
              className={`myads-tab ${t.id === tab ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
              type="button"
            >
              {t.label}
              <span className="myads-tab-count">{counts[t.id] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="myads-section" aria-labelledby="myads-listings-heading">
        <h2 id="myads-listings-heading" className="myads-section-title">
          My listings
        </h2>

        {visible.length === 0 ? (
          <div className="myads-empty">
            <div className="myads-empty-icon" aria-hidden>
              <PlusIcon size={32} />
            </div>
            <h3>
              {ads.length === 0
                ? 'Post your first ad'
                : 'No ads in this section'}
            </h3>
            <p>
              {ads.length === 0
                ? 'Reach thousands of buyers across India in minutes. It only takes a minute to list your first product.'
                : 'Switch to a different tab or Post a new Ads to get started.'}
            </p>
            <button
              type="button"
              className="auth-submit"
              onClick={ads.length === 0 ? goSell : () => setTab('all')}
            >
              {ads.length === 0 ? 'Post an ad' : 'View all ads'}
            </button>
          </div>
        ) : (
          <div className="myads-list">
            {visible.map((ad) => (
              <MyAdRow
                key={ad.id}
                ad={ad}
                onOpen={openProduct}
                onEdit={goEditAd}
                onDelete={removeAd}
              />
            ))}
          </div>
        )}
      </section>

      <section
        ref={wishlistRef}
        id="myads-wishlist"
        className="myads-section myads-wishlist-section"
        aria-labelledby="myads-wishlist-heading"
      >
        <div className="myads-section-head">
          <h2 id="myads-wishlist-heading" className="myads-section-title">
            <HeartIcon size={18} filled={wishlistCount > 0} /> My wishlist
          </h2>
          {wishlistCount > 0 && (
            <button
              type="button"
              className="lx-page-clear"
              disabled={clearingWishlist}
              onClick={() => clearWishlist()}
            >
              <TrashIcon size={14} />{' '}
              {clearingWishlist ? 'Clearing…' : 'Clear all'}
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty myads-wishlist-empty">
            <div className="wishlist-empty-icon" aria-hidden>
              <HeartIcon size={36} />
            </div>
            <h3>No saved items yet</h3>
            <p>
              Tap the heart on any listing to save it here. Your wishlist stays
              on your account so you can come back any time.
            </p>
            <button
              type="button"
              className="auth-submit wishlist-empty-cta"
              onClick={goHome}
            >
              Browse listings
            </button>
          </div>
        ) : (
          <div className="lx-page-grid">
            {wishlistItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
