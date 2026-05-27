/** Strip to E.164-style digits for `tel:` links (defaults India +91). */
export function digitsForTel(phone) {
  if (!phone) return null
  let digits = String(phone).replace(/\D/g, '')
  if (digits.length === 10) digits = `91${digits}`
  if (digits.length < 11) return null
  return `+${digits}`
}

/** Real phone on the listing or seller profile (not masked). */
export function getProductPhone(product, seller) {
  const raw = product?.phone || seller?.phone || ''
  const digits = String(raw).replace(/\D/g, '')
  if (digits.length >= 10) return raw.trim()
  return null
}

/** Label shown in UI (real number or masked fallback). */
export function getPhoneDisplay(product, seller) {
  return getProductPhone(product, seller) || seller?.phoneMasked || ''
}
