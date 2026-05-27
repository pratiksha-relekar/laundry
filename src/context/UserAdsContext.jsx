import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import { countSellerProducts } from '../auth/products'
import { demoteToBuyerIfNoListings, userIsAdmin, userIsSeller } from '../auth/users'
import { useAuth } from './AuthContext'
import { useProducts } from './ProductsContext'

// =====================================================================
// UserAdsContext
// ---------------------------------------------------------------------
// Thin wrapper around ProductsContext that exposes only the listings
// belonging to the signed-in seller. Writes go through the global
// products collection so every visitor sees the new ad immediately.
//
// When a seller deletes their last listing, role is demoted to buyer
// (`user`) automatically — see demoteToBuyerIfNoListings.
// =====================================================================

const UserAdsContext = createContext(null)

function makeAdId() {
  return String(1800000000 + Math.floor(Math.random() * 99999999))
}

export function UserAdsProvider({ children }) {
  const { user, refreshUserProfile, applyBuyerRoleLocally } = useAuth()
  const uid = user?.id || null
  const { marketplaceProducts, addProduct, updateProduct, removeProduct } =
    useProducts()

  const ads = useMemo(() => {
    if (!uid) return []
    return marketplaceProducts.filter((p) => p.sellerId === uid)
  }, [marketplaceProducts, uid])

  const syncSellerRoleFromListings = useCallback(async () => {
    if (!uid || !user) return
    if (userIsAdmin(user)) return
    if (!userIsSeller(user)) return

    const remaining = await countSellerProducts(uid)
    if (remaining > 0) return

    const demoted = await demoteToBuyerIfNoListings(uid, remaining)
    if (demoted) {
      applyBuyerRoleLocally()
      refreshUserProfile().catch(() => {})
    }
  }, [uid, user, applyBuyerRoleLocally, refreshUserProfile])

  const demoteChecked = useRef(false)

  useEffect(() => {
    if (!uid || !user || userIsAdmin(user) || !userIsSeller(user)) {
      demoteChecked.current = false
      return
    }
    if (ads.length > 0) {
      demoteChecked.current = false
      return
    }
    if (demoteChecked.current) return
    demoteChecked.current = true
    syncSellerRoleFromListings()
  }, [ads.length, uid, user, syncSellerRoleFromListings])

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
        phone: data.phone || '',
        seller: {
          ...(data.seller || {
            id: uid,
            name: user?.fullName || 'Seller',
          }),
          phone: data.phone || '',
          phoneMasked:
            data.seller?.phoneMasked ||
            (data.phone ? data.phone.replace(/\d(?=\d{4})/g, 'x') : ''),
        },
      }
      return await addProduct(ad, uid)
    },
    [uid, user?.fullName, addProduct]
  )

  const updateAd = useCallback(
    async (id, updates) => {
      if (!uid) throw new Error('You must be logged in to update an ad.')
      const owned = marketplaceProducts.find(
        (p) => p.id === id && p.sellerId === uid
      )
      if (!owned) throw new Error('You can only edit your own listings.')

      const patch = { ...updates }
      if (Array.isArray(patch.images)) {
        patch.image = patch.images[0] || patch.image || ''
      }
      await updateProduct(id, patch)
    },
    [uid, marketplaceProducts, updateProduct]
  )

  const removeAd = useCallback(
    async (id) => {
      if (!uid) return
      try {
        const { demoted } = await removeProduct(id, uid)
        if (demoted) {
          applyBuyerRoleLocally()
          refreshUserProfile().catch(() => {})
        } else {
          await syncSellerRoleFromListings()
        }
      } catch (err) {
        console.warn('[userAds] delete failed:', err?.message)
      }
    },
    [
      uid,
      removeProduct,
      applyBuyerRoleLocally,
      refreshUserProfile,
      syncSellerRoleFromListings,
    ]
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
