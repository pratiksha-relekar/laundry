import { useEffect, useState } from 'react'
import { categories } from '../data/categories'
import { ChevronDown, ChevronUp } from './Icons'
import CategoryIcon from './CategoryIcon'
import { useSearch } from '../context/SearchContext'

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="filter-section">
      <button
        className="filter-head"
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="filter-body">{children}</div>}
    </section>
  )
}

function CategoryTree({ active, onPick }) {
  return (
    <ul className="cat-tree">
      <li className={`cat-tree-row lvl-0 ${active === 'all' ? 'active' : ''}`}>
        <button type="button" onClick={() => onPick('all')}>
          <span>All Categories</span>
        </button>
      </li>
      {categories.map((c) => {
        const isActive = active === c.id
        return (
          <li
            key={c.id}
            className={`cat-tree-row lvl-1 ${isActive ? 'active' : ''}`}
          >
            <button type="button" onClick={() => onPick(c.id)}>
              <span className="cat-tree-name">
                <span
                  className="cat-tree-icon"
                  aria-hidden
                  style={{ color: c.iconColor }}
                >
                  <CategoryIcon name={c.iconName} size={18} strokeWidth={2} />
                </span>
                {c.name}
              </span>
              <span className="cat-tree-count">
                ({c.count.toLocaleString('en-IN')})
              </span>
            </button>
            {isActive && c.subcategories?.length > 0 && (
              <ul className="cat-tree-subs">
                {c.subcategories.map((s) => (
                  <li key={s}>
                    <a href="#">{s}</a>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ul>
  )
}

const PRESETS = [
  { id: 'p1', label: 'Under ₹5k', min: null, max: 5000 },
  { id: 'p2', label: '₹5k – ₹15k', min: 5000, max: 15000 },
  { id: 'p3', label: '₹15k – ₹30k', min: 15000, max: 30000 },
  { id: 'p4', label: '₹30k – ₹1L', min: 30000, max: 100000 },
  { id: 'p5', label: 'Above ₹1L', min: 100000, max: null },
]

function matchesPreset(preset, min, max) {
  return preset.min === min && preset.max === max
}

function BudgetFilter() {
  const { minPrice, maxPrice, applyBudget, clearBudget } = useSearch()
  const [min, setMin] = useState('')
  const [max, setMax] = useState('')

  // Keep local inputs in sync if budget is changed externally (e.g. preset).
  useEffect(() => {
    setMin(minPrice == null ? '' : String(minPrice))
    setMax(maxPrice == null ? '' : String(maxPrice))
  }, [minPrice, maxPrice])

  const onApply = () => {
    const minN = min === '' ? null : Math.max(0, parseInt(min, 10) || 0)
    const maxN = max === '' ? null : Math.max(0, parseInt(max, 10) || 0)
    if (minN != null && maxN != null && minN > maxN) {
      applyBudget(maxN, minN)
    } else {
      applyBudget(minN, maxN)
    }
  }

  const onPreset = (p) => applyBudget(p.min, p.max)

  const isActive = minPrice != null || maxPrice != null

  return (
    <div className="budget-box">
      <div className="budget-inputs">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Min"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApply()
          }}
        />
        <span className="budget-sep">to</span>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          placeholder="Max"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApply()
          }}
        />
      </div>
      <div className="budget-actions">
        <button type="button" className="budget-go" onClick={onApply}>
          Apply
        </button>
        {isActive && (
          <button
            type="button"
            className="budget-clear"
            onClick={() => {
              setMin('')
              setMax('')
              clearBudget()
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div className="budget-presets">
        {PRESETS.map((p) => {
          const active = matchesPreset(p, minPrice, maxPrice)
          return (
            <button
              key={p.id}
              type="button"
              className={active ? 'is-active' : ''}
              onClick={() => onPreset(p)}
            >
              {p.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const [active, setActive] = useState(categories[0].id)
  return (
    <aside className="lx-sidebar">
      <Section title="CATEGORIES" defaultOpen={true}>
        <CategoryTree active={active} onPick={setActive} />
      </Section>
      <Section title="FILTERS" defaultOpen={true}>
        <ul className="check-list">
          <li>
            <label>
              <input type="checkbox" /> Verified seller
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" /> With images
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" /> Under warranty
            </label>
          </li>
          <li>
            <label>
              <input type="checkbox" /> Free delivery
            </label>
          </li>
        </ul>
      </Section>
      <Section title="BUDGET" defaultOpen={true}>
        <BudgetFilter />
      </Section>
    </aside>
  )
}
