import { categoryMap } from '../data/categories'

const STOPWORDS = new Set([
  'a', 'an', 'and', 'at', 'by', 'for', 'from', 'in', 'is', 'of',
  'on', 'or', 'the', 'to', 'with',
])

export function productPrice(product) {
  const n = Number(product?.price)
  return Number.isFinite(n) ? n : null
}

function haystackFor(product) {
  const catName = categoryMap[product.category]?.name || ''
  return [
    product.title,
    product.brand,
    product.location,
    product.category,
    catName,
    product.seller?.name,
    product.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function matchesText(product, q) {
  if (!q) return true
  const tokens = q
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t))
  if (tokens.length === 0) return true
  const hay = haystackFor(product)
  return tokens.every((t) => hay.includes(t))
}

export function matchesBudget(product, minPrice, maxPrice) {
  const price = productPrice(product)
  if (price == null) return minPrice == null && maxPrice == null
  if (minPrice != null && price < minPrice) return false
  if (maxPrice != null && price > maxPrice) return false
  return true
}

/** Apply search text and/or budget bounds to a product list. */
export function filterProductsList(
  products,
  { query = '', minPrice = null, maxPrice = null } = {}
) {
  const q = (query || '').trim()
  const hasBudget = minPrice != null || maxPrice != null
  if (!q && !hasBudget) return products
  return products.filter(
    (p) => matchesText(p, q) && matchesBudget(p, minPrice, maxPrice)
  )
}

export function formatFilterPrice(n) {
  if (n == null) return ''
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
  return `₹${n}`
}

export function budgetFilterLabel(minPrice, maxPrice) {
  if (minPrice != null && maxPrice != null)
    return `${formatFilterPrice(minPrice)} – ${formatFilterPrice(maxPrice)}`
  if (minPrice != null) return `Above ${formatFilterPrice(minPrice)}`
  if (maxPrice != null) return `Under ${formatFilterPrice(maxPrice)}`
  return ''
}
