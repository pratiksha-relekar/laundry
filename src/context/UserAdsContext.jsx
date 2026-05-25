import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

// =====================================================================
// UserAdsContext
// ---------------------------------------------------------------------
// Holds the listings the current device has posted via the Sell page.
// Each ad mirrors the shape used by the catalog products (image, title,
// price, location, date) plus a couple of seller-side fields (status,
// views, chats, favs) so the My Ads page can render it without any
// special-casing.
//
// Storage is keyed per-user once we know the user id so multiple users
// on the same device don't see each other's drafts.
// =====================================================================

const UserAdsContext = createContext(null)

const STORAGE_PREFIX = 'laundry:userAds:'

function readStored(userId) {
  if (!userId) return []
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + userId)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStored(userId, ads) {
  if (!userId) return
  try {
    localStorage.setItem(STORAGE_PREFIX + userId, JSON.stringify(ads))
  } catch {
    /* ignore */
  }
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return 'ad_' + crypto.randomUUID().slice(0, 8)
  }
  return 'ad_' + Math.random().toString(36).slice(2, 10)
}

function makeAdId() {
  // OLX-style numeric ad id.
  return String(1800000000 + Math.floor(Math.random() * 99999999))
}

export function UserAdsProvider({ userId, children }) {
  const [ads, setAds] = useState(() => readStored(userId))

  // Re-hydrate whenever the active user changes (login / logout).
  useEffect(() => {
    setAds(readStored(userId))
  }, [userId])

  useEffect(() => {
    if (userId) writeStored(userId, ads)
  }, [ads, userId])

  const postAd = useCallback(
    (data) => {
      const ad = {
        id: newId(),
        adId: makeAdId(),
        ...data,
        image: data.images?.[0] || data.image,
        images: data.images?.length ? data.images : data.image ? [data.image] : [],
        date: 'TODAY',
        featured: false,
        verified: false,
        status: 'active',
        views: 0,
        chats: 0,
        favs: 0,
        createdAt: Date.now(),
        isUserAd: true,
      }
      setAds((prev) => [ad, ...prev])
      return ad
    },
    []
  )

  const updateAd = useCallback((id, updates) => {
    setAds((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)))
  }, [])

  const removeAd = useCallback((id) => {
    setAds((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const getAd = useCallback(
    (id) => ads.find((a) => a.id === id) || null,
    [ads]
  )

  const value = useMemo(
    () => ({
      ads,
      count: ads.length,
      postAd,
      updateAd,
      removeAd,
      getAd,
    }),
    [ads, postAd, updateAd, removeAd, getAd]
  )

  return (
    <UserAdsContext.Provider value={value}>{children}</UserAdsContext.Provider>
  )
}

export function useUserAds() {
  const ctx = useContext(UserAdsContext)
  if (!ctx) {
    throw new Error('useUserAds must be used inside a UserAdsProvider')
  }
  return ctx
}
