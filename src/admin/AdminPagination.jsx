import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from '../components/Icons'

// =====================================================================
// AdminPagination
// ---------------------------------------------------------------------
// Shared windowed pager used by both AdminProductsPage and
// AdminUsersPage. Builds a sliding range like `1 … 4 5 6 … 12` so even
// very long lists keep the control compact.
// =====================================================================

export default function AdminPagination({
  page,
  totalPages,
  totalCount,
  pageSize,
  onPage,
}) {
  const pages = useMemo(() => {
    const out = []
    const add = (p) => {
      if (!out.includes(p) && p >= 1 && p <= totalPages) out.push(p)
    }
    add(1)
    for (let p = page - 1; p <= page + 1; p++) add(p)
    add(totalPages)
    out.sort((a, b) => a - b)
    const withGaps = []
    for (let i = 0; i < out.length; i++) {
      if (i > 0 && out[i] - out[i - 1] > 1) withGaps.push('…')
      withGaps.push(out[i])
    }
    return withGaps
  }, [page, totalPages])

  if (totalCount === 0) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalCount)

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        Showing <strong>{start}</strong>–<strong>{end}</strong> of{' '}
        <strong>{totalCount.toLocaleString('en-IN')}</strong>
      </span>

      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-page-btn"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="admin-page-gap">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              className={`admin-page-btn ${p === page ? 'is-active' : ''}`}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="admin-page-btn"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
