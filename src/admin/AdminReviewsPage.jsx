import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import AdminPagination from './AdminPagination'
import { useAdminReviews } from './useAdminReviews'
import { products as CATALOG_PRODUCTS } from '../data/products'
import {
  CheckIcon,
  CloseIcon,
  FlagIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from '../components/Icons'

// =====================================================================
// AdminReviewsPage
// ---------------------------------------------------------------------
// Two-tab moderation surface for the reviews mock store:
//   • Product Reviews — what buyers say about a specific product
//   • Seller Reviews  — what buyers say about a specific seller
//
// Reviews are auto-seeded (deterministic, ties into real catalog/sellers)
// the first time the page loads and are then persisted in localStorage
// so admin moderation actions (approve / flag / delete / add) stick.
// =====================================================================

const PAGE_SIZE = 6

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'flagged', label: 'Flagged' },
]

const RATING_OPTIONS = [
  { value: 'all', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'highest', label: 'Highest rated' },
  { value: 'lowest', label: 'Lowest rated' },
]

function formatDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function relativeTime(value) {
  if (!value) return '—'
  const diff = Date.now() - value
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

export default function AdminReviewsPage() {
  const { reviews, stats, addReview, removeReview, setReviewStatus } =
    useAdminReviews()

  const [tab, setTab] = useState('product')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)

  const productReviews = useMemo(
    () => reviews.filter((r) => r.type === 'product'),
    [reviews]
  )
  const sellerReviews = useMemo(
    () => reviews.filter((r) => r.type === 'seller'),
    [reviews]
  )

  const tabReviews = tab === 'product' ? productReviews : sellerReviews

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = tabReviews.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (ratingFilter !== 'all' && r.rating !== Number(ratingFilter))
        return false
      if (!q) return true
      return (
        (r.reviewer?.name || '').toLowerCase().includes(q) ||
        (r.targetTitle || '').toLowerCase().includes(q) ||
        (r.title || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q)
      )
    })
    list = [...list]
    if (sort === 'oldest') list.sort((a, b) => a.createdAt - b.createdAt)
    else if (sort === 'highest') list.sort((a, b) => b.rating - a.rating)
    else if (sort === 'lowest') list.sort((a, b) => a.rating - b.rating)
    else list.sort((a, b) => b.createdAt - a.createdAt)
    return list
  }, [tabReviews, query, statusFilter, ratingFilter, sort])

  // Per-tab moderation stats so the toolbar can mirror what's visible.
  const tabStats = useMemo(() => {
    let approved = 0
    let pending = 0
    let flagged = 0
    let sum = 0
    for (const r of tabReviews) {
      sum += r.rating
      if (r.status === 'approved') approved++
      else if (r.status === 'pending') pending++
      else if (r.status === 'flagged') flagged++
    }
    return {
      total: tabReviews.length,
      approved,
      pending,
      flagged,
      average: tabReviews.length > 0 ? sum / tabReviews.length : 0,
    }
  }, [tabReviews])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  const handleTabChange = useCallback((value) => {
    setTab(value)
    setPage(1)
  }, [])
  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    setPage(1)
  }, [])
  const handleStatusChange = useCallback((value) => {
    setStatusFilter(value)
    setPage(1)
  }, [])
  const handleRatingChange = useCallback((value) => {
    setRatingFilter(value)
    setPage(1)
  }, [])

  const handleAdd = (data) => {
    addReview(data)
    setShowAdd(false)
    setPage(1)
    setTab(data.type)
  }

  return (
    <AdminLayout
      title="Reviews"
      subtitle="Moderate product feedback and seller reputation across the marketplace."
    >
      <section className="admin-stats">
        <StatCard
          icon={StarIcon}
          label="Total reviews"
          value={stats.total.toLocaleString('en-IN')}
          trend={`${stats.average.toFixed(1)} avg across all`}
          tone="brand"
        />
        <StatCard
          icon={CheckIcon}
          label="Approved"
          value={(stats.total - stats.pending - stats.flagged).toLocaleString(
            'en-IN'
          )}
          trend="published & live"
          tone="green"
        />
        <StatCard
          icon={CheckIcon}
          label="Pending review"
          value={stats.pending.toLocaleString('en-IN')}
          trend="awaiting decision"
          tone="amber"
        />
        <StatCard
          icon={FlagIcon}
          label="Flagged"
          value={stats.flagged.toLocaleString('en-IN')}
          trend="needs attention"
          tone="violet"
        />
      </section>

      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'product'}
            className={`admin-tab ${tab === 'product' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('product')}
          >
            <PackageIcon size={16} />
            <span>Product reviews</span>
            <span className="admin-tab-count">{productReviews.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'seller'}
            className={`admin-tab ${tab === 'seller' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('seller')}
          >
            <UsersIcon size={16} />
            <span>Seller reviews</span>
            <span className="admin-tab-count">{sellerReviews.length}</span>
          </button>
        </div>

        <div className="admin-toolbar-actions">
          <label className="admin-search">
            <SearchIcon size={16} />
            <input
              type="text"
              placeholder="Search reviewer, product/seller, or comment…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => handleQueryChange('')}
                aria-label="Clear search"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </label>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={ratingFilter}
            onChange={(e) => handleRatingChange(e.target.value)}
            aria-label="Filter by rating"
          >
            {RATING_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className="admin-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort reviews"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={() => setShowAdd(true)}
          >
            <PlusIcon size={16} />
            Add review
          </button>
        </div>
      </div>

      <div className="admin-reviews-summary">
        <SummaryPill
          tone="green"
          icon={CheckIcon}
          label="Approved"
          value={tabStats.approved}
        />
        <SummaryPill
          tone="amber"
          icon={CheckIcon}
          label="Pending"
          value={tabStats.pending}
        />
        <SummaryPill
          tone="danger"
          icon={FlagIcon}
          label="Flagged"
          value={tabStats.flagged}
        />
        <SummaryPill
          tone="brand"
          icon={StarIcon}
          label="Average"
          value={tabStats.average ? tabStats.average.toFixed(1) : '—'}
        />
      </div>

      {paged.length === 0 ? (
        <div className="admin-card admin-card-flush">
          <div className="admin-empty admin-empty-lg">
            <StarIcon size={28} />
            <p>
              {tabReviews.length === 0
                ? 'No reviews on this tab yet — add one to get started.'
                : 'No reviews match the current filters.'}
            </p>
          </div>
        </div>
      ) : (
        <section className="admin-review-grid">
          {paged.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onOpen={() => setSelected(r)}
              onApprove={() => setReviewStatus(r.id, 'approved')}
              onFlag={() => setReviewStatus(r.id, 'flagged')}
              onDelete={() => {
                if (
                  window.confirm(
                    `Delete this ${r.type === 'product' ? 'product' : 'seller'} review?`
                  )
                ) {
                  removeReview(r.id)
                  setSelected((prev) => (prev?.id === r.id ? null : prev))
                }
              }}
            />
          ))}
        </section>
      )}

      <AdminPagination
        page={safePage}
        totalPages={totalPages}
        totalCount={filtered.length}
        pageSize={PAGE_SIZE}
        onPage={setPage}
      />

      {selected && (
        <ReviewDetailModal
          review={selected}
          onClose={() => setSelected(null)}
          onApprove={() => {
            setReviewStatus(selected.id, 'approved')
            setSelected((r) => ({ ...r, status: 'approved' }))
          }}
          onFlag={() => {
            setReviewStatus(selected.id, 'flagged')
            setSelected((r) => ({ ...r, status: 'flagged' }))
          }}
          onPending={() => {
            setReviewStatus(selected.id, 'pending')
            setSelected((r) => ({ ...r, status: 'pending' }))
          }}
          onDelete={() => {
            if (window.confirm('Delete this review?')) {
              removeReview(selected.id)
              setSelected(null)
            }
          }}
        />
      )}

      {showAdd && (
        <AddReviewModal
          onClose={() => setShowAdd(false)}
          onSubmit={handleAdd}
          initialType={tab}
        />
      )}
    </AdminLayout>
  )
}

