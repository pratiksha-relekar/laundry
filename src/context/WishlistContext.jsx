import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { useProducts } from './ProductsContext'
import {
  addToWishlist,
  clearWishlist as clearWishlistInFirestore,
  removeFromWishlist,
  subscribeToUserDoc,
} from '../auth/users'

// =====================================================================
// WishlistContext
// ---------------------------------------------------------------------
// Persists the set of product ids the user has "hearted" in Firestore
// on `users/{uid}.wishlist`. The in-memory list is cleared on logout so
// the next account never sees the previous user's saved items.
// =====================================================================

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const { productMap } = useProducts()
  const uid = user?.id || null
  const [ids, setIds] = useState([])
  const [clearing, setClearing] = useState(false)
  // When logged out, never show the previous account's wishlist in memory.
  const activeIds = uid ? ids : []

  useEffect(() => {
    if (!uid) return undefined
    const unsubscribe = subscribeToUserDoc(
      uid,
      (profile) => {
        setIds(Array.isArray(profile?.wishlist) ? profile.wishlist : [])
      },
      () => setIds([])
    )
    return unsubscribe
  }, [uid])

  const toggle = useCallback(
    async (productId) => {
      if (!uid || !productId) return false
      const inList = activeIds.includes(productId)
      setIds((prev) =>
        inList
          ? prev.filter((x) => x !== productId)
          : [productId, ...prev]
      )
      try {
        if (inList) await removeFromWishlist(uid, productId)
        else await addToWishlist(uid, productId)
      } catch (err) {
        console.warn('[wishlist] toggle failed:', err?.message)
        // Revert on failure.
        setIds((prev) =>
          inList
            ? [...prev, productId]
            : prev.filter((x) => x !== productId)
        )
      }
      return true
    },
    [uid, activeIds]
  )

  const remove = useCallback(
    async (productId) => {
      if (!uid || !productId) return false
      const had = activeIds.includes(productId)
      if (!had) return true
      setIds((prev) => prev.filter((x) => x !== productId))
      try {
        await removeFromWishlist(uid, productId)
        return true
      } catch (err) {
        console.warn('[wishlist] remove failed:', err?.message)
        setIds((prev) => [...prev, productId])
        return false
      }
    },
    [uid, activeIds]
  )

  const clear = useCallback(async () => {
    if (!uid || activeIds.length === 0) return { ok: true }
    const snapshot = [...activeIds]
    setClearing(true)
    setIds([])
    try {
      await clearWishlistInFirestore(uid)
      return { ok: true }
    } catch (err) {
      console.warn('[wishlist] clear failed:', err?.message)
      setIds(snapshot)
      return { ok: false, error: err?.message || 'Could not clear wishlist.' }
    } finally {
      setClearing(false)
    }
  }, [uid, activeIds])

  const isInWishlist = useCallback(
    (productId) => activeIds.includes(productId),
    [activeIds]
  )

  const items = useMemo(
    () => activeIds.map((id) => productMap[id]).filter(Boolean),
    [activeIds, productMap]
  )

  const value = useMemo(
    () => ({
      ids: activeIds,
      items,
      count: activeIds.length,
      toggle,
      remove,
      clear,
      clearing,
      isInWishlist,
    }),
    [activeIds, items, toggle, remove, clear, clearing, isInWishlist]
  )

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error('useWishlist must be used inside a WishlistProvider')
  }
  return ctx
}
