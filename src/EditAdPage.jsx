import { useMemo, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigation } from './context/NavigationContext'
import { useUserAds } from './context/UserAdsContext'
import AdListingForm from './components/AdListingForm'
import { conditionLabelToId } from './components/adFormUtils'
import { ArrowLeftIcon, CheckIcon } from './components/Icons'

function maskPhone(phone) {
  if (!phone) return '+91 9xxxxxxxxx'
  return phone.replace(/\d(?=\d{4})/g, 'x')
}

export default function EditAdPage({ productId }) {
  const { user } = useAuth()
  const { goMyAds, goLogin } = useNavigation()
  const { getAd, updateAd } = useUserAds()
  const [saved, setSaved] = useState(false)

  const ad = useMemo(() => (productId ? getAd(productId) : null), [getAd, productId])

  const isOwner = ad && user && ad.sellerId === user.id

  const initial = useMemo(() => {
    if (!ad) return null
    const imgs =
      Array.isArray(ad.images) && ad.images.length > 0
        ? ad.images
        : ad.image
        ? [ad.image]
        : []
    return {
      categoryId: ad.category || '',
      subcategoryId: ad.subcategory || '',
      title: ad.title || '',
      description: ad.description || '',
      price: ad.price ?? '',
      brand: ad.brand || '',
      conditionId: conditionLabelToId(ad.condition),
      images: imgs,
      location: ad.location || user?.location || '',
      phone: ad.phone || user?.phone || '',
    }
  }, [ad, user?.location, user?.phone])

  if (!user) {
    return (
      <div className="lx-page sell-page">
        <div className="lx-page-head">
          <button type="button" className="details-back" onClick={goLogin}>
            <ArrowLeftIcon size={16} /> Login
          </button>
          <h1 className="lx-page-h1">Edit ad</h1>
        </div>
        <p className="lx-page-sub">Sign in to edit your listings.</p>
      </div>
    )
  }

  if (!productId || !ad) {
    return (
      <div className="lx-page sell-page">
        <div className="lx-page-head">
          <button type="button" className="details-back" onClick={goMyAds}>
            <ArrowLeftIcon size={16} /> Back to My ADS
          </button>
          <h1 className="lx-page-h1">Edit ad</h1>
        </div>
        <div className="myads-empty">
          <h2>Listing not found</h2>
          <p>This ad may have been removed or the link is invalid.</p>
          <button type="button" className="auth-submit" onClick={goMyAds}>
            Go to My ADS
          </button>
        </div>
      </div>
    )
  }

  if (!isOwner) {
    return (
      <div className="lx-page sell-page">
        <div className="lx-page-head">
          <button type="button" className="details-back" onClick={goMyAds}>
            <ArrowLeftIcon size={16} /> Back to My ADS
          </button>
          <h1 className="lx-page-h1">Edit ad</h1>
        </div>
        <div className="myads-empty">
          <h2>You can only edit your own ads</h2>
          <p>This listing belongs to another seller.</p>
          <button type="button" className="auth-submit" onClick={goMyAds}>
            Go to My ADS
          </button>
        </div>
      </div>
    )
  }

  if (saved) {
    return (
      <div className="lx-page sell-page">
        <div className="sell-success">
          <div className="sell-success-icon" aria-hidden>
            <CheckIcon size={36} />
          </div>
          <h2>Changes saved</h2>
          <p>Your listing has been updated. Taking you to My ADS…</p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (data) => {
    const phone = data.phone
    const seller = {
      ...(ad.seller || {}),
      id: user.id,
      name: user.fullName || ad.seller?.name,
      phoneMasked: maskPhone(phone),
    }
    if (phone) seller.phone = phone

    await updateAd(ad.id, {
      title: data.title,
      description: data.description,
      price: data.price,
      brand: data.brand,
      condition: data.condition,
      images: data.images,
      image: data.images[0],
      location: data.location,
      phone,
      category: data.category,
      subcategory: data.subcategory,
      seller,
    })
    setSaved(true)
    setTimeout(() => goMyAds(), 900)
  }

  return (
    <div className="lx-page sell-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={goMyAds}>
          <ArrowLeftIcon size={16} /> Back to My ADS
        </button>
        <h1 className="lx-page-h1">Edit your ad</h1>
        <p className="lx-page-sub">
          Update photos, price, and details — changes go live instantly.
        </p>
      </div>

      <AdListingForm
        key={ad.id}
        initial={initial}
        submitLabel="Save changes"
        submittingLabel="Saving…"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
