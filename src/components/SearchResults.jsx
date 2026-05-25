import { useSearch } from '../context/SearchContext'
import { popularSearches } from '../data/categories'
import ProductCard from './ProductCard'
import { CloseIcon, SearchIcon } from './Icons'

function formatPrice(n) {
  if (n == null) return ''
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `₹${n}`
}

function budgetLabel(minPrice, maxPrice) {
  if (minPrice != null && maxPrice != null)
    return `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}`
  if (minPrice != null) return `Above ${formatPrice(minPrice)}`
  if (maxPrice != null) return `Under ${formatPrice(maxPrice)}`
  return ''
}

export default function SearchResults() {
  const {
    submittedQuery,
    minPrice,
    maxPrice,
    filteredProducts,
    clearSearch,
    clearBudget,
    clearAllFilters,
    submit,
  } = useSearch()

  const hasText = submittedQuery.trim().length > 0
  const hasBudget = minPrice != null || maxPrice != null

  return (
    <section className="search-results">
      <div className="search-results-head">
        <div className="search-results-title">
          <SearchIcon size={18} />
          <h2>
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1 ? 'result' : 'results'}
            {hasText && (
              <>
                {' for '}
                <strong>"{submittedQuery}"</strong>
              </>
            )}
          </h2>
        </div>
        <div className="search-results-actions">
          {hasText && hasBudget ? (
            <button
              type="button"
              className="search-results-clear"
              onClick={clearAllFilters}
            >
              <CloseIcon size={14} /> Clear all
            </button>
          ) : (
            <button
              type="button"
              className="search-results-clear"
              onClick={hasText ? clearSearch : clearBudget}
            >
              <CloseIcon size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="active-filters">
        {hasText && (
          <span className="active-filter">
            <span className="active-filter-label">Search:</span>
            <strong>{submittedQuery}</strong>
            <button
              type="button"
              aria-label="Remove search filter"
              onClick={clearSearch}
            >
              <CloseIcon size={12} />
            </button>
          </span>
        )}
        {hasBudget && (
          <span className="active-filter">
            <span className="active-filter-label">Budget:</span>
            <strong>{budgetLabel(minPrice, maxPrice)}</strong>
            <button
              type="button"
              aria-label="Remove budget filter"
              onClick={clearBudget}
            >
              <CloseIcon size={12} />
            </button>
          </span>
        )}
      </div>

      {filteredProducts.length > 0 ? (
        <div className="search-results-grid">
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="search-empty">
          <div className="search-empty-icon" aria-hidden>
            <SearchIcon size={36} />
          </div>
          <h3>
            No products match your filters
            {hasText && (
              <>
                {' for '}
                <strong>"{submittedQuery}"</strong>
              </>
            )}
            {hasBudget && (
              <>
                {' in '}
                <strong>{budgetLabel(minPrice, maxPrice)}</strong>
              </>
            )}
          </h3>
          {hasBudget && (
            <p>
              Try widening the budget range or clearing it to see more
              listings.
            </p>
          )}
          {!hasBudget && (
            <>
              <p>Try one of these popular searches:</p>
              <div className="search-empty-suggestions">
                {popularSearches.slice(0, 6).map((s) => (
                  <button key={s} type="button" onClick={() => submit(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  )
}
