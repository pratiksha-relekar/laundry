import { useMemo, useState } from 'react'
import { categories } from './data/categories'
import { useAuth } from './context/AuthContext'
import { useNavigation } from './context/NavigationContext'
import { useUserAds } from './context/UserAdsContext'
import CategoryIcon from './components/CategoryIcon'
import {
  ArrowLeftIcon,
  CheckIcon,
  CloseIcon,
  PackageIcon,
  ShieldIcon,
  UploadIcon,
  UserIcon,
} from './components/Icons'

const CONDITIONS = [
  { id: 'like-new', label: 'Like New', desc: 'Used a few times, no wear.' },
  { id: 'good', label: 'Good', desc: 'Minor signs of use.' },
  { id: 'fair', label: 'Fair', desc: 'Visible wear but fully functional.' },
  { id: 'parts', label: 'For Parts', desc: 'Not working, sold for parts.' },
]

const MAX_TITLE = 70
const MAX_DESC = 4096
const MAX_PHOTOS = 5

// Resize on a canvas before storing — keeps localStorage tiny.
function resizeImage(file, maxDim = 1024, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        const scale = Math.min(1, maxDim / Math.max(width, height))
        width = Math.round(width * scale)
        height = Math.round(height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        try {
          resolve(canvas.toDataURL('image/jpeg', quality))
        } catch (err) {
          reject(err)
        }
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function BecomeSellerPrompt({ user, onUpgrade, onBack, upgrading, error }) {
  return (
    <div className="lx-page sell-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={onBack}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>
        <h1 className="lx-page-h1">Become a seller</h1>
      </div>

      <div className="seller-onboarding">
        <div className="seller-onboarding-icon" aria-hidden>
          <PackageIcon size={36} />
        </div>
        <h2>Unlock seller privileges</h2>
        <p>
          Your account <strong>{user?.email}</strong> is currently a
          <em> user</em>. Upgrade to a <strong>seller</strong> account to
          list products on the Laundry marketplace. You can continue to
          buy and chat just like before.
        </p>
        <ul className="seller-onboarding-list">
          <li>
            <CheckIcon size={14} /> List unlimited used laundry equipment
          </li>
          <li>
            <CheckIcon size={14} /> Manage your ads &amp; chats in one place
          </li>
          <li>
            <CheckIcon size={14} /> Free forever — no listing fees
          </li>
        </ul>

        {error && (
          <div className="auth-error auth-form-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="auth-submit seller-onboarding-cta"
          onClick={onUpgrade}
          disabled={upgrading}
        >
          {upgrading ? 'Upgrading…' : 'Upgrade to seller account'}
        </button>
        <p className="seller-onboarding-note">
          <ShieldIcon size={12} /> Admin can promote or demote roles at any
          time from the admin Users page.
        </p>
      </div>
    </div>
  )
}

function SellLoginPrompt({ onLogin, onBack }) {
  return (
    <div className="lx-page sell-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={onBack}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>
        <h1 className="lx-page-h1">Sell on Laundry</h1>
      </div>

      <div className="seller-onboarding">
        <div className="seller-onboarding-icon" aria-hidden>
          <UserIcon size={36} />
        </div>
        <h2>Become a seller in 60 seconds</h2>
        <p>
          Login or create your free Laundry account to post listings, chat with
          buyers and manage your ads from one place.
        </p>
        <ul className="seller-onboarding-list">
          <li><CheckIcon size={14} /> Reach thousands of buyers across India</li>
          <li><CheckIcon size={14} /> No listing fees, no commission</li>
          <li><CheckIcon size={14} /> Verified user badge for trusted sellers</li>
        </ul>
        <button type="button" className="auth-submit seller-onboarding-cta" onClick={onLogin}>
          Login to continue
        </button>
      </div>
    </div>
  )
}

export default function SellPage() {
  const { user, isSeller, becomeSeller } = useAuth()
  const { goHome, goLogin, goMyAds } = useNavigation()
  const { postAd } = useUserAds()
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')

  const handleUpgrade = async () => {
    setUpgradeError('')
    setUpgrading(true)
    const result = await becomeSeller()
    setUpgrading(false)
    if (!result.ok) {
      setUpgradeError(result.error || 'Could not upgrade your account.')
    }
  }

  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [brand, setBrand] = useState('')
  const [condition, setCondition] = useState('good')
  const [images, setImages] = useState([])
  const [location, setLocation] = useState(user?.location || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [posted, setPosted] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categoryId]
  )

  if (!user) {
    return <SellLoginPrompt onLogin={goLogin} onBack={goHome} />
  }

  if (!isSeller) {
    return (
      <BecomeSellerPrompt
        user={user}
        onUpgrade={handleUpgrade}
        onBack={goHome}
        upgrading={upgrading}
        error={upgradeError}
      />
    )
  }

  const handleFiles = async (fileList) => {
    setUploadError('')
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'))
    const slots = MAX_PHOTOS - images.length
    if (slots <= 0) return
    const next = files.slice(0, slots)
    try {
      const dataUrls = await Promise.all(next.map((f) => resizeImage(f)))
      setImages((prev) => [...prev, ...dataUrls])
    } catch {
      setUploadError("Couldn't process one of the images. Try a different file.")
    }
  }

  const removeImage = (i) =>
    setImages((prev) => prev.filter((_, idx) => idx !== i))

  const validate = () => {
    const next = {}
    if (!categoryId) next.category = 'Pick the closest category for your item.'
    if (!title.trim()) next.title = 'Add a clear title for your ad.'
    if (title.trim().length > MAX_TITLE)
      next.title = `Title can't exceed ${MAX_TITLE} characters.`
    if (description.trim().length < 20)
      next.description = 'Description should be at least 20 characters.'
    const priceNum = Number(price)
    if (!price || Number.isNaN(priceNum) || priceNum <= 0)
      next.price = 'Enter a valid price (in ₹).'
    if (images.length === 0)
      next.images = 'Add at least one clear photo of the product.'
    if (!location.trim())
      next.location = 'Add a city or area so buyers can find you.'
    return next
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    const v = validate()
    setErrors(v)
    if (Object.keys(v).length > 0) {
      setSubmitting(false)
      const firstField = Object.keys(v)[0]
      const el = document.querySelector(`[data-field="${firstField}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    try {
      await postAd({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        brand: brand.trim(),
        condition: CONDITIONS.find((c) => c.id === condition)?.label,
        images,
        location: location.trim(),
        phone: phone.trim(),
        category: categoryId,
        subcategory: subcategoryId,
        seller: {
          id: user.id,
          name: user.fullName,
          memberSince: 'Today',
          itemsListed: 1,
          phoneMasked: phone
            ? phone.replace(/\d(?=\d{4})/g, 'x')
            : '+91 9xxxxxxxxx',
        },
      })
      setPosted(true)
      setTimeout(() => goMyAds(), 900)
    } catch (err) {
      setErrors({
        form: err?.message || 'Could not publish your ad. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (posted) {
    return (
      <div className="lx-page sell-page">
        <div className="sell-success">
          <div className="sell-success-icon" aria-hidden>
            <CheckIcon size={36} />
          </div>
          <h2>Your ad is live!</h2>
          <p>Buyers can now find it on Laundry. Taking you to My ADS…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lx-page sell-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={goHome}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>
        <h1 className="lx-page-h1">Post your ad</h1>
        <p className="lx-page-sub">
          Fill out the details below — we'll publish it instantly.
        </p>
      </div>

      <form className="sell-form" onSubmit={handleSubmit} noValidate>
        {/* ----- 1. Category ----- */}
        <fieldset className="sell-card" data-field="category">
          <legend>
            <span className="sell-step">1</span> Choose a category
          </legend>
          <div className="sell-category-grid">
            {categories.map((c) => {
              const active = categoryId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`sell-cat-card ${active ? 'active' : ''}`}
                  onClick={() => {
                    setCategoryId(c.id)
                    setSubcategoryId('')
                    setErrors((e) => ({ ...e, category: undefined }))
                  }}
                  style={
                    active
                      ? {
                          borderColor: c.iconColor,
                          background: `${c.iconColor}10`,
                        }
                      : undefined
                  }
                >
                  <span
                    className="sell-cat-icon"
                    style={{ color: c.iconColor, background: `${c.iconColor}1a` }}
                  >
                    <CategoryIcon name={c.iconName} size={22} strokeWidth={2} />
                  </span>
                  <span className="sell-cat-name">{c.name}</span>
                </button>
              )
            })}
          </div>
          {errors.category && <small className="auth-error">{errors.category}</small>}

          {activeCategory && activeCategory.subcategories?.length > 0 && (
            <div className="sell-subcategory">
              <label className="auth-field">
                <span className="auth-label">Sub-category (optional)</span>
                <select
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                >
                  <option value="">— Select if applicable —</option>
                  {activeCategory.subcategories.map((s) => (
                    <option key={s.id || s} value={s.id || s}>
                      {s.name || s}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
        </fieldset>

        {/* ----- 2. Details ----- */}
        <fieldset className="sell-card">
          <legend>
            <span className="sell-step">2</span> Add details
          </legend>

          <label className={`auth-field ${errors.title ? 'has-error' : ''}`} data-field="title">
            <span className="auth-label">
              Ad title
              <small className="sell-char-count">
                {title.length}/{MAX_TITLE}
              </small>
            </span>
            <input
              type="text"
              maxLength={MAX_TITLE}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. LG 8kg Front Load Washing Machine"
            />
            {errors.title && <small className="auth-error">{errors.title}</small>}
          </label>

          <label className={`auth-field ${errors.description ? 'has-error' : ''}`} data-field="description">
            <span className="auth-label">
              Description
              <small className="sell-char-count">
                {description.length}/{MAX_DESC}
              </small>
            </span>
            <textarea
              rows={5}
              maxLength={MAX_DESC}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mention condition, age, reason for selling, anything included…"
            />
            {errors.description && (
              <small className="auth-error">{errors.description}</small>
            )}
          </label>

          <label className="auth-field">
            <span className="auth-label">Brand (optional)</span>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. LG, Bosch, IFB"
            />
          </label>

          <div className="auth-field">
            <span className="auth-label">Condition</span>
            <div className="sell-conditions">
              {CONDITIONS.map((c) => {
                const active = condition === c.id
                return (
                  <button
                    type="button"
                    key={c.id}
                    className={`sell-condition ${active ? 'active' : ''}`}
                    onClick={() => setCondition(c.id)}
                  >
                    <strong>{c.label}</strong>
                    <small>{c.desc}</small>
                  </button>
                )
              })}
            </div>
          </div>
        </fieldset>

        {/* ----- 3. Price ----- */}
        <fieldset className="sell-card" data-field="price">
          <legend>
            <span className="sell-step">3</span> Set a price
          </legend>
          <label className={`auth-field ${errors.price ? 'has-error' : ''}`}>
            <span className="auth-label">Price in ₹</span>
            <div className="sell-price-input">
              <span className="sell-price-currency">₹</span>
              <input
                type="number"
                inputMode="numeric"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
              />
            </div>
            {errors.price && <small className="auth-error">{errors.price}</small>}
          </label>
        </fieldset>

        {/* ----- 4. Photos ----- */}
        <fieldset className="sell-card" data-field="images">
          <legend>
            <span className="sell-step">4</span> Upload photos
            <span className="sell-step-meta">First photo is the cover. Up to {MAX_PHOTOS}.</span>
          </legend>

          <div className="sell-photos-grid">
            {images.map((src, i) => (
              <div key={i} className={`sell-photo ${i === 0 ? 'is-cover' : ''}`}>
                <img src={src} alt={`Upload ${i + 1}`} />
                {i === 0 && <span className="sell-photo-cover-tag">Cover</span>}
                <button
                  type="button"
                  className="sell-photo-remove"
                  aria-label="Remove photo"
                  onClick={() => removeImage(i)}
                >
                  <CloseIcon size={12} />
                </button>
              </div>
            ))}

            {images.length < MAX_PHOTOS && (
              <label className="sell-photo-add">
                <UploadIcon size={22} />
                <span>Add photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    handleFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
          {uploadError && <small className="auth-error">{uploadError}</small>}
          {errors.images && <small className="auth-error">{errors.images}</small>}
        </fieldset>

        {/* ----- 5. Location + Contact ----- */}
        <fieldset className="sell-card" data-field="location">
          <legend>
            <span className="sell-step">5</span> Confirm your location
          </legend>
          <label className={`auth-field ${errors.location ? 'has-error' : ''}`}>
            <span className="auth-label">City / Area</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Whitefield, Bengaluru"
            />
            {errors.location && (
              <small className="auth-error">{errors.location}</small>
            )}
          </label>

          <label className="auth-field">
            <span className="auth-label">Phone number (shown only to interested buyers)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98xxxxxx00"
              autoComplete="tel"
            />
          </label>
        </fieldset>

        <div className="sell-submit-row">
          <button
            type="submit"
            className="auth-submit sell-submit"
            disabled={submitting}
          >
            {submitting ? 'Publishing…' : 'Post my ad'}
          </button>
        </div>
      </form>
    </div>
  )
}
