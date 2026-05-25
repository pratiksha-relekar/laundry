import { useCallback, useEffect, useMemo, useState } from 'react'
import { products as CATALOG_PRODUCTS } from '../data/products'

// =====================================================================
// useAdminReviews
// ---------------------------------------------------------------------
// Tiny mock review system for the admin panel. There is no real
// reviews backend in this prototype, so on first read we generate a
// deterministic batch of "seed" reviews tied to the actual catalog
// products + sellers and persist them in localStorage. From then on,
// admin moderation actions (approve / flag / delete / add) mutate that
// persisted list directly.
//
// Storage key: laundry:admin:reviews → Array<Review>
//
// Review shape:
//   {
//     id, type ('product' | 'seller'),
//     targetId, targetTitle, targetImage, targetMeta,
//     reviewer: { id, name, initial },
//     rating (1..5),
//     title, comment,
//     status ('approved' | 'pending' | 'flagged'),
//     createdAt (timestamp),
//     source ('seed' | 'admin'),
//   }
// =====================================================================

const STORAGE_KEY = 'laundry:admin:reviews'

const REVIEWER_NAMES = [
  'Anjali Pillai',
  'Rohan Mehta',
  'Sneha Iyer',
  'Karthik Raja',
  'Pooja Bhatt',
  'Aditya Kapoor',
  'Fatima Khan',
  'Rajiv Nair',
  'Megha Sinha',
  'Sandeep Joshi',
  'Vikram Reddy',
  'Nisha Aggarwal',
  'Arjun Bansal',
  'Priya Sharma',
  'Imran Sayed',
  'Kavya Krishnan',
]

const PRODUCT_TITLES_BY_RATING = {
  5: [
    'Absolutely brilliant!',
    'Top-notch — highly recommend',
    'Better than expected',
    'Worth every rupee',
    'Five stars — easy',
  ],
  4: [
    'Solid pick for the price',
    'Very good purchase',
    'Mostly great, minor niggles',
    'Reliable and well-built',
  ],
  3: [
    'Decent but not great',
    'Does the job',
    'Mixed feelings overall',
    'Average performance',
  ],
  2: [
    'Below expectations',
    'Few too many issues',
    'Underwhelming',
  ],
  1: [
    'Wouldn’t recommend',
    'Disappointed',
    'Not worth it',
  ],
}

const PRODUCT_COMMENTS_BY_RATING = {
  5: [
    'Works exactly as advertised. The seller even helped with installation guidance over a quick call — very smooth experience.',
    'Bought this two weeks back. Wash quality, drying noise, water usage — everything checks out. Couldn’t be happier.',
    'Quality is genuinely commercial-grade. Power consumption matches the spec sheet. Will definitely buy from this seller again.',
    'Fantastic product. Came packaged like new, included the original manual. Setup was painless.',
    'Far more capable than the home models I’ve used before. Cycle times are great, output is consistent.',
  ],
  4: [
    'Mostly happy with the purchase. There was a minor cosmetic scratch on the side panel but functionally it’s perfect.',
    'Good buy overall. Took a day to figure out the controls but performance has been steady since.',
    'Solid machine. Knocked one star because the inlet pipe needs replacing — seller offered ₹500 off, which was fair.',
    'Build quality is excellent. Only complaint is the slightly louder spin cycle compared to my old unit.',
  ],
  3: [
    'It works, but I expected better given the price. The seller was responsive though.',
    'Acceptable for occasional use. Wouldn’t pick it for daily commercial work.',
    'Mixed bag. Wash quality is fine, dryer cycle takes longer than rated.',
  ],
  2: [
    'Required a service visit within the first month. Seller refunded transport cost but it was a hassle.',
    'Functional but feels much older than the listing suggested. Be sure to inspect in person.',
  ],
  1: [
    'Stopped working two weeks in. Cost more to repair than I paid. Avoid.',
    'Not as described — drum had visible damage that wasn’t in the photos.',
  ],
}

const SELLER_TITLES_BY_RATING = {
  5: [
    'Top seller — 100% recommend',
    'Smooth, honest transaction',
    'Exactly as described',
    'Quick replies, fair pricing',
  ],
  4: [
    'Reliable seller',
    'Good experience overall',
    'Mostly smooth',
  ],
  3: [
    'Took a while but okay in the end',
    'Average experience',
  ],
  2: [
    'Communication could be better',
    'Slow to respond',
  ],
  1: [
    'Would not buy again',
    'Misleading listing',
  ],
}

