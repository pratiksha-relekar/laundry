import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import AdminPagination from './AdminPagination'
import { useProducts } from '../context/ProductsContext'
import { useAdminCatalog } from './useAdminCatalog'
import {
  CloseIcon,
  EditIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
  VerifiedIcon,
} from '../components/Icons'

// =====================================================================
// AdminProductsPage
// ---------------------------------------------------------------------
// Two-tab admin page:
//   • Products    — combined view of catalog + user ads + admin-added,
//                   with search and paginated rows. Admin can add new
//                   products via a modal; admin-added rows can be
//                   removed.
//   • Categories  — list of all categories (catalog + admin-added) with
//                   live product counts. Admin can add new categories.
//
// Styling reuses the existing `admin-*` classes from `desktop.css` and
// adds a small set of new ones (admin-toolbar, admin-tabs, admin-table,
// admin-pagination, admin-modal) that share the same design tokens so
// light / dark themes work without any extra rules.
// =====================================================================

const PAGE_SIZE = 8

const CONDITIONS = [
  'Used – Like New',
  'Used – Good',
  'Used – Fair',
  'Used – Excellent',
  'New',
]

const STATUSES = ['active', 'pending', 'sold']

function formatINR(value) {
  if (value == null || Number.isNaN(value)) return '₹0'
  return '₹' + Number(value).toLocaleString('en-IN')
}

function sourceLabel(src) {
  if (src === 'admin') return 'Admin'
  if (src === 'user') return 'User'
  return 'Catalog'
}

