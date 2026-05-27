/** Shareable URL for a product details page (hash router). */
export function getProductShareUrl(productId) {
  const id = encodeURIComponent(String(productId))
  if (typeof window === 'undefined') return `#details/${id}`
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#details/${id}`
}

function buildShareText({ title, price }) {
  const priceLine =
    typeof price === 'number' && !Number.isNaN(price)
      ? ` — ₹ ${price.toLocaleString('en-IN')}`
      : ''
  return `${title || 'Listing'}${priceLine} on NexDeal`
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }
  const el = document.createElement('textarea')
  el.value = text
  el.setAttribute('readonly', '')
  el.style.position = 'fixed'
  el.style.left = '-9999px'
  document.body.appendChild(el)
  el.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(el)
  return ok
}

/**
 * Native share sheet when available; otherwise copy link to clipboard.
 * @returns {{ ok: boolean, method?: 'share'|'clipboard', cancelled?: boolean }}
 */
export async function shareProduct(product) {
  const url = getProductShareUrl(product.id)
  const title = product.title || 'NexDeal listing'
  const text = buildShareText(product)

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title, text, url })
      return { ok: true, method: 'share' }
    } catch (err) {
      if (err?.name === 'AbortError') return { ok: false, cancelled: true }
    }
  }

  try {
    const copied = await copyText(url)
    return copied ? { ok: true, method: 'clipboard' } : { ok: false }
  } catch {
    return { ok: false }
  }
}