const SELLER_COMMENTS_BY_RATING = {
  5: [
    'Picked up the machine the same day I enquired. Item was clean, working, and exactly matched the photos. Highly recommend.',
    'Very professional. Shared the original bill, demo’d the machine for 20 minutes before payment. Will look at their other listings.',
    'Genuine seller — answered every question patiently and even helped load it onto the tempo.',
    'Quick, transparent, no haggling games. The way every transaction should be.',
  ],
  4: [
    'Good seller. Took a couple of days to coordinate the inspection but everything went smoothly after.',
    'Honest with the condition. Did need to negotiate a bit but landed at a fair price.',
    'Replied promptly. The location was a bit far but the visit was worth it.',
  ],
  3: [
    'Slow to confirm timings but the deal eventually went through.',
    'Average — nothing too good, nothing too bad.',
  ],
  2: [
    'Had to chase multiple times before getting a proper response. The product itself was okay.',
    'Listed price was on the higher side; not very flexible during negotiation.',
  ],
  1: [
    'Cancelled the day of pickup after I had already paid for the tempo. Not professional.',
  ],
}

// Stable, fast hash used to drive deterministic random choices so the
// same product/seller always seeds the same reviews across reloads.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

// Simple deterministic PRNG seeded by `seed`. Returns a function that
// yields `next()` and `pick(arr)`.
function makeRng(seed) {
  let s = seed >>> 0 || 1
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0x100000000
  }
  return {
    next,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
  }
}

// Rating distribution skewed positive: 5★ most common, 1★ rarest.
const RATING_WEIGHTS = [
  { rating: 5, weight: 0.5 },
  { rating: 4, weight: 0.3 },
  { rating: 3, weight: 0.13 },
  { rating: 2, weight: 0.05 },
  { rating: 1, weight: 0.02 },
]

function pickRating(rng) {
  const r = rng.next()
  let cum = 0
  for (const { rating, weight } of RATING_WEIGHTS) {
    cum += weight
    if (r <= cum) return rating
  }
  return 5
}

function pickStatus(rng, rating) {
  // Most reviews are auto-approved. 1★/2★ have a higher chance of
  // being either pending or flagged so the admin has something to
  // actually moderate.
  const r = rng.next()
  if (rating <= 2) {
    if (r < 0.45) return 'flagged'
    if (r < 0.75) return 'pending'
    return 'approved'
  }
  if (r < 0.85) return 'approved'
  if (r < 0.95) return 'pending'
  return 'flagged'
}

function pickDaysAgo(rng) {
  // Spread over the last 120 days.
  return rng.int(0, 120)
}

function nameToInitial(name) {
  return (name || 'U').toString().trim().charAt(0).toUpperCase()
}

function reviewerIdFromName(name) {
  return 'rev-usr-' + hash(name).toString(36)
}

function sellerIdFromName(name) {
  return 'seller-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function shortLocation(loc) {
  if (!loc) return ''
  return loc.split(',')[0].trim()
}

