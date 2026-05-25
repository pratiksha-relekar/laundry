import { useEffect, useRef, useState } from 'react'
import { useChats } from './context/ChatsContext'
import { useNavigation } from './context/NavigationContext'
import {
  ArrowLeftIcon,
  ChatIcon,
  SendIcon,
  TrashIcon,
} from './components/Icons'

function formatPrice(n) {
  return `₹ ${n.toLocaleString('en-IN')}`
}

function formatTime(ts) {
  const d = new Date(ts)
  const today = new Date()
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  if (sameDay) {
    return d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
  }
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const isYesterday =
    d.getFullYear() === yesterday.getFullYear() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getDate() === yesterday.getDate()
  if (isYesterday) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

function ChatListItem({ chat, active, onClick }) {
  const initial = (chat.sellerName || 'S').trim().charAt(0).toUpperCase()
  return (
    <button
      type="button"
      className={`chat-list-item ${active ? 'active' : ''} ${chat.unread ? 'unread' : ''}`}
      onClick={onClick}
    >
      <span className="chat-list-avatar" aria-hidden>
        {initial}
      </span>
      <span className="chat-list-body">
        <span className="chat-list-row1">
          <span className="chat-list-name">{chat.sellerName}</span>
          <span className="chat-list-time">{formatTime(chat.lastTime)}</span>
        </span>
        <span className="chat-list-row2">
          <span className="chat-list-product">{chat.productTitle}</span>
        </span>
        <span className="chat-list-row3">
          <span className="chat-list-msg">
            {chat.lastMessage || 'Tap to start the conversation'}
          </span>
          {chat.unread && <span className="chat-list-dot" aria-hidden />}
        </span>
      </span>
    </button>
  )
}

function ChatThread({ chat, onBack, onSend, onDelete }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)

  // Auto-scroll to the latest message whenever the thread or its
  // message list changes.
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [chat?.id, chat?.messages?.length])

  if (!chat) {
    return (
      <div className="chat-thread chat-thread-empty">
        <div className="chat-thread-empty-icon" aria-hidden>
          <ChatIcon size={40} />
        </div>
        <h3>Select a chat</h3>
        <p>Choose a conversation from the list to view messages.</p>
      </div>
    )
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSend(chat.id, text)
    setText('')
  }

  return (
    <div className="chat-thread">
      <div className="chat-thread-head">
        <button
          type="button"
          className="chat-thread-back"
          aria-label="Back to chat list"
          onClick={onBack}
        >
          <ArrowLeftIcon size={18} />
        </button>
        <img
          className="chat-thread-thumb"
          src={chat.productImage}
          alt=""
          loading="lazy"
        />
        <div className="chat-thread-info">
          <div className="chat-thread-name">{chat.sellerName}</div>
          <div className="chat-thread-product">
            {chat.productTitle}
            <span className="chat-thread-price">{formatPrice(chat.productPrice)}</span>
          </div>
        </div>
        <button
          type="button"
          className="chat-thread-delete"
          aria-label="Delete chat"
          onClick={() => onDelete(chat.id)}
        >
          <TrashIcon size={16} />
        </button>
      </div>

      <div className="chat-thread-list" ref={listRef}>
        {chat.messages.length === 0 ? (
          <div className="chat-thread-empty-state">
            Say hi to {chat.sellerName.split(' ')[0]} — they usually reply within an hour.
          </div>
        ) : (
          chat.messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble chat-bubble-${m.from === 'me' ? 'me' : 'them'}`}
            >
              <span className="chat-bubble-text">{m.text}</span>
              <span className="chat-bubble-time">{formatTime(m.time)}</span>
            </div>
          ))
        )}
      </div>

      <form className="chat-thread-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Type a message"
        />
        <button
          type="submit"
          className="chat-thread-send"
          aria-label="Send"
          disabled={!text.trim()}
        >
          <SendIcon size={18} />
        </button>
      </form>
    </div>
  )
}

export default function ChatsPage() {
  const { chats, activeId, activeChat, openChat, closeChat, sendMessage, removeChat } =
    useChats()
  const { goHome } = useNavigation()

  return (
    <div className="lx-page chats-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={goHome}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>

        <div className="lx-page-title-row">
          <div>
            <h1 className="lx-page-h1">
              <ChatIcon size={20} /> Chats
            </h1>
            <p className="lx-page-sub">
              {chats.length === 0
                ? 'Your seller conversations will appear here.'
                : `${chats.length} conversation${chats.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
      </div>

      <div className={`chats-shell ${activeId ? 'has-active' : ''}`}>
        <aside className="chats-list" aria-label="Conversations">
          {chats.length === 0 ? (
            <div className="chats-list-empty">
              <p>No chats yet. Open a listing and tap "Chat with seller" to start one.</p>
            </div>
          ) : (
            chats.map((c) => (
              <ChatListItem
                key={c.id}
                chat={c}
                active={c.id === activeId}
                onClick={() => openChat(c.id)}
              />
            ))
          )}
        </aside>

        <section className="chats-thread-pane">
          <ChatThread
            chat={activeChat}
            onBack={closeChat}
            onSend={sendMessage}
            onDelete={removeChat}
          />
        </section>
      </div>
    </div>
  )
}
