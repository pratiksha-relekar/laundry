// =====================================================================
// Firestore — top-level `chats` collection (OLX-style live messaging)
// ---------------------------------------------------------------------
// Every conversation is shared between exactly two participants — a
// buyer and the seller of a product — and lives in a single global
// `chats` collection so both sides see the same thread in real-time.
//
// chats/{chatId}
//   productId, productTitle, productImage, productPrice
//   buyerEmail, buyerName
//   sellerEmail, sellerName
//   participants: [buyerEmail, sellerEmail]   ← array-contains index
//   lastMessage, lastTime, lastFrom
//   unreadFor: string[]   ← emails who have unread messages
//   hiddenFor: string[]   ← emails who have soft-deleted the chat
//   createdAt
//
// chats/{chatId}/messages/{messageId}
//   text, fromEmail, fromName, time
//
// `chatId` is deterministic: `${productId}__${buyerEmailKey}` so a
// buyer revisiting the same listing always reopens the same thread
// instead of spawning duplicates.
// =====================================================================

import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from './firebase'
import { incrementProductChats } from './products'
import { emailKey } from './users'

const CHATS_COLLECTION = 'chats'
const MESSAGES_SUBCOLLECTION = 'messages'

// ---------------------------------------------------------------------
//   References & helpers
// ---------------------------------------------------------------------

export function chatsCollectionRef() {
  return collection(db, CHATS_COLLECTION)
}

export function chatDocRef(chatId) {
  return doc(db, CHATS_COLLECTION, chatId)
}

export function chatMessagesCollectionRef(chatId) {
  return collection(db, CHATS_COLLECTION, chatId, MESSAGES_SUBCOLLECTION)
}

/**
 * Build a deterministic chat id from a product + buyer email. The same
 * pair will always resolve to the same chat, even after navigating
 * away and back.
 */
export function makeChatId(productId, buyerEmail) {
  return `${productId}__${emailKey(buyerEmail)}`
}

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

function normaliseChatDoc(id, data) {
  if (!data) return null
  return {
    id,
    productId: data.productId || '',
    productTitle: data.productTitle || '',
    productImage: data.productImage || '',
    productPrice: typeof data.productPrice === 'number' ? data.productPrice : 0,
    buyerEmail: data.buyerEmail || '',
    buyerName: data.buyerName || '',
    sellerEmail: data.sellerEmail || '',
    sellerName: data.sellerName || '',
    participants: Array.isArray(data.participants) ? data.participants : [],
    lastMessage: data.lastMessage || '',
    lastFrom: data.lastFrom || '',
    lastTime: tsToMs(data.lastTime),
    unreadFor: Array.isArray(data.unreadFor) ? data.unreadFor : [],
    hiddenFor: Array.isArray(data.hiddenFor) ? data.hiddenFor : [],
    createdAt: tsToMs(data.createdAt),
  }
}

function normaliseMessageDoc(id, data) {
  if (!data) return null
  return {
    id,
    text: data.text || '',
    fromEmail: data.fromEmail || '',
    fromName: data.fromName || '',
    time: tsToMs(data.time) || Date.now(),
  }
}

// ---------------------------------------------------------------------
//   Subscriptions (live updates)
// ---------------------------------------------------------------------

/**
 * Subscribe to every chat the given user participates in. The query
 * uses `array-contains` against the `participants` field so Firestore
 * indexes it automatically (no composite index needed).
 *
 * Chats the user has soft-deleted (`hiddenFor` includes their email)
 * are filtered out client-side so they don't reappear in the inbox.
 */
export function subscribeToUserChats(userEmail, onChange, onError) {
  const id = emailKey(userEmail)
  if (!id) {
    onChange([])
    return () => {}
  }
  const q = query(
    chatsCollectionRef(),
    where('participants', 'array-contains', id)
  )
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs
        .map((d) => normaliseChatDoc(d.id, d.data()))
        .filter((c) => c && !c.hiddenFor.includes(id))
      list.sort((a, b) => (b.lastTime || 0) - (a.lastTime || 0))
      onChange(list)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('[chats] subscribe error:', err?.message)
      onChange([])
    }
  )
}

/**
 * Subscribe to the message stream of a single chat, ordered oldest →
 * newest. Used by the open thread pane.
 */
export function subscribeToChatMessages(chatId, onChange, onError) {
  if (!chatId) {
    onChange([])
    return () => {}
  }
  const q = query(chatMessagesCollectionRef(chatId), orderBy('time', 'asc'))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => normaliseMessageDoc(d.id, d.data()))
      onChange(list)
    },
    (err) => {
      if (onError) onError(err)
      else console.warn('[chats/messages] subscribe error:', err?.message)
      onChange([])
    }
  )
}

