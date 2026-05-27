// =====================================================================
// Firestore — top-level `products` and `categories` collections
// ---------------------------------------------------------------------
// Every product listing — whether a user posted it from the Sell page,
// or an admin added it via the dashboard — lives in a single global
// `products` collection so that every visitor (signed-in or not) sees
// every listing. The same is true for admin-added categories which
// merge with the static catalog in `src/data/categories.js`.
//
// products/{productId}
//   id, adId, title, description, price, brand, condition,
//   image, images[], category, subcategory, location, phone,
//   seller: { id, name, location, memberSince, ... },
//   sellerId      — uid of the seller (for "my ads" filtering)
//   source        — 'user' | 'admin' (catalog products stay static)
//   status        — 'active' | 'pending' | 'sold'
//   featured, verified, views, chats, favs,
//   createdAt: serverTimestamp
//
// categories/{categoryId}
//   id (slug), name, tagline, iconName, iconColor,
//   subcategories: string[], addedBy, source: 'admin',
//   createdAt: serverTimestamp
// =====================================================================

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const PRODUCTS_COLLECTION = 'products'
const CATEGORIES_COLLECTION = 'categories'

function tsToMs(v) {
  if (!v) return undefined
  if (typeof v.toMillis === 'function') return v.toMillis()
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = Date.parse(v)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

export function productsCollectionRef() {
  return collection(db, PRODUCTS_COLLECTION)
}

export function productDocRef(productId) {
  return doc(db, PRODUCTS_COLLECTION, productId)
}

export function categoriesCollectionRef() {
  return collection(db, CATEGORIES_COLLECTION)
}

export function categoryDocRef(categoryId) {
  return doc(db, CATEGORIES_COLLECTION, categoryId)
}

export function normaliseProductDoc(id, data) {
  if (!data) return null
  const images = Array.isArray(data.images) ? data.images : []
  return {
    ...data,
    id,
    images,
    image: data.image || images[0] || '',
    status: data.status || 'active',
    source: data.source || 'user',
    views: typeof data.views === 'number' ? data.views : 0,
    chats: typeof data.chats === 'number' ? data.chats : 0,
    favs: typeof data.favs === 'number' ? data.favs : 0,
    featured: !!data.featured,
    verified: !!data.verified,
    createdAt: tsToMs(data.createdAt),
  }
}

export function normaliseCategoryDoc(id, data) {
  if (!data) return null
  return {
    ...data,
    id,
    iconName: data.iconName || 'Package',
    iconColor: data.iconColor || '#1B6FFF',
    subcategories: Array.isArray(data.subcategories) ? data.subcategories : [],
    source: data.source || 'admin',
    createdAt: tsToMs(data.createdAt),
  }
}

// ---------------------------------------------------------------------
//   Products
// ---------------------------------------------------------------------

/**
 * Subscribe to live updates for every product in the marketplace.
 * Used by the home grid, search and admin pages so everyone sees the
 * same listings.
 */
export function subscribeToAllProducts(onChange, onError) {
  return onSnapshot(
    productsCollectionRef(),
    (snap) => {
      const list = snap.docs.map((d) => normaliseProductDoc(d.id, d.data()))
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      onChange(list)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('[firestore/products] subscribe error:', err?.message)
      onChange([])
    }
  )
}

/**
 * Subscribe to one seller's listings — used by the user "My ADS" page
 * and the admin user detail modal.
 */
export function subscribeToSellerProducts(sellerId, onChange, onError) {
  if (!sellerId) {
    onChange([])
    return () => {}
  }
  const q = query(productsCollectionRef(), where('sellerId', '==', sellerId))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => normaliseProductDoc(d.id, d.data()))
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      onChange(list)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('[firestore/products] seller subscribe error:', err?.message)
      onChange([])
    }
  )
}

/**
 * Create a brand-new product. The doc id is auto-generated; the
 * returned object includes that id so callers can navigate to it
 * straight away.
 */
export async function createProduct(payload) {
  const data = {
    ...payload,
    images: Array.isArray(payload.images) ? payload.images : [],
    status: payload.status || 'active',
    source: payload.source || 'user',
    featured: !!payload.featured,
    verified: !!payload.verified,
    views: typeof payload.views === 'number' ? payload.views : 0,
    chats: typeof payload.chats === 'number' ? payload.chats : 0,
    favs: typeof payload.favs === 'number' ? payload.favs : 0,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(productsCollectionRef(), data)
  return { ...payload, id: ref.id, createdAt: Date.now() }
}

export async function updateProduct(productId, patch) {
  if (!productId) return
  await updateDoc(productDocRef(productId), patch)
}

/** Bump listing view count (Firestore user/admin products only). */
export async function incrementProductViews(productId) {
  if (!productId) return
  try {
    await updateDoc(productDocRef(productId), { views: increment(1) })
  } catch (err) {
    console.warn('[products] increment views failed:', err?.message)
  }
}

/** Bump listing chat count when a new buyer thread is created. */
export async function incrementProductChats(productId) {
  if (!productId) return
  try {
    await updateDoc(productDocRef(productId), { chats: increment(1) })
  } catch (err) {
    console.warn('[products] increment chats failed:', err?.message)
  }
}

export async function deleteProduct(productId) {
  if (!productId) return
  await deleteDoc(productDocRef(productId))
}

/**
 * Count live listings for a seller (source of truth for role demotion).
 * Requires a single-field index on `products.sellerId` (auto-created).
 */
export async function countSellerProducts(sellerId) {
  if (!sellerId) return 0
  const q = query(productsCollectionRef(), where('sellerId', '==', sellerId))
  const snap = await getDocs(q)
  return snap.size
}

// ---------------------------------------------------------------------
//   Categories (admin-added; live alongside the static catalog)
// ---------------------------------------------------------------------

export function subscribeToCategories(onChange, onError) {
  return onSnapshot(
    categoriesCollectionRef(),
    (snap) => {
      const list = snap.docs.map((d) => normaliseCategoryDoc(d.id, d.data()))
      list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
      onChange(list)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('[firestore/categories] subscribe error:', err?.message)
      onChange([])
    }
  )
}

/**
 * Create-or-merge a category. We use a slug as the doc id so the same
 * id can never be added twice.
 */
export async function createCategory(payload) {
  const name = (payload.name || '').trim()
  const explicitId = (payload.id || '').toString().trim().toLowerCase()
  const slug =
    explicitId ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  if (!slug) throw new Error('createCategory: missing name / id')

  const data = {
    name,
    tagline: payload.tagline || '',
    iconName: payload.iconName || 'Package',
    iconColor: payload.iconColor || '#1B6FFF',
    subcategories: Array.isArray(payload.subcategories)
      ? payload.subcategories
      : [],
    source: 'admin',
    addedBy: payload.addedBy || '',
    createdAt: serverTimestamp(),
  }
  await setDoc(categoryDocRef(slug), data, { merge: true })
  return { ...data, id: slug, createdAt: Date.now() }
}

export async function deleteCategory(categoryId) {
  if (!categoryId) return
  await deleteDoc(categoryDocRef(categoryId))
}
