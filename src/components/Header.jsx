import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  CloseIcon,
  HeartIcon,
  LogoutIcon,
  MoonIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  UserIcon,
} from './Icons'
import { useSearch } from '../context/SearchContext'
import { useAuth } from '../context/AuthContext'
import { useNavigation } from '../context/NavigationContext'
import { useWishlist } from '../context/WishlistContext'
import { useTheme } from '../context/ThemeContext'
import SearchDropdown from './SearchDropdown'

function Logo({ onClick }) {
  return (
    <a
      className="logo"
      href="#"
      aria-label="Laundry — homepage"
      onClick={(e) => {
        e.preventDefault()
        onClick?.()
      }}
    >
      <span className="logo-mark">
        <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden>
          <circle cx="20" cy="20" r="20" fill="#1B6FFF" />
          <circle cx="20" cy="20" r="11" fill="#fff" />
          <circle cx="20" cy="20" r="6" fill="#1B6FFF" opacity="0.85" />
          <circle cx="14" cy="14" r="2" fill="#fff" opacity="0.6" />
        </svg>
      </span>
      <span className="logo-text">Laundry</span>
    </a>
  )
}

function UserMenu({ user, onLogout, onAccount, onMyAds, onWishlist, onSell }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const firstName = (user.fullName || 'User').split(' ')[0]
  const initial = (user.fullName || user.email || 'U').trim().charAt(0).toUpperCase()

  const handle = (fn) => () => {
    setOpen(false)
    fn?.()
  }

  return (
    <div className="hdr-user" ref={ref}>
      <button
        type="button"
        className="hdr-user-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="hdr-user-avatar" aria-hidden>{initial}</span>
        <span className="hdr-user-name">Hi, {firstName}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="hdr-user-menu" role="menu">
          <div className="hdr-user-meta">
            <strong>{user.fullName}</strong>
            <span>{user.email}</span>
            {user.provider === 'google' && (
              <span className="hdr-user-provider">via Google</span>
            )}
          </div>
          <button type="button" className="hdr-user-item" onClick={handle(onAccount)}>
            <UserIcon size={16} /> My account
          </button>
          <button type="button" className="hdr-user-item" onClick={handle(onMyAds)}>
            <SettingsIcon size={16} /> My ads
          </button>
          <button type="button" className="hdr-user-item" onClick={handle(onWishlist)}>
            <HeartIcon size={16} /> Wishlist
          </button>
          <button type="button" className="hdr-user-item" onClick={handle(onSell)}>
            <PlusIcon size={16} /> Sell an item
          </button>
          <div className="hdr-user-divider" aria-hidden />
          <button type="button" className="hdr-user-item" onClick={handle(onLogout)}>
            <LogoutIcon size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  )
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      className="hdr-theme"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="hdr-theme-icon" aria-hidden>
        {isDark ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </span>
    </button>
  )
}

export default function Header() {
  const { query, setQuery, submit, clearSearch } = useSearch()
  const { user, logout } = useAuth()
  const {
    goHome,
    goLogin,
    goWishlist,
    goAccount,
    goMyAds,
    goSell,
  } = useNavigation()
  const { count: wishlistCount } = useWishlist()
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    function handleKey(e) {
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const handleSubmit = (value) => {
    submit(value)
    setOpen(false)
    inputRef.current?.blur()
  }

  const handlePick = (value) => {
    setQuery(value)
    handleSubmit(value)
  }

  return (
    <header className="lx-header">
      <div className="lx-header-inner">
        <Logo onClick={goHome} />

        <button className="loc-pill" type="button">
          <PinIcon size={18} />
          <span className="loc-pill-text">India</span>
          <ChevronDown size={16} />
        </button>

        <div className="search-wrap" ref={wrapperRef}>
          <div className={`search ${open ? 'is-open' : ''}`}>
            <SearchIcon size={18} className="search-leading" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
              placeholder="Search washing machines, dryers, steam irons..."
              aria-label="Search Laundry"
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                aria-label="Clear search"
                onMouseDown={(e) => {
                  e.preventDefault()
                  clearSearch()
                  inputRef.current?.focus()
                }}
              >
                <CloseIcon size={14} />
              </button>
            )}
            <button
              className="search-btn"
              type="button"
              onClick={() => handleSubmit()}
              aria-label="Search"
            >
              <SearchIcon size={18} />
            </button>
          </div>

          {open && <SearchDropdown onPick={handlePick} />}
        </div>

        <div className="header-actions">
          <ThemeToggle />
          <button
            className="hdr-icon hdr-icon-wishlist"
            type="button"
            aria-label={`Wishlist${wishlistCount ? ` (${wishlistCount})` : ''}`}
            onClick={goWishlist}
          >
            <span className="hdr-icon-wrap">
              <HeartIcon size={22} filled={wishlistCount > 0} />
              {wishlistCount > 0 && (
                <span className="hdr-badge" aria-hidden>
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </span>
            <span className="hdr-icon-label">Wishlist</span>
          </button>
          {user ? (
            <UserMenu
              user={user}
              onLogout={logout}
              onAccount={goAccount}
              onMyAds={goMyAds}
              onWishlist={goWishlist}
              onSell={goSell}
            />
          ) : (
            <button
              className="hdr-icon"
              type="button"
              aria-label="Login"
              onClick={goLogin}
            >
              <UserIcon size={22} />
              <span className="hdr-icon-label">Login</span>
            </button>
          )}
          <button
            className="sell-pill"
            type="button"
            onClick={user ? goSell : goLogin}
          >
            <span className="sell-pill-inner">
              <PlusIcon size={16} />
              SELL
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