// ---------------------------------------------------------------------
//   Mutations
// ---------------------------------------------------------------------

/**
 * Create-or-get the unique chat for (product, buyer, seller). Safe to
 * call repeatedly — `setDoc` with `merge: true` won't clobber an
 * existing thread, and the message subcollection survives untouched.
 *
 * Returns the chatId.
 */
export async function ensureChat({
  productId,
  productTitle,
  productImage,
  productPrice,
  buyerEmail,
  buyerName,
  sellerEmail,
  sellerName,
}) {
  const buyer = emailKey(buyerEmail)
  const seller = emailKey(sellerEmail)
  if (!productId || !buyer || !seller) {
    throw new Error('ensureChat: missing productId / buyer / seller')
  }
  if (buyer === seller) {
    throw new Error('ensureChat: cannot chat with yourself')
  }

  const chatId = makeChatId(productId, buyer)
  const ref = chatDocRef(chatId)
  const existing = await getDoc(ref)
  if (existing.exists()) {
    // If the buyer previously soft-deleted the thread, unhide it for
    // them so a fresh "Chat with seller" tap actually reopens it.
    const data = existing.data()
    if (Array.isArray(data.hiddenFor) && data.hiddenFor.includes(buyer)) {
      await updateDoc(ref, { hiddenFor: arrayRemove(buyer) })
    }
    return chatId
  }

  await setDoc(ref, {
    productId,
    productTitle: productTitle || '',
    productImage: productImage || '',
    productPrice: typeof productPrice === 'number' ? productPrice : 0,
    buyerEmail: buyer,
    buyerName: buyerName || '',
    sellerEmail: seller,
    sellerName: sellerName || '',
    participants: [buyer, seller],
    lastMessage: '',
    lastFrom: '',
    lastTime: serverTimestamp(),
    unreadFor: [],
    hiddenFor: [],
    createdAt: serverTimestamp(),
  })
  incrementProductChats(productId).catch(() => {})
  return chatId
}

/**
 * Append a message to the chat's `messages` subcollection AND update
 * the parent doc's lastMessage / lastTime / unreadFor so the inbox
 * preview stays accurate without an extra query.
 */
export async function sendChatMessage(chatId, { fromEmail, fromName, text }) {
  const sender = emailKey(fromEmail)
  const body = (text || '').trim()
  if (!chatId || !sender || !body) return null

  const chatRef = chatDocRef(chatId)
  const snap = await getDoc(chatRef)
  if (!snap.exists()) return null
  const chat = snap.data()
  const otherEmail = (chat.participants || []).find((p) => p !== sender)

  // Write the message into the subcollection.
  const messagePayload = {
    text: body,
    fromEmail: sender,
    fromName: fromName || '',
    time: serverTimestamp(),
  }
  const msgRef = await addDoc(chatMessagesCollectionRef(chatId), messagePayload)

  // Update the parent metadata. The recipient gets the unread flag
  // (via arrayUnion); soft-delete is undone for both sides so a fresh
  // message brings the thread back into either inbox.
  const updates = {
    lastMessage: body,
    lastFrom: sender,
    lastTime: serverTimestamp(),
    hiddenFor: [],
  }
  if (otherEmail) {
    updates.unreadFor = arrayUnion(otherEmail)
  }
  await updateDoc(chatRef, updates)

  return { id: msgRef.id, ...messagePayload, time: Date.now() }
}

/** Flip the unread flag back to false for the given viewer. */
export async function markChatRead(chatId, viewerEmail) {
  const viewer = emailKey(viewerEmail)
  if (!chatId || !viewer) return
  try {
    await updateDoc(chatDocRef(chatId), { unreadFor: arrayRemove(viewer) })
  } catch (err) {
    console.warn('[chats] mark read failed:', err?.message)
  }
}

/**
 * Soft-delete from one user's inbox only. The other party keeps the
 * thread; a new message from them clears `hiddenFor` and restores it
 * (see `sendChatMessage`).
 */
export async function hideChatForUser(chatId, viewerEmail) {
  const viewer = emailKey(viewerEmail)
  if (!chatId || !viewer) {
    throw new Error('hideChatForUser: missing chat or user')
  }
  await updateDoc(chatDocRef(chatId), {
    hiddenFor: arrayUnion(viewer),
    unreadFor: arrayRemove(viewer),
  })
}

/**
 * Hard-delete the chat document and every message under it. Use with
 * care — both parties lose access immediately. Intended for admin
 * tooling, not the regular UI.
 */
export async function deleteChatCompletely(chatId) {
  if (!chatId) return
  const messages = await getDocs(chatMessagesCollectionRef(chatId))
  const batch = writeBatch(db)
  messages.forEach((m) => batch.delete(m.ref))
  batch.delete(chatDocRef(chatId))
  await batch.commit()
}