function generateSeedReviews() {
  const now = Date.now()
  const reviews = []
  let idCounter = 1

  // -- Product reviews --------------------------------------------------
  for (let i = 0; i < CATALOG_PRODUCTS.length; i++) {
    const p = CATALOG_PRODUCTS[i]
    const rng = makeRng(hash('product:' + p.id))
    const count = rng.int(0, 3)
    for (let j = 0; j < count; j++) {
      const reviewerName = rng.pick(REVIEWER_NAMES)
      const rating = pickRating(rng)
      reviews.push({
        id: 'rev-' + (idCounter++).toString(36) + '-' + p.id,
        type: 'product',
        targetId: p.id,
        targetTitle: p.title,
        targetImage: p.image,
        targetMeta: shortLocation(p.location),
        reviewer: {
          id: reviewerIdFromName(reviewerName),
          name: reviewerName,
          initial: nameToInitial(reviewerName),
        },
        rating,
        title: rng.pick(PRODUCT_TITLES_BY_RATING[rating]),
        comment: rng.pick(PRODUCT_COMMENTS_BY_RATING[rating]),
        status: pickStatus(rng, rating),
        createdAt: now - pickDaysAgo(rng) * 86400000,
        source: 'seed',
      })
    }
  }

  // -- Seller reviews ---------------------------------------------------
  // Build a unique seller list from the catalog, then 1-2 reviews each.
  const sellersByName = new Map()
  for (const p of CATALOG_PRODUCTS) {
    if (!p.seller || sellersByName.has(p.seller.name)) continue
    sellersByName.set(p.seller.name, p.seller)
  }

  for (const seller of sellersByName.values()) {
    const rng = makeRng(hash('seller:' + seller.name))
    const count = rng.int(1, 2)
    for (let j = 0; j < count; j++) {
      const reviewerName = rng.pick(REVIEWER_NAMES)
      const rating = pickRating(rng)
      const sellerId = sellerIdFromName(seller.name)
      reviews.push({
        id: 'rev-' + (idCounter++).toString(36) + '-' + sellerId,
        type: 'seller',
        targetId: sellerId,
        targetTitle: seller.name,
        targetImage: undefined,
        targetMeta: `Member since ${seller.memberSince}`,
        reviewer: {
          id: reviewerIdFromName(reviewerName),
          name: reviewerName,
          initial: nameToInitial(reviewerName),
        },
        rating,
        title: rng.pick(SELLER_TITLES_BY_RATING[rating]),
        comment: rng.pick(SELLER_COMMENTS_BY_RATING[rating]),
        status: pickStatus(rng, rating),
        createdAt: now - pickDaysAgo(rng) * 86400000,
        source: 'seed',
      })
    }
  }

  // Sort most-recent first so the page opens with fresh content.
  reviews.sort((a, b) => b.createdAt - a.createdAt)
  return reviews
}

function readStored() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeStored(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    /* quota / privacy mode — silently ignore */
  }
}

function genId() {
  return (
    'rev-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 7)
  )
}

export function useAdminReviews() {
  const [reviews, setReviews] = useState(() => {
    const stored = readStored()
    if (stored && stored.length > 0) return stored
    const seeds = generateSeedReviews()
    writeStored(seeds)
    return seeds
  })

  useEffect(() => {
    writeStored(reviews)
  }, [reviews])

  const addReview = useCallback((data) => {
    const name = (data.reviewer?.name || data.reviewerName || 'Anonymous').trim()
    const review = {
      id: genId(),
      type: data.type || 'product',
      targetId: data.targetId || '',
      targetTitle: data.targetTitle || '',
      targetImage: data.targetImage || undefined,
      targetMeta: data.targetMeta || '',
      reviewer: {
        id: reviewerIdFromName(name),
        name,
        initial: nameToInitial(name),
      },
      rating: Math.max(1, Math.min(5, Number(data.rating) || 5)),
      title: (data.title || '').trim() || 'Untitled review',
      comment: (data.comment || '').trim(),
      status: data.status || 'pending',
      createdAt: Date.now(),
      source: 'admin',
    }
    setReviews((list) => [review, ...list])
    return review
  }, [])

  const removeReview = useCallback((id) => {
    setReviews((list) => list.filter((r) => r.id !== id))
  }, [])

  const setReviewStatus = useCallback((id, status) => {
    setReviews((list) =>
      list.map((r) => (r.id === id ? { ...r, status } : r))
    )
  }, [])

  const stats = useMemo(() => {
    let total = 0
    let pending = 0
    let flagged = 0
    let ratingSum = 0
    for (const r of reviews) {
      total++
      if (r.status === 'pending') pending++
      else if (r.status === 'flagged') flagged++
      ratingSum += r.rating
    }
    return {
      total,
      pending,
      flagged,
      average: total > 0 ? ratingSum / total : 0,
    }
  }, [reviews])

  return {
    reviews,
    stats,
    addReview,
    removeReview,
    setReviewStatus,
  }
}

// Used by AdminDashboardPage so it can report the real review count
// without subscribing to the full hook.
export function readReviewCount() {
  const stored = readStored()
  if (stored && stored.length > 0) return stored.length
  // First load — seed and persist now so the dashboard agrees with
  // whatever the reviews page will display when opened.
  const seeds = generateSeedReviews()
  writeStored(seeds)
  return seeds.length
}
