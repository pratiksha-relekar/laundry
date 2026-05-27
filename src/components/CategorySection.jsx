import ProductCard from './ProductCard'
import CategoryIcon from './CategoryIcon'
import { useNavigation } from '../context/NavigationContext'

export default function CategorySection({ category, products }) {
  const { goCategory } = useNavigation()
  if (!products || products.length === 0) return null
  const previewProducts = products.slice(0, 4)

  return (
    <section className="cat-section" id={`cat-${category.id}`}>
      <header className="cat-section-head">
        <div className="cat-section-title-wrap">
          <h2 className="cat-section-title">
            <span
              className="cat-section-icon"
              aria-hidden
              style={{
                color: category.iconColor,
                background: `${category.iconColor}1a`,
              }}
            >
              <CategoryIcon name={category.iconName} size={20} strokeWidth={2} />
            </span>
            {category.name}
            <span className="cat-section-count">
              {category.count.toLocaleString('en-IN')}+
            </span>
          </h2>
          {category.tagline && (
            <p className="cat-section-tag">{category.tagline}</p>
          )}
        </div>
        <button
          type="button"
          className="cat-section-seeall"
          onClick={() => goCategory(category.id)}
        >
          See all
        </button>
      </header>

      <div className="cat-section-grid">
        {previewProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
