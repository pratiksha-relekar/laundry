import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useAuth } from './AuthContext'
import { useProducts } from './ProductsContext'
import {
  ensureChat,
  hideChatForUser,
  markChatRead,
  sendChatMessage,
  subscribeToChatMessages,
  subscribeToUserChats,
} from '../auth/chats'

// =====================================================================
// ChatsContext (OLX-style live chats)
// ---------------------------------------------------------------------
// Every chat is a shared document in the top-level `chats` collection
// so both the buyer and the seller see the exact same thread in real
// time. Messages live in a `messages` subcollection and stream via a
// dedicated onSnapshot subscription whenever a chat is opened.
//
//   chats: chat list for the current user (buyer OR seller view)
//   activeId / activeChat: currently open thread
//   messages: live messages for the active thread
//   totalUnread: number of chats with unread messages
//   startChat(productId): create-or-get the chat for a product
//   sendMessage(chatId, text)
//   removeChat(chatId): soft-delete from this user's inbox only
//                       (other party keeps full history)
// =====================================================================

const ChatsContext = createContext(null)

export function ChatsProvider({ children }) {
  const { user } = useAuth()
  const { getProduct } = useProducts()
  const myEmail = user?.email || user?.id || null
  const myName = user?.fullName || ''

  const [rawChats, setRawChats] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [rawMessages, setRawMessages] = useState([])

  // ----- chats list subscription ---------------------------------------
  useEffect(() => {
    if (!myEmail) return undefined
    return subscribeToUserChats(myEmail, setRawChats, () => setRawChats([]))
  }, [myEmail])

  // ----- active-thread messages subscription ---------------------------
  useEffect(() => {
    if (!activeId) return undefined
    return subscribeToChatMessages(
      activeId,
      setRawMessages,
      () => setRawMessages([])
    )
  }, [activeId])

  // Enrich every chat with the "other party" info (whoever isn't me)
  // and a derived `unread` flag so the UI doesn't have to know about
  // participants arrays. Logged-out viewers see an empty list.
  const enrichedChats = useMemo(() => {
    if (!myEmail) return []
    return rawChats.map((c) => {
      const iAmBuyer = c.buyerEmail === myEmail
      return {
        ...c,
        iAmBuyer,
        otherEmail: iAmBuyer ? c.sellerEmail : c.buyerEmail,
        otherName: iAmBuyer ? c.sellerName : c.buyerName,
        unread: c.unreadFor.includes(myEmail),
      }
    })
  }, [rawChats, myEmail])

  // Live messages with a `mine` flag so the bubble renderer can flip
  // sides without comparing emails itself.
  const enrichedMessages = useMemo(() => {
    if (!myEmail || !activeId) return []
    return rawMessages.map((m) => ({
      ...m,
      mine: m.fromEmail === myEmail,
    }))
  }, [rawMessages, myEmail, activeId])

  const activeChat = useMemo(() => {
    if (!activeId) return null
    const chat = enrichedChats.find((c) => c.id === activeId)
    if (!chat) return null
    return { ...chat, messages: enrichedMessages }
  }, [activeId, enrichedChats, enrichedMessages])

  const openChat = useCallback(
    (chatId) => {
      setActiveId(chatId)
      if (myEmail) {
        markChatRead(chatId, myEmail).catch((err) =>
          console.warn('[chats] mark read failed:', err?.message)
        )
      }
    },
    [myEmail]
  )

  const closeChat = useCallback(() => {
    setActiveId(null)
    setRawMessages([])
  }, [])

  // -------------------- startChat (buyer flow) ------------------------
  const startChat = useCallback(
    async (productId) => {
      if (!myEmail) return null
      const product = getProduct(productId)
      if (!product) return null

      const sellerEmail = product.sellerId || product.seller?.id || ''
      const sellerName = product.seller?.name || 'Seller'
      // Catalog seed products don't have a real seller account, so we
      // can't open a live chat with them.
      if (!sellerEmail || !sellerEmail.includes('@')) {
        console.warn('[chats] product has no real seller — chat unavailable')
        return null
      }
      if (sellerEmail === myEmail) {
        // Don't let a seller chat with themselves on their own listing.
        return null
      }

      try {
        const chatId = await ensureChat({
          productId,
          productTitle: product.title,
          productImage: product.image,
          productPrice: product.price,
          buyerEmail: myEmail,
          buyerName: myName,
          sellerEmail,
          sellerName,
        })
        setActiveId(chatId)
        // Stamp lastRead immediately so the buyer doesn't see their
        // own thread as "unread" the moment they create it.
        markChatRead(chatId, myEmail).catch(() => {})
        return chatId
      } catch (err) {
        console.warn('[chats] start failed:', err?.message)
        return null
      }
    },
    [myEmail, myName, getProduct]
  )

  const sendMessage = useCallback(
    async (chatId, text) => {
      const trimmed = (text || '').trim()
      if (!myEmail || !chatId || !trimmed) return
      try {
        await sendChatMessage(chatId, {
          fromEmail: myEmail,
          fromName: myName,
          text: trimmed,
        })
      } catch (err) {
        console.warn('[chats] send failed:', err?.message)
      }
    },
    [myEmail, myName]
  )

  const removeChat = useCallback(
    async (chatId) => {
      if (!myEmail || !chatId) {
        return { ok: false, error: 'You must be logged in to delete a chat.' }
      }
      if (activeId === chatId) {
        setActiveId(null)
        setRawMessages([])
      }
      try {
        await hideChatForUser(chatId, myEmail)
        return { ok: true }
      } catch (err) {
        console.warn('[chats] hide failed:', err?.message)
        return {
          ok: false,
          error: err?.message || 'Could not delete this chat. Try again.',
        }
      }
    },
    [myEmail, activeId]
  )

  const totalUnread = useMemo(
    () => enrichedChats.reduce((sum, c) => sum + (c.unread ? 1 : 0), 0),
    [enrichedChats]
  )

  const value = useMemo(
    () => ({
      chats: enrichedChats,
      activeId,
      activeChat,
      totalUnread,
      openChat,
      closeChat,
      startChat,
      sendMessage,
      removeChat,
    }),
    [
      enrichedChats,
      activeId,
      activeChat,
      totalUnread,
      openChat,
      closeChat,
      startChat,
      sendMessage,
      removeChat,
    ]
  )

  return <ChatsContext.Provider value={value}>{children}</ChatsContext.Provider>
}

export function useChats() {
  const ctx = useContext(ChatsContext)
  if (!ctx) {
    throw new Error('useChats must be used inside a ChatsProvider')
  }
  return ctx
}
