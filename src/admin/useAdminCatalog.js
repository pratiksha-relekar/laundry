import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProducts } from '../context/ProductsContext'

// =====================================================================
// useAdminCatalog
// ---------------------------------------------------------------------
// Wrapper that exposes the live Firestore-backed product + category
// collections to the admin pages. The static seeds in
// `src/data/products.js` and `src/data/categories.js` stay read-only —
// admin-added items live in Firestore alongside user-posted listings
// so every visitor sees them.
// =====================================================================

export function useAdminCatalog() {
  const { user } = useAuth()
  const {
    marketplaceProducts,
    adminProducts,
    customCategories,
    addProduct: addGlobalProduct,
    removeProduct: removeGlobalProduct,
    updateProduct: updateGlobalProduct,
    addCategory: addGlobalCategory,
    removeCategory: removeGlobalCategory,
  } = useProducts()

  const addProduct = useCallback(
    async (data) => {
      const payload = {
        ...data,
        price: Number(data.price) || 0,
        images: Array.isArray(data.images) ? data.images : data.image ? [data.image] : [],
        source: 'admin',
        status: data.status || 'active',
        addedBy: user?.id || 'admin',
        seller: data.seller || {
          id: 'admin',
          name: user?.fullName || 'Laundry team',
          verified: true,
        },
      }
      return await addGlobalProduct(payload)
    },
    [user?.id, user?.fullName, addGlobalProduct]
  )

  const removeProduct = useCallback(
    async (id) => {
      const target = adminProducts.find((p) => p.id === id)
      await removeGlobalProduct(id, target?.sellerId)
    },
    [adminProducts, removeGlobalProduct]
  )

  const updateProduct = useCallback(
    async (id, patch) => {
      await updateGlobalProduct(id, patch)
    },
    [updateGlobalProduct]
  )

  const addCategory = useCallback(
    async (data) => {
      const payload = { ...data, addedBy: user?.id || 'admin' }
      return await addGlobalCategory(payload)
    },
    [user?.id, addGlobalCategory]
  )

  const removeCategory = useCallback(
    async (id) => {
      await removeGlobalCategory(id)
    },
    [removeGlobalCategory]
  )

  // Pull only the "user" listings for the admin Analytics + Dashboard
  // tallies so they stay aware of grass-roots inventory.
  const userPostedAds = marketplaceProducts.filter((p) => p.source === 'user')

  return {
    adminProducts,
    adminCategories: customCategories,
    userPostedAds,
    addProduct,
    removeProduct,
    updateProduct,
    addCategory,
    removeCategory,
  }
}
