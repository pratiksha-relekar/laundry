import {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react'
import { useAuth } from './AuthContext'
import { useProducts } from './ProductsContext'

// =====================================================================
// UserAdsContext
// ---------------------------------------------------------------------
// Thin wrapper around ProductsContext that exposes only the listings
// belonging to the signed-in seller. Writes go through the global
// products collection so every visitor sees the new ad immediately.
//
// Each ad lives in the top-level Firestore `products` collection with
// a `sellerId` matching the user's UID. On logout we simply expose an
// empty list — the Firestore docs persist and reload when the same
// user signs back in.
// =====================================================================

const UserAdsContext = createContext(null)

function makeAdId() {
  return String(1800000000 + Math.floor(Math.random() * 99999999))
}

export function UserAdsProvider({ children }) {
  const { user } = useAuth()
  const uid = user?.id || null
  const { marketplaceProducts, addProduct, updateProduct, removeProduct } =
    useProducts()

  // Filter the global stream down to the current user's listings.
  const ads = useMemo(() => {
    if (!uid) return []
    return marketplaceProducts.filter((p) => p.sellerId === uid)
  }, [marketplaceProducts, uid])

  const postAd = useCallback(
    async (data) => {
      if (!uid) throw new Error('You must be logged in to post an ad.')
      const ad = {
        adId: makeAdId(),
        ...data,
        sellerId: uid,
        source: 'user',
        image: data.images?.[0] || data.image,
        images: data.images?.length
          ? data.images
          : data.image
          ? [data.image]
          : [],
        date: 'TODAY',
        featured: false,
        verified: false,
        status: 'active',
        views: 0,
        chats: 0,
        favs: 0,
        isUserAd: true,
        seller: data.seller || {
          id: uid,
          name: user?.fullName || 'Seller',
        },
      }
      return await addProduct(ad, uid)
    },
    [uid, user?.fullName, addProduct]
  )

  const updateAd = useCallback(
    async (id, updates) => {
      if (!uid) return
      try {
        await updateProduct(id, updates)
      } catch (err) {
        console.warn('[userAds] update failed:', err?.message)
      }
    },
    [uid, updateProduct]
  )

  const removeAd = useCallback(
    async (id) => {
      if (!uid) return
      try {
        await removeProduct(id, uid)
      } catch (err) {
        console.warn('[userAds] delete failed:', err?.message)
      }
    },
    [uid, removeProduct]
  )

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
