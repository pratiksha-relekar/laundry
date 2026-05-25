import { ChevronDown, MenuIcon } from './Icons'
import { topPills, popularSearches } from '../data/categories'
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
  const { submit, submittedQuery } = useSearch()
  const activeQuery = submittedQuery.trim().toLowerCase()

  return (
    <div className="cat-nav-wrap">
      <div className="cat-nav">
        <button className="cat-nav-all" type="button">
          <MenuIcon size={18} />
          ALL CATEGORIES
          <ChevronDown size={16} />
        </button>

        <nav className="cat-pills">
          {topPills.map((p) => {
            const isActive = activeQuery === p.label.toLowerCase()
            return (
              <button
                key={p.id}
                type="button"
                className={`cat-pill ${isActive ? 'is-active' : ''}`}
                onClick={() => submit(p.label)}
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
          {popularSearches.map((term, i) => (
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
              {i < popularSearches.length - 1 && (
                <span className="popular-sep">·</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
