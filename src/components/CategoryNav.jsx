import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MenuIcon } from './Icons'
import CategoryIcon from './CategoryIcon'
import SubcategoryList from './SubcategoryList'
import {
  categories,
  getSubcategoryCounts,
  topPills,
  popularSearches,
} from '../data/categories'
import { useNavigation } from '../context/NavigationContext'
import { useSearch } from '../context/SearchContext'

function formatDate() {
  const d = new Date()
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`
}

export default function CategoryNav() {
  const {
    categoryId: routeCategoryId,
    subcategorySlug: routeSubSlug,
    goCategory,
    goSubcategory,
  } = useNavigation()
  const { submit, submittedQuery, allProductsByCategory } = useSearch()
  const activeQuery = submittedQuery.trim().toLowerCase()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeCat, setActiveCat] = useState(
    routeCategoryId || categories[0]?.id || null
  )
  const wrapRef = useRef(null)

  const topSearches = popularSearches.slice(0, 3)

  useEffect(() => {
    if (routeCategoryId) setActiveCat(routeCategoryId)
  }, [routeCategoryId])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onClick = (e) => {
      if (!wrapRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [menuOpen])

  const countFor = (id, fallback) => {
    const live = allProductsByCategory[id]?.length
    return (live ?? fallback).toLocaleString('en-IN')
  }

  const pickCategory = (cat) => {
    setActiveCat(cat.id)
    goCategory(cat.id)
    setMenuOpen(false)
  }

  const pickSub = (catId, sub) => {
    goSubcategory(catId, sub.slug)
    setMenuOpen(false)
  }

  return (
    <div className="cat-nav-wrap">
      <div className="cat-nav">
        <div className="cat-nav-all-wrap" ref={wrapRef}>
          <button
            className={`cat-nav-all ${menuOpen ? 'is-open' : ''}`}
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="true"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon size={18} />
            ALL CATEGORIES
            <ChevronDown size={16} />
          </button>

          {menuOpen && (
            <div className="cat-nav-dropdown" role="menu">
              <div className="cat-nav-dropdown-head">All Categories</div>
              <ul className="cat-tree cat-nav-dropdown-tree">
                {categories.map((c) => {
                  const isActive = activeCat === c.id
                  const subCounts = getSubcategoryCounts(
                    c,
                    allProductsByCategory[c.id] || []
                  )
                  return (
                    <li
                      key={c.id}
                      className={`cat-tree-row lvl-1 ${isActive ? 'active' : ''}`}
                      onMouseEnter={() => setActiveCat(c.id)}
                    >
                      <button type="button" onClick={() => pickCategory(c)}>
                        <span className="cat-tree-name">
                          <span
                            className="cat-tree-icon"
                            aria-hidden
                            style={{ color: c.iconColor }}
                          >
                            <CategoryIcon
                              name={c.iconName}
                              size={18}
                              strokeWidth={2}
                            />
                          </span>
                          {c.name}
                        </span>
                        <span className="cat-tree-count">
                          ({countFor(c.id, c.count)})
                        </span>
                      </button>
                      {isActive && subCounts.length > 0 && (
                        <SubcategoryList
                          items={subCounts}
                          activeSlug={
                            routeCategoryId === c.id ? routeSubSlug : null
                          }
                          onPick={(sub) => pickSub(c.id, sub)}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <nav className="cat-pills">
          {topPills.map((p) => {
            const isActive =
              routeCategoryId === p.id ||
              activeQuery === p.label.toLowerCase()
            return (
              <button
                key={p.id}
                type="button"
                className={`cat-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => goCategory(p.id)}
              >
                {p.label}
              </button>
            )
          })}
        </nav>

        <span className="cat-nav-date">{formatDate()}</span>
      </div>

      <div className="popular-row">
        <span className="popular-label">Popular Searches:</span>
        <div className="popular-list">
          {topSearches.map((term, i) => (
            <span key={term} className="popular-item">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  submit(term)
                }}
              >
                {term}
              </a>
              {i < topSearches.length - 1 && (
                <span className="popular-sep">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
