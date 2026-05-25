import { useSearch } from '../context/SearchContext'
import { categories, popularSearches, categoryMap } from '../data/categories'
import {
  ClockIcon,
  CloseIcon,
  SearchIcon,
  TrendingIcon,
} from './Icons'
import CategoryIcon from './CategoryIcon'

// Show at most this many product suggestions while the user is typing.
const MAX_SUGGESTIONS = 6

function highlight(text, query) {
  if (!query) return text
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark>{text.slice(i, i + query.length)}</mark>
      {text.slice(i + query.length)}
    </>
  )
}

export default function SearchDropdown({ onPick }) {
  const { query, recent, removeRecent, clearRecent, allProducts } = useSearch()
  const q = query.trim()
  const lower = q.toLowerCase()

  // -----------------------------------------------------------------
  // 1) User is typing — surface matching products + matching categories
  // -----------------------------------------------------------------
  if (lower.length > 0) {
    const tokens = lower.split(/\s+/).filter(Boolean)
    const matches = allProducts
      .filter((p) => {
        const hay = [
          p.title,
          p.brand,
          p.location,
          p.seller?.name,
          categoryMap[p.category]?.name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return tokens.every((t) => hay.includes(t))
      })
      .slice(0, MAX_SUGGESTIONS)

    const catMatches = categories.filter((c) =>
      c.name.toLowerCase().includes(lower)
    )

    if (matches.length === 0 && catMatches.length === 0) {
      return (
        <div className="search-dropdown" role="listbox">
          <div className="dropdown-empty">
            <SearchIcon size={16} />
            <span>
              No matches for <strong>"{q}"</strong>. Press Enter to search
              anyway.
            </span>
          </div>
        </div>
      )
    }

    return (
      <div className="search-dropdown" role="listbox">
        {catMatches.length > 0 && (
          <>
            <header className="dropdown-section-head">
              <span>Categories</span>
            </header>
            <ul className="dropdown-list">
              {catMatches.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => onPick(c.name)}>
                    <span
                      className="dropdown-thumb dropdown-thumb-icon"
                      style={{
                        color: c.iconColor,
                        background: `${c.iconColor}1a`,
                      }}
                    >
                      <CategoryIcon name={c.iconName} size={22} />
                    </span>
                    <span className="dropdown-row-text">
                      <span className="dropdown-row-title">
                        {highlight(c.name, q)}
                      </span>
                      <span className="dropdown-row-meta">
                        {c.count.toLocaleString('en-IN')} listings
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {matches.length > 0 && (
          <>
            <header className="dropdown-section-head">
              <span>Products</span>
            </header>
            <ul className="dropdown-list">
              {matches.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => onPick(p.title)}>
                    <img className="dropdown-thumb" src={p.image} alt="" />
                    <span className="dropdown-row-text">
                      <span className="dropdown-row-title">
                        {highlight(p.title, q)}
                      </span>
                      <span className="dropdown-row-meta">
                        ₹ {p.price.toLocaleString('en-IN')} · {p.location}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    )
  }

  // -----------------------------------------------------------------
  // 2) Input is empty — show recents + popular + categories shortcut
  // -----------------------------------------------------------------
  return (
    <div className="search-dropdown" role="listbox">
      {recent.length > 0 && (
        <>
          <header className="dropdown-section-head">
            <span>
              <ClockIcon size={14} /> Recent Searches
            </span>
            <button
              type="button"
              className="dropdown-clear"
              onClick={clearRecent}
            >
              Clear all
            </button>
          </header>
          <ul className="dropdown-chips">
            {recent.map((r) => (
              <li key={r} className="dropdown-chip">
                <button
                  type="button"
                  className="dropdown-chip-main"
                  onClick={() => onPick(r)}
                >
                  <ClockIcon size={12} />
                  <span>{r}</span>
                </button>
                <button
                  type="button"
                  className="dropdown-chip-remove"
                  aria-label={`Remove ${r}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeRecent(r)
                  }}
                >
                  <CloseIcon size={12} />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <header className="dropdown-section-head">
        <span>
          <TrendingIcon size={14} /> Popular Searches
        </span>
      </header>
      <ul className="dropdown-chips">
        {popularSearches.map((p) => (
          <li key={p} className="dropdown-chip">
            <button
              type="button"
              className="dropdown-chip-main"
              onClick={() => onPick(p)}
            >
              <SearchIcon size={12} />
              <span>{p}</span>
            </button>
          </li>
        ))}
      </ul>

      <header className="dropdown-section-head">
        <span>Browse by Category</span>
      </header>
      <ul className="dropdown-list">
        {categories.slice(0, 6).map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => onPick(c.name)}>
              <span
                className="dropdown-thumb dropdown-thumb-icon"
                style={{
                  color: c.iconColor,
                  background: `${c.iconColor}1a`,
                }}
              >
                <CategoryIcon name={c.iconName} size={22} />
              </span>
              <span className="dropdown-row-text">
                <span className="dropdown-row-title">{c.name}</span>
                <span className="dropdown-row-meta">
                  {c.count.toLocaleString('en-IN')} listings
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
