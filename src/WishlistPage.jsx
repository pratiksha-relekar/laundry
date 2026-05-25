import { useWishlist } from './context/WishlistContext'
import { useNavigation } from './context/NavigationContext'
import ProductCard from './components/ProductCard'
import { ArrowLeftIcon, HeartIcon, TrashIcon } from './components/Icons'

export default function WishlistPage() {
  const { items, count, clear } = useWishlist()
  const { goHome } = useNavigation()

  return (
    <div className="lx-page wishlist-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={goHome}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>

        <div className="lx-page-title-row">
          <div>
            <h1 className="lx-page-h1">
              <HeartIcon size={20} filled /> My wishlist
            </h1>
            <p className="lx-page-sub">
              {count === 0
                ? 'Save your favourite listings to revisit later.'
                : `${count} saved listing${count === 1 ? '' : 's'}`}
            </p>
          </div>
          {count > 0 && (
            <button type="button" className="lx-page-clear" onClick={clear}>
              <TrashIcon size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="wishlist-empty">
          <div className="wishlist-empty-icon" aria-hidden>
            <HeartIcon size={36} />
          </div>
          <h2>No saved items yet</h2>
          <p>
            Tap the heart on any listing to save it here. Your wishlist is
            stored on this device so you can come back any time.
          </p>
          <button
            type="button"
            className="auth-submit wishlist-empty-cta"
            onClick={goHome}
          >
            Browse listings
          </button>
        </div>
      ) : (
        <div className="lx-page-grid">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
