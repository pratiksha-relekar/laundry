import { useState } from 'react'
import { categoryMap } from './data/categories'
import { useNavigation } from './context/NavigationContext'
import { useProducts } from './context/ProductsContext'
import {
  ArrowLeftIcon,
  FlagIcon,
  HeartIcon,
  ShareIcon,
} from './components/Icons'
import ImageCarousel from './components/ImageCarousel'
import SellerCard from './components/SellerCard'
import LocationMap from './components/LocationMap'
import CategoryIcon from './components/CategoryIcon'

function formatPrice(n) {
  return `₹ ${n.toLocaleString('en-IN')}`
}

export default function ProductDetailsPage({ productId }) {
  const { goHome } = useNavigation()
  const { getProduct } = useProducts()
  const product = getProduct(productId)
  const [liked, setLiked] = useState(false)

  if (!product) {
    return (
      <div className="details-not-found">
        <p>That listing isn't available.</p>
        <button type="button" onClick={goHome} className="details-back">
          Back to listings
        </button>
      </div>
    )
  }

  const category = categoryMap[product.category]

  return (
    <div className="details-page">
      {/* Breadcrumb / back row */}
      <div className="lx-breadcrumb-wrap">
        <button type="button" className="details-back" onClick={goHome}>
          <ArrowLeftIcon size={16} /> Back to listings
        </button>
        <div className="lx-breadcrumb details-breadcrumb">
          <a href="#" onClick={(e) => { e.preventDefault(); goHome() }}>Home</a>
          <span className="bc-sep">/</span>
          {category && (
            <>
              <a href="#" onClick={(e) => e.preventDefault()}>{category.name}</a>
              <span className="bc-sep">/</span>
            </>
          )}
          <span>{product.title}</span>
        </div>
      </div>

      <main className="details-main">
        {/* ----- LEFT column ----- */}
        <div className="details-left">
          <div className="details-card details-gallery-card">
            <ImageCarousel images={product.images} alt={product.title} />
          </div>

          <div className="details-card details-description">
            <h2>Description</h2>
            <p>
              {product.description.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>

          <div className="details-card details-overview">
            <h2>Details</h2>
            <ul className="details-overview-list">
              {category && (
                <li>
                  <span className="overview-key">Category</span>
                  <span
                    className="overview-val"
                    style={{ color: category.iconColor }}
                  >
                    <CategoryIcon
                      name={category.iconName}
                      size={16}
                      strokeWidth={2}
                    />
                    {category.name}
                  </span>
                </li>
              )}
              <li>
                <span className="overview-key">Condition</span>
                <span className="overview-val">{product.condition}</span>
              </li>
              <li>
                <span className="overview-key">Location</span>
                <span className="overview-val">{product.location}</span>
              </li>
              <li>
                <span className="overview-key">Listed</span>
                <span className="overview-val">{product.date}</span>
              </li>
              {product.verified && (
                <li>
                  <span className="overview-key">Seller status</span>
                  <span className="overview-val overview-verified">
                    Verified seller
                  </span>
                </li>
              )}
            </ul>
          </div>

          <div className="details-footer">
            <span>
              AD ID <strong>{product.adId}</strong>
            </span>
            <button type="button" className="details-report">
              <FlagIcon size={14} /> REPORT THIS AD
            </button>
          </div>
        </div>

        {/* ----- RIGHT column ----- */}
        <aside className="details-right">
          <section className="details-card details-summary">
            <div className="details-price-row">
              <div className="details-price">{formatPrice(product.price)}</div>
              <div className="details-summary-actions">
                <button type="button" aria-label="Share">
                  <ShareIcon size={18} />
                </button>
                <button
                  type="button"
                  aria-label={liked ? 'Remove from wishlist' : 'Save'}
                  className={liked ? 'is-liked' : ''}
                  onClick={() => setLiked((v) => !v)}
                >
                  <HeartIcon size={18} filled={liked} />
                </button>
              </div>
            </div>
            <h1 className="details-title">{product.title}</h1>
            <div className="details-meta-row">
              <span className="details-location">{product.location}</span>
              <span className="details-date">{product.date}</span>
            </div>
          </section>

          <SellerCard seller={product.seller} productId={product.id} />

          <LocationMap location={product.location} />
        </aside>
      </main>
    </div>
  )
}
