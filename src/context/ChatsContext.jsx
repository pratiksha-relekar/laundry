import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { productMap, products } from '../data/products'

// =====================================================================
// ChatsContext
// ---------------------------------------------------------------------
// In-memory + localStorage chats inbox. Each conversation is anchored to
// a product (we cache the seller name, product title, price and image so
// the chat row still renders even if the underlying product disappears).
//
// Seed data: we pick the first ~4 featured products and pre-build a chat
// thread for each so the inbox feels populated on first run.
// =====================================================================

const ChatsContext = createContext(null)
const STORAGE_KEY = 'laundry:chats'

const SEED_TEMPLATES = [
  {
    messages: [
      { from: 'me', text: 'Hi, is this still available?', offset: -3600 * 24 * 2 },
      { from: 'seller', text: "Yes, it's available. Are you interested?", offset: -3600 * 24 * 2 + 600 },
      { from: 'me', text: 'Can you share more pics?', offset: -3600 * 24 + 100 },
      { from: 'seller', text: 'Sure, sending in a few minutes.', offset: -3600 * 24 + 700 },
    ],
  },
  {
    messages: [
      { from: 'me', text: "What's the lowest you can go?", offset: -3600 * 8 },
      { from: 'seller', text: 'Price is firm, but I can include free delivery within city.', offset: -3600 * 8 + 1200 },
    ],
  },
  {
    messages: [
      { from: 'seller', text: 'Hi, thanks for your interest!', offset: -3600 * 3 },
      { from: 'me', text: 'Does it come with warranty?', offset: -3600 * 3 + 300 },
      { from: 'seller', text: 'Yes, 6 months seller warranty.', offset: -3600 * 3 + 900 },
    ],
  },
  {
    messages: [
      { from: 'me', text: 'Where can I inspect this?', offset: -1800 },
    ],
  },
]

function buildSeed() {
  const candidates = products.filter((p) => p.featured).slice(0, SEED_TEMPLATES.length)
  const now = Date.now()
  return candidates.map((p, i) => {
    const tpl = SEED_TEMPLATES[i]
    const messages = tpl.messages.map((m, j) => ({
      id: `m-${p.id}-${j}`,
      from: m.from,
      text: m.text,
      time: now + m.offset * 1000,
    }))
    const last = messages[messages.length - 1]
    return {
      id: `chat-${p.id}`,
      productId: p.id,
      productTitle: p.title,
      productImage: p.image,
      productPrice: p.price,
      sellerName: p.seller?.name || 'Seller',
      messages,
      lastMessage: last.text,
      lastTime: last.time,
      unread: last.from === 'seller',
    }
  })
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'm_' + Math.random().toString(36).slice(2, 11)
}

export function ChatsProvider({ children }) {
  const [chats, setChats] = useState(() => readStored() ?? buildSeed())
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
    } catch {
      /* ignore */
    }
  }, [chats])

  const openChat = useCallback((chatId) => {
    setActiveId(chatId)
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unread: false } : c))
    )
  }, [])

  const closeChat = useCallback(() => setActiveId(null), [])

  const startChat = useCallback((productId) => {
    const product = productMap[productId]
    if (!product) return null
    const existing = (readStored() ?? []).find((c) => c.productId === productId)
    let chatId = `chat-${productId}`
    setChats((prev) => {
      if (prev.some((c) => c.productId === productId)) return prev
      return [
        {
          id: chatId,
          productId,
          productTitle: product.title,
          productImage: product.image,
          productPrice: product.price,
          sellerName: product.seller?.name || 'Seller',
          messages: [],
          lastMessage: '',
          lastTime: Date.now(),
          unread: false,
        },
        ...prev,
      ]
    })
    if (existing) chatId = existing.id
    setActiveId(chatId)
    return chatId
  }, [])

  const sendMessage = useCallback((chatId, text) => {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    const now = Date.now()
    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { id: newId(), from: 'me', text: trimmed, time: now },
              ],
              lastMessage: trimmed,
              lastTime: now,
              unread: false,
            }
          : c
      )
    )

    // Simulated seller auto-reply so the thread feels alive.
    setTimeout(() => {
      const replies = [
        'Thanks for your message! Let me check and get back to you.',
        'Sure, sounds good.',
        'Yes, that works for me.',
        'Could you share your number? It would be easier to coordinate.',
      ]
      const reply = replies[Math.floor(Math.random() * replies.length)]
      setChats((prev) =>
        prev.map((c) =>
          c.id === chatId
            ? {
                ...c,
                messages: [
                  ...c.messages,
                  { id: newId(), from: 'seller', text: reply, time: Date.now() },
                ],
                lastMessage: reply,
                lastTime: Date.now(),
                // Mark unread only if user isn't actively viewing the thread.
                unread: chatId !== activeIdRef.current,
              }
            : c
        )
      )
    }, 1400 + Math.random() * 800)
  }, [])

  const removeChat = useCallback((chatId) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    setActiveId((prev) => (prev === chatId ? null : prev))
  }, [])

  // Track the active id in a ref so the setTimeout above can read the
  // up-to-date value when it eventually fires.
  const activeIdRef = useRef(activeId)
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])

  const totalUnread = useMemo(
    () => chats.reduce((sum, c) => sum + (c.unread ? 1 : 0), 0),
    [chats]
  )

  const value = useMemo(
    () => ({
      chats,
      activeId,
      activeChat: chats.find((c) => c.id === activeId) || null,
      totalUnread,
      openChat,
      closeChat,
      startChat,
      sendMessage,
      removeChat,
    }),
    [chats, activeId, totalUnread, openChat, closeChat, startChat, sendMessage, removeChat]
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
