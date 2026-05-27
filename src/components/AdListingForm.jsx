import { useMemo, useState } from 'react'
import { categories } from '../data/categories'
import CategoryIcon from './CategoryIcon'
import { CloseIcon, UploadIcon } from './Icons'
import {
  CONDITIONS,
  MAX_DESC,
  MAX_PHOTOS,
  MAX_TITLE,
  conditionIdToLabel,
  resizeImage,
} from './adFormUtils'

function exampleTitleForCategory(categoryId) {
  switch (categoryId) {
    case 'washing-machines':
      return 'e.g. LG 8kg Front Load Washing Machine'
    case 'dry-cleaning':
      return 'e.g. 15kg Perc Dry-Cleaning Machine (Union)'
    case 'dryers':
      return 'e.g. Industrial Tumble Dryer 25kg (Gas)'
    case 'ironing':
      return 'e.g. Steam Press Machine with Vacuum Table'
    case 'steam-boilers':
      return 'e.g. 24kW Steam Generator / Boiler (3 phase)'
    case 'folding-packaging':
      return 'e.g. Automatic Laundry Folding Machine'
    case 'spares':
      return 'e.g. Washing Machine Drain Pump (Compatible)'
    case 'other':
      return 'e.g. Commercial Laundry Equipment'
    default:
      return 'e.g. Commercial laundry equipment'
  }
}

/**
 * Shared post / edit listing form — same cards and fields as Sell page.
 */
export default function AdListingForm({
  initial,
  submitLabel = 'Post my ad',
  submittingLabel = 'Publishing…',
  onSubmit,
  formError,
}) {
  const [categoryId, setCategoryId] = useState(initial?.categoryId || '')
  const [subcategoryId, setSubcategoryId] = useState(initial?.subcategoryId || '')
  const [title, setTitle] = useState(initial?.title || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [price, setPrice] = useState(
    initial?.price != null && initial?.price !== '' ? String(initial.price) : ''
  )
  const [brand, setBrand] = useState(initial?.brand || '')
  const [condition, setCondition] = useState(initial?.conditionId || 'good')
  const [images, setImages] = useState(
    Array.isArray(initial?.images) ? [...initial.images] : []
  )
  const [location, setLocation] = useState(initial?.location || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categoryId]
  )
  const titlePlaceholder = useMemo(
    () => exampleTitleForCategory(categoryId),
    [categoryId]
  )

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
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        brand: brand.trim(),
        condition: conditionIdToLabel(condition),
        images,
        location: location.trim(),
        phone: phone.trim(),
        category: categoryId,
        subcategory: subcategoryId,
      })
    } catch (err) {
      setErrors({
        form: err?.message || 'Could not save your ad. Please try again.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const displayFormError = formError || errors.form

  return (
    <form className="sell-form" onSubmit={handleSubmit} noValidate>
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
            placeholder={titlePlaceholder}
          />
          {errors.title && <small className="auth-error">{errors.title}</small>}
        </label>

        <label
          className={`auth-field ${errors.description ? 'has-error' : ''}`}
          data-field="description"
        >
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

      <fieldset className="sell-card" data-field="images">
        <legend>
          <span className="sell-step">4</span> Upload photos
          <span className="sell-step-meta">
            First photo is the cover. Up to {MAX_PHOTOS}.
          </span>
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
          <span className="auth-label">
            Phone number (shown only to interested buyers)
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98xxxxxx00"
            autoComplete="tel"
          />
        </label>
      </fieldset>

      {displayFormError && (
        <div className="auth-error auth-form-error" role="alert">
          {displayFormError}
        </div>
      )}

      <div className="sell-submit-row">
        <button
          type="submit"
          className="auth-submit sell-submit"
          disabled={submitting}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  )
}
