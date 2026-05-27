import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { products as STATIC_PRODUCTS } from '../data/products'
import { categories as STATIC_CATEGORIES } from '../data/categories'
import {
  createCategory as fbCreateCategory,
  createProduct as fbCreateProduct,
  deleteCategory as fbDeleteCategory,
  countSellerProducts,
  deleteProduct as fbDeleteProduct,
  subscribeToAllProducts,
  subscribeToCategories,
  updateProduct as fbUpdateProduct,
} from '../auth/products'
import { bumpAdsCount, demoteToBuyerIfNoListings } from '../auth/users'

// =====================================================================
// ProductsContext
// ---------------------------------------------------------------------
// Single source of truth for the marketplace. Subscribes once to the
// top-level Firestore `products` and `categories` collections so every
// page (home, search, My ADS, admin) sees the exact same data.
//
// Exposes:
//   loading             — true until the first products snapshot
//   marketplaceProducts — live list from Firestore (user + admin)
//   products            — marketplaceProducts merged with the static
//                          catalog seed (always shown so a brand-new
//                          deployment isn't empty)
//   adminProducts       — Firestore products with source === 'admin'
//   customCategories    — Firestore categories
//   categories          — static seed merged with customCategories
//   addProduct({...}, sellerId?) — create a marketplace product
//   updateProduct(id, patch)
//   removeProduct(id, ownerId?)  — remove a product (decrements seller
//                                  adsCount if ownerId given)
//   addCategory(payload)
//   removeCategory(id)
// =====================================================================

const ProductsContext = createContext(null)

// Static catalog products are tagged so the admin UI can tell them
// apart from live ones (they cannot be deleted from Firestore).
const SEED_PRODUCTS = STATIC_PRODUCTS.map((p) => ({ ...p, source: 'catalog' }))
const SEED_CATEGORIES = STATIC_CATEGORIES.map((c) => ({
  ...c,
  source: c.source || 'catalog',
}))

export function ProductsProvider({ children }) {
  const [marketplaceProducts, setMarketplaceProducts] = useState([])
  const [customCategories, setCustomCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let done = false
    const unsubscribe = subscribeToAllProducts(
      (list) => {
        setMarketplaceProducts(list)
        if (!done) {
          done = true
          setLoading(false)
        }
      },
      () => {
        setMarketplaceProducts([])
        if (!done) {
          done = true
          setLoading(false)
        }
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToCategories(
      setCustomCategories,
      () => setCustomCategories([])
    )
    return unsubscribe
  }, [])

  const adminProducts = useMemo(
    () => marketplaceProducts.filter((p) => p.source === 'admin'),
    [marketplaceProducts]
  )

  // Newest live products first, then the static catalog seed underneath
  // so we always have something to show.
  const products = useMemo(
    () => [...marketplaceProducts, ...SEED_PRODUCTS],
    [marketplaceProducts]
  )

  // Firestore categories take precedence over the static ones (by id).
  const categories = useMemo(() => {
    const map = new Map()
    for (const c of SEED_CATEGORIES) map.set(c.id, c)
    for (const c of customCategories) map.set(c.id, c)
    return [...map.values()]
  }, [customCategories])

  const productsByCategory = useMemo(() => {
    const map = {}
    for (const p of products) {
      if (!p.category) continue
      if (!map[p.category]) map[p.category] = []
      map[p.category].push(p)
    }
    return map
  }, [products])

  // Fast id → product lookup for details, wishlist and chat pages.
  const productMap = useMemo(() => {
    const map = {}
    for (const p of products) {
      if (p.id) map[p.id] = p
    }
    return map
  }, [products])

  // ----- writes --------------------------------------------------------

  const addProduct = useCallback(async (payload, sellerId) => {
    const saved = await fbCreateProduct(payload)
    if (sellerId) {
      // Fire-and-forget — the global products subscription updates
      // immediately; the user doc just tracks a cached count.
      bumpAdsCount(sellerId, 1).catch(() => {})
    }
    return saved
  }, [])

  const updateProduct = useCallback(async (id, patch) => {
    await fbUpdateProduct(id, patch)
  }, [])

  const removeProduct = useCallback(async (id, ownerId) => {
    await fbDeleteProduct(id)
    if (!ownerId) return { demoted: false, remaining: null }

    bumpAdsCount(ownerId, -1).catch(() => {})
    const remaining = await countSellerProducts(ownerId)
    const demoted = await demoteToBuyerIfNoListings(ownerId, remaining)
    return { demoted, remaining }
  }, [])

  const addCategory = useCallback(async (payload) => {
    const saved = await fbCreateCategory(payload)
    return saved
  }, [])

  const removeCategory = useCallback(async (id) => {
    await fbDeleteCategory(id)
  }, [])

  const getProduct = useCallback(
    (id) => productMap[id] || null,
    [productMap]
  )

  const value = useMemo(
    () => ({
      loading,
      marketplaceProducts,
      products,
      productMap,
      getProduct,
      adminProducts,
      customCategories,
      categories,
      productsByCategory,
      addProduct,
      updateProduct,
      removeProduct,
      addCategory,
      removeCategory,
    }),
    [
      loading,
      marketplaceProducts,
      products,
      productMap,
      getProduct,
      adminProducts,
      customCategories,
      categories,
      productsByCategory,
      addProduct,
      updateProduct,
      removeProduct,
      addCategory,
      removeCategory,
    ]
  )

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const ctx = useContext(ProductsContext)
  if (!ctx) {
    throw new Error('useProducts must be used inside a ProductsProvider')
  }
  return ctx
}
