import { useCallback, useEffect, useState } from 'react'

// =====================================================================
// useAdminCatalog
// ---------------------------------------------------------------------
// Tiny hook that owns the admin-added products & categories. The static
// catalog (src/data/products.js, src/data/categories.js) is read-only —
// admins layer their own items on top, and those extras are persisted
// per-browser in localStorage so they survive a reload.
//
// Storage keys:
//   laundry:admin:products    → Array<AdminProduct>
//   laundry:admin:categories  → Array<AdminCategory>
// =====================================================================

const PRODUCTS_KEY = 'laundry:admin:products'
const CATEGORIES_KEY = 'laundry:admin:categories'

function readJSON(key) {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota / privacy-mode — silently ignore
  }
}

function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`
}

export function useAdminCatalog() {
  const [adminProducts, setAdminProducts] = useState(() =>
    readJSON(PRODUCTS_KEY)
  )
  const [adminCategories, setAdminCategories] = useState(() =>
    readJSON(CATEGORIES_KEY)
  )

  useEffect(() => {
    writeJSON(PRODUCTS_KEY, adminProducts)
  }, [adminProducts])

  useEffect(() => {
    writeJSON(CATEGORIES_KEY, adminCategories)
  }, [adminCategories])

  const addProduct = useCallback((data) => {
    const product = {
      id: genId('ap'),
      source: 'admin',
      createdAt: Date.now(),
      status: 'active',
      featured: false,
      verified: false,
      ...data,
      price: Number(data.price) || 0,
    }
    setAdminProducts((list) => [product, ...list])
    return product
  }, [])

  const removeProduct = useCallback((id) => {
    setAdminProducts((list) => list.filter((p) => p.id !== id))
  }, [])

  const updateProduct = useCallback((id, patch) => {
    setAdminProducts((list) =>
      list.map((p) => (p.id === id ? { ...p, ...patch } : p))
    )
  }, [])

  const addCategory = useCallback((data) => {
    const name = (data.name || '').trim()
    const slug =
      (data.id || name)
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || genId('cat')
    const category = {
      id: slug,
      source: 'admin',
      createdAt: Date.now(),
      iconName: 'Package',
      iconColor: data.iconColor || '#1B6FFF',
      count: 0,
      subcategories: [],
      ...data,
      name,
    }
    setAdminCategories((list) => {
      const exists = list.some((c) => c.id === category.id)
      return exists ? list : [category, ...list]
    })
    return category
  }, [])

  const removeCategory = useCallback((id) => {
    setAdminCategories((list) => list.filter((c) => c.id !== id))
  }, [])

  return {
    adminProducts,
    adminCategories,
    addProduct,
    removeProduct,
    updateProduct,
    addCategory,
    removeCategory,
  }
}

// Helper for the dashboard / products page — reads every user-posted ad
// out of `laundry:userAds:<userId>` keys and returns a flat list.
export function readUserPostedAds() {
  const out = []
  if (typeof window === 'undefined') return out
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key || !key.startsWith('laundry:userAds:')) continue
      try {
        const value = JSON.parse(window.localStorage.getItem(key) || '[]')
        if (Array.isArray(value)) {
          const ownerId = key.replace('laundry:userAds:', '')
          for (const ad of value) {
            out.push({ ...ad, ownerId, source: 'user' })
          }
        }
      } catch {
        /* skip malformed blob */
      }
    }
  } catch {
    /* localStorage unavailable */
  }
  return out
}
