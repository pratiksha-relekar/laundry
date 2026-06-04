import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { filterProductsList } from '../utils/productFilters'
import { useProducts } from './ProductsContext'

// =====================================================================
// SearchContext (also handles the budget filter)
// ---------------------------------------------------------------------
//   query           — live input value as the user types
//   submittedQuery  — value last committed (Enter / button / pick)
//   recent          — recently-submitted queries (persisted)
//   submit          — commit a query and append to `recent`
//   clearSearch     — wipe both query and submittedQuery
//   removeRecent    — drop one item from `recent`
//   clearRecent     — empty the recents list entirely
//
//   minPrice        — applied lower bound (null = no bound)
//   maxPrice        — applied upper bound (null = no bound)
//   applyBudget     — set { min, max } (each may be null)
//   clearBudget     — reset both to null
//
//   isFiltering     — true when any filter (text or budget) is active
//   allProducts     — catalog products + the current user's posted ads
//   allProductsByCategory — same, grouped by category id
//   filteredProducts — derived list with all active filters applied
// =====================================================================

const SearchContext = createContext(null)
const STORAGE_KEY = 'laundry.recentSearches'
const MAX_RECENT = 8

function readStored() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : []
  } catch {
    return []
  }
}

export function SearchProvider({ children }) {
  const { products: globalProducts } = useProducts()

  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [recent, setRecent] = useState(readStored)
  const [minPrice, setMinPrice] = useState(null)
  const [maxPrice, setMaxPrice] = useState(null)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recent))
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [recent])

  const submit = useCallback(
    (rawValue) => {
      const value = (rawValue ?? query).trim()
      setQuery(value)
      setSubmittedQuery(value)
      if (!value) return
      setRecent((prev) => {
        const lower = value.toLowerCase()
        const without = prev.filter((x) => x.toLowerCase() !== lower)
        return [value, ...without].slice(0, MAX_RECENT)
      })
    },
    [query]
  )

  const clearSearch = useCallback(() => {
    setQuery('')
    setSubmittedQuery('')
  }, [])

  const removeRecent = useCallback((value) => {
    setRecent((prev) => prev.filter((x) => x !== value))
  }, [])

  const clearRecent = useCallback(() => setRecent([]), [])

  const applyBudget = useCallback((min, max) => {
    setMinPrice(min == null || Number.isNaN(min) ? null : min)
    setMaxPrice(max == null || Number.isNaN(max) ? null : max)
  }, [])

  const clearBudget = useCallback(() => {
    setMinPrice(null)
    setMaxPrice(null)
  }, [])

  const clearAllFilters = useCallback(() => {
    setQuery('')
    setSubmittedQuery('')
    setMinPrice(null)
    setMaxPrice(null)
  }, [])

  const isFiltering =
    submittedQuery.trim() !== '' || minPrice != null || maxPrice != null

  // The global products list already merges live Firestore listings
  // (user + admin) on top of the static catalog seed, so the home grid
  // and search both see every newly posted ad immediately.
  const allProducts = globalProducts

  const allProductsByCategory = useMemo(() => {
    const map = {}
    for (const p of allProducts) {
      if (!p.category) continue
      if (!map[p.category]) map[p.category] = []
      map[p.category].push(p)
    }
    return map
  }, [allProducts])

  const filteredProducts = useMemo(() => {
    if (!isFiltering) return allProducts
    return filterProductsList(allProducts, {
      query: submittedQuery,
      minPrice,
      maxPrice,
    })
  }, [submittedQuery, minPrice, maxPrice, isFiltering, allProducts])

  const value = useMemo(
    () => ({
      query,
      setQuery,
      submittedQuery,
      submit,
      clearSearch,
      recent,
      removeRecent,
      clearRecent,
      minPrice,
      maxPrice,
      applyBudget,
      clearBudget,
      clearAllFilters,
      isFiltering,
      allProducts,
      allProductsByCategory,
      filteredProducts,
    }),
    [
      query,
      submittedQuery,
      submit,
      clearSearch,
      recent,
      removeRecent,
      clearRecent,
      minPrice,
      maxPrice,
      applyBudget,
      clearBudget,
      clearAllFilters,
      isFiltering,
      allProducts,
      allProductsByCategory,
      filteredProducts,
    ]
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) {
    throw new Error('useSearch must be used inside a SearchProvider')
  }
  return ctx
}
