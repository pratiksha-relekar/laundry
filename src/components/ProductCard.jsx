import { HeartIcon, VerifiedIcon, CameraIcon } from './Icons'
import { useAuth } from '../context/AuthContext'
import { useNavigation } from '../context/NavigationContext'
import { useWishlist } from '../context/WishlistContext'

function formatPrice(n) {
  return `₹ ${n.toLocaleString('en-IN')}`
}

export default function ProductCard({ product }) {
  const { openProduct, goLogin } = useNavigation()
  const { user } = useAuth()
  const { isInWishlist, toggle } = useWishlist()
  const liked = isInWishlist(product.id)
  const photoCount = product.images?.length ?? 6

  const handleOpen = () => openProduct(product.id)
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleOpen()
    }
  }

  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
    >
      <div className="card-image">
        <img
          src={product.image}
          alt={product.title}
          loading="lazy"
          className="card-photo"
        />

        <button
          className={`like-btn ${liked ? 'liked' : ''}`}
          type="button"
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          onClick={(e) => {
            e.stopPropagation()
            if (!user) {
              goLogin()
              return
            }
            toggle(product.id)
          }}
        >
          <HeartIcon size={18} filled={liked} />
        </button>

        <span className="photo-count" aria-hidden>
          <CameraIcon size={12} /> {photoCount}
        </span>

        <div className="card-tags-row">
          {product.verified && (
            <span className="tag tag-verified">
              <VerifiedIcon size={12} /> Verified User
            </span>
          )}
          {product.featured && <span className="tag tag-featured">FEATURED</span>}
        </div>
      </div>

      <div className="card-body">
        <div className="card-price">{formatPrice(product.price)}</div>
        <h3 className="card-title">{product.title}</h3>
        <div className="card-meta">
          <span className="card-loc">{product.location}</span>
          <span className="card-date">{product.date}</span>
        </div>
      </div>
    </article>
  )
}
