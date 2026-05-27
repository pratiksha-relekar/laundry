/**
 * Numbered subcategory list — shared by sidebar, category dropdown,
 * and category browse pages.
 */
export default function SubcategoryList({
  items,
  activeSlug,
  onPick,
  className = 'cat-tree-subs',
  itemClassName = '',
}) {
  if (!items?.length) return null
  return (
    <ol className={className}>
      {items.map((sub, index) => (
        <li key={sub.slug}>
          <button
            type="button"
            className={`${itemClassName} ${
              activeSlug === sub.slug ? 'is-active' : ''
            }`.trim()}
            onClick={() => onPick(sub)}
          >
            <span className="cat-sub-label">
              <span className="cat-sub-num">{index + 1}.</span>
              {sub.name}
            </span>
            <span className="cat-tree-count">
              ({sub.count.toLocaleString('en-IN')})
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
