import { useMemo } from 'react'
import {
  categoryMap,
  filterProductsBySubcategory,
  findSubcategoryName,
  getSubcategoryCounts,
} from '../data/categories'
import { useNavigation } from '../context/NavigationContext'
import { useSearch } from '../context/SearchContext'
import { budgetFilterLabel, filterProductsList } from '../utils/productFilters'
import ProductCard from './ProductCard'
import CategoryIcon from './CategoryIcon'
import SubcategoryList from './SubcategoryList'
import { CloseIcon } from './Icons'

export default function CategoryBrowsePage() {
  const {
    categoryId,
    subcategorySlug,
    goHome,
    goCategory,
    goSubcategory,
  } = useNavigation()
  const {
    allProductsByCategory,
    submittedQuery,
    minPrice,
    maxPrice,
    isFiltering,
    clearSearch,
    clearBudget,
    clearAllFilters,
  } = useSearch()

  const category = categoryMap[categoryId]
  const subName = findSubcategoryName(categoryId, subcategorySlug)

  const products = useMemo(
    () => allProductsByCategory[categoryId] || [],
    [allProductsByCategory, categoryId]
  )

  const categoryFiltered = useMemo(
    () =>
      filterProductsList(products, {
        query: submittedQuery,
        minPrice,
        maxPrice,
      }),
    [products, submittedQuery, minPrice, maxPrice]
  )

  const subCounts = useMemo(
    () => (category ? getSubcategoryCounts(category, categoryFiltered) : []),
    [category, categoryFiltered]
  )

  const visibleProducts = useMemo(
    () =>
      subName
        ? filterProductsBySubcategory(categoryFiltered, subName)
        : categoryFiltered,
    [categoryFiltered, subName]
  )

  const hasText = submittedQuery.trim().length > 0
  const hasBudget = minPrice != null || maxPrice != null

  if (!category) {
    return (
      <div className="cat-browse-empty">
        <p>That category is not available.</p>
        <button type="button" className="auth-submit" onClick={goHome}>
          Home
        </button>
      </div>
    )
  }

  return (
    <div className="cat-browse">
      <nav className="lx-breadcrumb cat-browse-crumb" aria-label="Breadcrumb">
        <button type="button" className="bc-link" onClick={goHome}>
          Home
        </button>
        <span className="bc-sep">/</span>
        {subName ? (
          <>
            <button
              type="button"
              className="bc-link"
              onClick={() => goCategory(categoryId)}
            >
              {category.name}
            </button>
            <span className="bc-sep">/</span>
            <span className="bc-current">{subName}</span>
          </>
        ) : (
          <span className="bc-current">{category.name}</span>
        )}
      </nav>

      <header className="cat-browse-head">
        <div className="cat-browse-title-wrap">
          <h1 className="cat-browse-title">
            <span
              className="cat-section-icon"
              aria-hidden
              style={{
                color: category.iconColor,
                background: `${category.iconColor}1a`,
              }}
            >
              <CategoryIcon
                name={category.iconName}
                size={22}
                strokeWidth={2}
              />
            </span>
            {subName || category.name}
          </h1>
          {category.tagline && !subName && (
            <p className="cat-browse-tag">{category.tagline}</p>
          )}
          <p className="cat-browse-meta">
            {visibleProducts.length.toLocaleString('en-IN')} listing
            {visibleProducts.length === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      {isFiltering && (
        <div className="active-filters cat-browse-filters">
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
              <strong>{budgetFilterLabel(minPrice, maxPrice)}</strong>
              <button
                type="button"
                aria-label="Remove budget filter"
                onClick={clearBudget}
              >
                <CloseIcon size={12} />
              </button>
            </span>
          )}
          {hasText && hasBudget && (
            <button
              type="button"
              className="search-results-clear"
              onClick={clearAllFilters}
            >
              <CloseIcon size={14} /> Clear all
            </button>
          )}
        </div>
      )}

      {!subName && subCounts.length > 0 && (
        <div className="cat-browse-subs">
          <h2 className="cat-browse-subs-title">Browse by type</h2>
          <SubcategoryList
            items={subCounts}
            activeSlug={subcategorySlug}
            className="cat-browse-subs-list"
            itemClassName="cat-browse-sub-btn"
            onPick={(sub) => goSubcategory(categoryId, sub.slug)}
          />
        </div>
      )}

      {visibleProducts.length === 0 ? (
        <div className="cat-browse-empty">
          <p>
            {isFiltering
              ? 'No listings match your filters in this category.'
              : 'No listings in this section yet.'}
          </p>
          {isFiltering && hasBudget && (
            <p>Try widening the budget range or clearing it to see more listings.</p>
          )}
          {subName && !isFiltering && (
            <button
              type="button"
              className="auth-submit"
              onClick={() => goCategory(categoryId)}
            >
              View all in {category.name}
            </button>
          )}
          {isFiltering && (
            <button
              type="button"
              className="auth-submit"
              onClick={hasText && hasBudget ? clearAllFilters : hasBudget ? clearBudget : clearSearch}
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="cat-browse-grid">
          {visibleProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