/* -------------------------------------------------------------------- */
/*  Stat card (matches dashboard)                                        */
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
            {trend}
          </span>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Reusable star row                                                    */
/* -------------------------------------------------------------------- */

function Stars({ value, size = 14 }) {
  return (
    <span className="admin-stars" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon
          key={i}
          size={size}
          filled={i <= value}
          className={i <= value ? 'admin-star-on' : 'admin-star-off'}
        />
      ))}
      <span className="admin-stars-value">{value.toFixed(1)}</span>
    </span>
  )
}

/* -------------------------------------------------------------------- */
/*  Summary pill                                                         */
/* -------------------------------------------------------------------- */

function SummaryPill({ tone, icon: Icon, label, value }) {
  return (
    <div className={`admin-summary-pill admin-summary-pill-${tone}`}>
      <Icon size={14} />
      <span className="admin-summary-pill-label">{label}</span>
      <span className="admin-summary-pill-value">{value}</span>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Single review card                                                   */
/* -------------------------------------------------------------------- */

function ReviewCard({ review, onOpen, onApprove, onFlag, onDelete }) {
  const targetIsProduct = review.type === 'product'
  return (
    <article className="admin-review-card">
      <header className="admin-review-head">
        <button
          type="button"
          className="admin-review-reviewer"
          onClick={onOpen}
        >
          <span className="admin-user-avatar-lg">
            {review.reviewer?.initial || 'U'}
          </span>
          <span className="admin-review-reviewer-meta">
            <span className="admin-review-reviewer-name">
              {review.reviewer?.name || 'Anonymous'}
            </span>
            <span className="admin-review-reviewer-sub">
              {relativeTime(review.createdAt)} ·{' '}
              {review.source === 'admin' ? 'admin entry' : 'user submitted'}
            </span>
          </span>
        </button>
        <span className={`admin-badge admin-badge-${review.status}`}>
          {review.status}
        </span>
      </header>

      <div className="admin-review-body" onClick={onOpen} role="presentation">
        <Stars value={review.rating} />
        <h3 className="admin-review-title">{review.title}</h3>
        <p className="admin-review-comment">{review.comment}</p>
      </div>

      <div className="admin-review-target">
        {targetIsProduct ? (
          <span
            className="admin-review-target-thumb"
            style={
              review.targetImage
                ? { backgroundImage: `url(${review.targetImage})` }
                : undefined
            }
          />
        ) : (
          <span className="admin-review-target-thumb admin-review-target-thumb-seller">
            <UserIcon size={16} />
          </span>
        )}
        <div className="admin-review-target-meta">
          <span className="admin-review-target-kind">
            {targetIsProduct ? 'Product' : 'Seller'}
          </span>
          <span className="admin-review-target-name">{review.targetTitle}</span>
          {review.targetMeta && (
            <span className="admin-review-target-sub">
              {review.targetMeta}
            </span>
          )}
        </div>
      </div>

      <footer className="admin-review-actions">
        <button
          type="button"
          className="admin-icon-btn admin-icon-btn-sm"
          title="Approve"
          aria-label="Approve review"
          onClick={onApprove}
          disabled={review.status === 'approved'}
        >
          <CheckIcon size={14} />
        </button>
        <button
          type="button"
          className="admin-icon-btn admin-icon-btn-sm"
          title="Flag"
          aria-label="Flag review"
          onClick={onFlag}
          disabled={review.status === 'flagged'}
        >
          <FlagIcon size={14} />
        </button>
        <button
          type="button"
          className="admin-icon-btn admin-icon-btn-sm admin-icon-btn-danger"
          title="Delete review"
          aria-label="Delete review"
          onClick={onDelete}
        >
          <TrashIcon size={14} />
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm admin-review-open"
          onClick={onOpen}
        >
          View
        </button>
      </footer>
    </article>
  )
}

/* -------------------------------------------------------------------- */
/*  Review detail modal                                                  */
/* -------------------------------------------------------------------- */

function ReviewDetailModal({
  review,
  onClose,
  onApprove,
  onFlag,
  onPending,
  onDelete,
}) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="admin-modal admin-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <div className="admin-modal-user-head">
            <span className="admin-user-avatar-xl">
              {review.reviewer?.initial || 'U'}
            </span>
            <div>
              <h2>{review.reviewer?.name || 'Anonymous'}</h2>
              <p className="admin-modal-user-sub">
                Posted {formatDate(review.createdAt)} ·{' '}
                <span className={`admin-badge admin-badge-${review.status}`}>
                  {review.status}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-icon-btn admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="admin-modal-body">
          <div className="admin-review-detail-rating">
            <Stars value={review.rating} size={20} />
          </div>
          <h3 className="admin-review-detail-title">{review.title}</h3>
          <p className="admin-review-detail-comment">{review.comment}</p>

          <div className="admin-detail-ads">
            <div className="admin-card-head">
              <h2>
                {review.type === 'product' ? 'Reviewed product' : 'Reviewed seller'}
              </h2>
              <p>Subject of this review.</p>
            </div>
            <div className="admin-review-target admin-review-target-detail">
              {review.type === 'product' ? (
                <span
                  className="admin-review-target-thumb admin-review-target-thumb-lg"
                  style={
                    review.targetImage
                      ? { backgroundImage: `url(${review.targetImage})` }
                      : undefined
                  }
                />
              ) : (
                <span className="admin-review-target-thumb admin-review-target-thumb-lg admin-review-target-thumb-seller">
                  <UserIcon size={22} />
                </span>
              )}
              <div className="admin-review-target-meta">
                <span className="admin-review-target-kind">
                  {review.type === 'product' ? 'Product' : 'Seller'}
                </span>
                <span className="admin-review-target-name">
                  {review.targetTitle}
                </span>
                {review.targetMeta && (
                  <span className="admin-review-target-sub">
                    {review.targetMeta}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="admin-modal-actions admin-modal-actions-split">
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={onDelete}
          >
            <TrashIcon size={14} />
            Delete review
          </button>
          <div className="admin-modal-actions-cluster">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onPending}
              disabled={review.status === 'pending'}
            >
              Mark pending
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={onFlag}
              disabled={review.status === 'flagged'}
            >
              <FlagIcon size={14} />
              Flag
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={onApprove}
              disabled={review.status === 'approved'}
            >
              <CheckIcon size={14} />
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Add review modal                                                     */
/* -------------------------------------------------------------------- */

function AddReviewModal({ onClose, onSubmit, initialType }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Build a small unique seller list straight from the catalog so the
  // dropdown is in sync with whatever the rest of the app shows.
  const sellers = useMemo(() => {
    const map = new Map()
    for (const p of CATALOG_PRODUCTS) {
      if (!p.seller || map.has(p.seller.name)) continue
      map.set(p.seller.name, p.seller)
    }
    return Array.from(map.values())
  }, [])

  const [form, setForm] = useState(() => ({
    type: initialType || 'product',
    targetId:
      (initialType === 'seller'
        ? sellers[0]?.name
        : CATALOG_PRODUCTS[0]?.id) || '',
    reviewerName: '',
    rating: 5,
    title: '',
    comment: '',
    status: 'approved',
  }))
  const [errors, setErrors] = useState({})

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  // Flipping review type means the previously-picked target id no
  // longer points at a valid option — snap to the first item in the
  // new list right here in the handler (avoids a setState-in-effect).
  const handleTypeChange = (e) => {
    const nextType = e.target.value
    const nextTargetId =
      nextType === 'product'
        ? CATALOG_PRODUCTS[0]?.id || ''
        : sellers[0]?.name || ''
    setForm((f) => ({ ...f, type: nextType, targetId: nextTargetId }))
  }

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.reviewerName.trim()) next.reviewerName = 'Reviewer name is required'
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.comment.trim()) next.comment = 'Comment is required'
    if (!form.targetId) next.targetId = 'Pick a target'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    let payload
    if (form.type === 'product') {
      const product = CATALOG_PRODUCTS.find((p) => p.id === form.targetId)
      payload = {
        type: 'product',
        targetId: form.targetId,
        targetTitle: product?.title || form.targetId,
        targetImage: product?.image,
        targetMeta: product?.location?.split(',')[0]?.trim(),
        reviewerName: form.reviewerName.trim(),
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
        status: form.status,
      }
    } else {
      const seller = sellers.find((s) => s.name === form.targetId)
      payload = {
        type: 'seller',
        targetId:
          'seller-' +
          form.targetId
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, ''),
        targetTitle: form.targetId,
        targetMeta: seller ? `Member since ${seller.memberSince}` : undefined,
        reviewerName: form.reviewerName.trim(),
        rating: form.rating,
        title: form.title.trim(),
        comment: form.comment.trim(),
        status: form.status,
      }
    }
    onSubmit(payload)
  }

  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="admin-modal admin-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <h2>Add a review</h2>
          <button
            type="button"
            className="admin-icon-btn admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="admin-modal-body">
          <form className="admin-form" onSubmit={submit} noValidate>
            <div className="admin-form-row">
              <Field label="Review type">
                <select value={form.type} onChange={handleTypeChange}>
                  <option value="product">Product review</option>
                  <option value="seller">Seller review</option>
                </select>
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={update('status')}>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="flagged">Flagged</option>
                </select>
              </Field>
            </div>

            <div className="admin-form-row admin-form-row-full">
              <Field
                label={form.type === 'product' ? 'Product' : 'Seller'}
                error={errors.targetId}
              >
                <select value={form.targetId} onChange={update('targetId')}>
                  {form.type === 'product'
                    ? CATALOG_PRODUCTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))
                    : sellers.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name} · {s.memberSince}
                        </option>
                      ))}
                </select>
              </Field>
            </div>

            <div className="admin-form-row">
              <Field label="Reviewer name" error={errors.reviewerName}>
                <input
                  type="text"
                  value={form.reviewerName}
                  onChange={update('reviewerName')}
                  placeholder="e.g. Anjali Pillai"
                  autoFocus
                />
              </Field>
              <Field label="Rating">
                <div className="admin-rating-picker" role="radiogroup">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={form.rating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className={`admin-rating-star ${
                        form.rating >= n ? 'is-on' : ''
                      }`}
                      onClick={() => setForm((f) => ({ ...f, rating: n }))}
                    >
                      <StarIcon size={22} filled={form.rating >= n} />
                    </button>
                  ))}
                  <span className="admin-rating-picker-value">
                    {form.rating}.0
                  </span>
                </div>
              </Field>
            </div>

            <div className="admin-form-row admin-form-row-full">
              <Field label="Title" error={errors.title}>
                <input
                  type="text"
                  value={form.title}
                  onChange={update('title')}
                  placeholder="One-line summary"
                />
              </Field>
            </div>

            <div className="admin-form-row admin-form-row-full">
              <Field label="Comment" error={errors.comment}>
                <textarea
                  value={form.comment}
                  onChange={update('comment')}
                  rows={4}
                  placeholder="What did the buyer say?"
                />
              </Field>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="admin-btn admin-btn-primary">
                Add review
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Field helper (same shape as AdminProductsPage)                       */
/* -------------------------------------------------------------------- */

function Field({ label, error, hint, children }) {
  return (
    <label className={`admin-field ${error ? 'has-error' : ''}`}>
      <span className="admin-field-label">{label}</span>
      {children}
      {hint && !error && <small className="admin-field-hint">{hint}</small>}
      {error && <small className="admin-field-error">{error}</small>}
    </label>
  )
}
