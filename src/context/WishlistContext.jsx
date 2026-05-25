import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { productMap } from '../data/products'

// =====================================================================
// WishlistContext
// ---------------------------------------------------------------------
// Persists the set of product ids the user has "hearted" in localStorage.
// Components subscribe via useWishlist() and either flip the heart icon
// (`toggle`) or render the saved list (`items` / `count`).
// =====================================================================

const WishlistContext = createContext(null)
const STORAGE_KEY = 'laundry:wishlist'

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(readStored)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      /* storage disabled — ignore */
    }
  }, [ids])

  const toggle = useCallback((productId) => {
    setIds((prev) =>
      prev.includes(productId)
        ? prev.filter((x) => x !== productId)
        : [productId, ...prev]
    )
  }, [])

  const remove = useCallback((productId) => {
    setIds((prev) => prev.filter((x) => x !== productId))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  const isInWishlist = useCallback((productId) => ids.includes(productId), [ids])

  // Resolve ids to products in insertion order, skipping stale ids.
  const items = useMemo(
    () => ids.map((id) => productMap[id]).filter(Boolean),
    [ids]
  )

  const value = useMemo(
    () => ({
      ids,
      items,
      count: ids.length,
      toggle,
      remove,
      clear,
      isInWishlist,
    }),
    [ids, items, toggle, remove, clear, isInWishlist]
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