export default function AdminProductsPage() {
  const {
    addProduct,
    removeProduct,
    addCategory,
    removeCategory,
  } = useAdminCatalog()
  const { products: allProducts, categories: allCategories } = useProducts()

  const [tab, setTab] = useState('products')
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)

  // Search + category filter
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allProducts.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false
      if (!q) return true
      return (
        (p.title || '').toLowerCase().includes(q) ||
        (p.location || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      )
    })
  }, [allProducts, query, categoryFilter])

  // Any change that shrinks results should snap back to page 1. We do
  // this in the handlers (rather than via useEffect) so we never call
  // setState inside an effect body.
  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    setPage(1)
  }, [])
  const handleCategoryChange = useCallback((value) => {
    setCategoryFilter(value)
    setPage(1)
  }, [])
  const handleTabChange = useCallback((value) => {
    setTab(value)
    setPage(1)
  }, [])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredProducts.slice(start, start + PAGE_SIZE)
  }, [filteredProducts, safePage])

  // Per-category product counts (across the combined list).
  const categoryCounts = useMemo(() => {
    const counts = new Map()
    for (const p of allProducts) {
      counts.set(p.category, (counts.get(p.category) || 0) + 1)
    }
    return counts
  }, [allProducts])

  const handleAddProduct = async (data) => {
    try {
      await addProduct(data)
      setShowAddProduct(false)
      setTab('products')
      setPage(1)
    } catch (err) {
      console.warn('[admin] add product failed:', err?.message)
    }
  }

  const handleAddCategory = async (data) => {
    try {
      await addCategory(data)
      setShowAddCategory(false)
      setTab('categories')
    } catch (err) {
      console.warn('[admin] add category failed:', err?.message)
    }
  }

  return (
    <AdminLayout
      title="Products"
      subtitle="Add new listings, manage categories and keep the catalogue tidy."
    >
      <div className="admin-toolbar">
        <div className="admin-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'products'}
            className={`admin-tab ${tab === 'products' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('products')}
          >
            <PackageIcon size={16} />
            <span>Products</span>
            <span className="admin-tab-count">{allProducts.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'categories'}
            className={`admin-tab ${tab === 'categories' ? 'is-active' : ''}`}
            onClick={() => handleTabChange('categories')}
          >
            <UsersIcon size={16} />
            <span>Categories</span>
            <span className="admin-tab-count">{allCategories.length}</span>
          </button>
        </div>

        <div className="admin-toolbar-actions">
          {tab === 'products' && (
            <>
              <label className="admin-search">
                <SearchIcon size={16} />
                <input
                  type="text"
                  placeholder="Search by title, location or category…"
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
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                aria-label="Filter by category"
              >
                <option value="all">All categories</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => setShowAddProduct(true)}
              >
                <PlusIcon size={16} />
                Add Product
              </button>
            </>
          )}

          {tab === 'categories' && (
            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => setShowAddCategory(true)}
            >
              <PlusIcon size={16} />
              Add Category
            </button>
          )}
        </div>
      </div>

      {tab === 'products' ? (
        <ProductsTable
          products={pagedProducts}
          categories={allCategories}
          onDelete={removeProduct}
          page={safePage}
          totalPages={totalPages}
          totalCount={filteredProducts.length}
          onPage={setPage}
        />
      ) : (
        <CategoriesGrid
          categories={allCategories}
          categoryCounts={categoryCounts}
          onDelete={removeCategory}
        />
      )}

      {showAddProduct && (
        <AddProductModal
          categories={allCategories}
          onClose={() => setShowAddProduct(false)}
          onSubmit={handleAddProduct}
        />
      )}

      {showAddCategory && (
        <AddCategoryModal
          existingIds={new Set(allCategories.map((c) => c.id))}
          onClose={() => setShowAddCategory(false)}
          onSubmit={handleAddCategory}
        />
      )}
    </AdminLayout>
  )
}

/* -------------------------------------------------------------------- */
/*  Products table                                                       */
/* -------------------------------------------------------------------- */

function ProductsTable({
  products,
  categories,
  onDelete,
  page,
  totalPages,
  totalCount,
  onPage,
}) {
  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])),
    [categories]
  )

  return (
    <div className="admin-card admin-card-flush">
      {products.length === 0 ? (
        <div className="admin-empty admin-empty-lg">
          <PackageIcon size={28} />
          <p>No products match the current filters.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Location</th>
                <th>Source</th>
                <th>Status</th>
                <th className="admin-table-actions-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={`${p.source}-${p.id}`}>
                  <td>
                    <div className="admin-table-product">
                      <span
                        className="admin-table-thumb"
                        style={
                          p.image
                            ? { backgroundImage: `url(${p.image})` }
                            : undefined
                        }
                      />
                      <div className="admin-table-product-meta">
                        <span className="admin-table-title">{p.title}</span>
                        <span className="admin-table-sub">
                          {p.condition || '—'}
                          {p.verified && (
                            <span className="admin-table-verified">
                              <VerifiedIcon size={12} /> Verified
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-chip">
                      {catMap[p.category] || p.category || '—'}
                    </span>
                  </td>
                  <td className="admin-table-price">{formatINR(p.price)}</td>
                  <td className="admin-table-loc">{p.location || '—'}</td>
                  <td>
                    <span className={`admin-source admin-source-${p.source}`}>
                      {sourceLabel(p.source)}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`admin-badge admin-badge-${p.status || 'active'}`}
                    >
                      {p.status || 'active'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn-sm"
                        title="Edit (coming soon)"
                        aria-label="Edit"
                        disabled
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn admin-icon-btn-sm admin-icon-btn-danger"
                        title={
                          p.source === 'catalog'
                            ? 'Catalog seed products cannot be removed'
                            : 'Remove product'
                        }
                        aria-label="Delete"
                        disabled={p.source === 'catalog'}
                        onClick={() => {
                          if (p.source === 'catalog') return
                          if (
                            window.confirm(`Remove "${p.title}" from the catalog?`)
                          ) {
                            onDelete(p.id)
                          }
                        }}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminPagination
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={PAGE_SIZE}
        onPage={onPage}
      />
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Categories grid                                                      */
/* -------------------------------------------------------------------- */

function CategoriesGrid({ categories, categoryCounts, onDelete }) {
  if (categories.length === 0) {
    return (
      <div className="admin-empty admin-empty-lg">
        <UsersIcon size={28} />
        <p>No categories yet — add your first one.</p>
      </div>
    )
  }

  return (
    <div className="admin-cat-grid">
      {categories.map((c) => {
        const count = categoryCounts.get(c.id) || 0
        const isAdmin = c.source === 'admin'
        return (
          <div key={c.id} className="admin-cat-card">
            <div className="admin-cat-card-head">
              <span
                className="admin-cat-card-icon"
                style={{ background: `${c.iconColor || '#1B6FFF'}1f`, color: c.iconColor || '#1B6FFF' }}
              >
                <PackageIcon size={18} />
              </span>
              <div className="admin-cat-card-meta">
                <span className="admin-cat-card-name">{c.name}</span>
                <span className="admin-cat-card-id">/{c.id}</span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  className="admin-icon-btn admin-icon-btn-sm admin-icon-btn-danger"
                  title="Remove category"
                  aria-label="Delete category"
                  onClick={() => {
                    if (
                      window.confirm(`Remove the "${c.name}" category?`)
                    ) {
                      onDelete(c.id)
                    }
                  }}
                >
                  <TrashIcon size={14} />
                </button>
              )}
            </div>

            {c.tagline && (
              <p className="admin-cat-card-tag">{c.tagline}</p>
            )}

            <div className="admin-cat-card-stats">
              <span className="admin-cat-card-pill">
                <strong>{count}</strong> products
              </span>
              <span
                className={`admin-source admin-source-${
                  isAdmin ? 'admin' : 'catalog'
                }`}
              >
                {isAdmin ? 'Admin' : 'Catalog'}
              </span>
            </div>

            {Array.isArray(c.subcategories) && c.subcategories.length > 0 && (
              <ul className="admin-cat-card-subs">
                {c.subcategories.slice(0, 4).map((s) => (
                  <li key={s}>{s}</li>
                ))}
                {c.subcategories.length > 4 && (
                  <li className="admin-cat-card-subs-more">
                    +{c.subcategories.length - 4} more
                  </li>
                )}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Add Product modal                                                    */
/* -------------------------------------------------------------------- */

function AddProductModal({ categories, onClose, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    price: '',
    category: categories[0]?.id || '',
    location: '',
    image: '',
    condition: CONDITIONS[1],
    status: 'active',
    featured: false,
    verified: false,
  })
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => {
    const value =
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
  }

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    if (!form.title.trim()) next.title = 'Title is required'
    if (!form.category) next.category = 'Select a category'
    const priceNum = Number(form.price)
    if (!form.price || Number.isNaN(priceNum) || priceNum < 0) {
      next.price = 'Enter a valid price'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return
    onSubmit({
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      image: form.image.trim(),
      price: priceNum,
    })
  }

  return (
    <ModalShell title="Add new product" onClose={onClose}>
      <form className="admin-form" onSubmit={submit} noValidate>
        <div className="admin-form-row admin-form-row-full">
          <Field label="Title" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={update('title')}
              placeholder="e.g. LG 8kg Front Load Steam Washer"
              autoFocus
            />
          </Field>
        </div>

        <div className="admin-form-row">
          <Field label="Category" error={errors.category}>
            <select value={form.category} onChange={update('category')}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (₹)" error={errors.price}>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={update('price')}
              placeholder="18500"
            />
          </Field>
        </div>

        <div className="admin-form-row">
          <Field label="Condition">
            <select value={form.condition} onChange={update('condition')}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={update('status')}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="admin-form-row admin-form-row-full">
          <Field label="Location">
            <input
              type="text"
              value={form.location}
              onChange={update('location')}
              placeholder="e.g. Whitefield, Bengaluru"
            />
          </Field>
        </div>

        <div className="admin-form-row admin-form-row-full">
          <Field label="Image URL">
            <input
              type="url"
              value={form.image}
              onChange={update('image')}
              placeholder="https://…/photo.jpg"
            />
          </Field>
        </div>

        <div className="admin-form-toggles">
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={update('featured')}
            />
            <span>Featured</span>
          </label>
          <label className="admin-toggle">
            <input
              type="checkbox"
              checked={form.verified}
              onChange={update('verified')}
            />
            <span>Verified seller</span>
          </label>
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
            Add product
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

/* -------------------------------------------------------------------- */
/*  Add Category modal                                                   */
/* -------------------------------------------------------------------- */

function AddCategoryModal({ existingIds, onClose, onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    iconColor: '#1B6FFF',
    subcategories: '',
  })
  const [errors, setErrors] = useState({})

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    const next = {}
    const name = form.name.trim()
    if (!name) next.name = 'Category name is required'
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    if (slug && existingIds.has(slug)) {
      next.name = 'A category with this name already exists'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    const subs = form.subcategories
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

    onSubmit({
      name,
      tagline: form.tagline.trim(),
      iconColor: form.iconColor,
      subcategories: subs,
    })
  }

  return (
    <ModalShell title="Add new category" onClose={onClose}>
      <form className="admin-form" onSubmit={submit} noValidate>
        <div className="admin-form-row admin-form-row-full">
          <Field label="Category name" error={errors.name}>
            <input
              type="text"
              value={form.name}
              onChange={update('name')}
              placeholder="e.g. Commercial Vacuum Cleaners"
              autoFocus
            />
          </Field>
        </div>

        <div className="admin-form-row admin-form-row-full">
          <Field label="Tagline">
            <input
              type="text"
              value={form.tagline}
              onChange={update('tagline')}
              placeholder="One-line description shown on the home page"
            />
          </Field>
        </div>

        <div className="admin-form-row">
          <Field label="Accent color">
            <div className="admin-color-row">
              <input
                type="color"
                value={form.iconColor}
                onChange={update('iconColor')}
                aria-label="Accent color"
              />
              <input
                type="text"
                value={form.iconColor}
                onChange={update('iconColor')}
                className="admin-color-text"
              />
            </div>
          </Field>
        </div>

        <div className="admin-form-row admin-form-row-full">
          <Field label="Sub-categories" hint="One per line (optional)">
            <textarea
              value={form.subcategories}
              onChange={update('subcategories')}
              rows={4}
              placeholder={'Industrial models\nHome models\nPortable models'}
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
            Add category
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

/* -------------------------------------------------------------------- */
/*  Shared modal shell + form helpers                                    */
/* -------------------------------------------------------------------- */

function ModalShell({ title, onClose, children }) {
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
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>{title}</h2>
          <button
            type="button"
            className="admin-icon-btn admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>
        <div className="admin-modal-body">{children}</div>
      </div>
    </div>
  )
}

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
