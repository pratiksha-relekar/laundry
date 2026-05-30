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
import { BRAND_NAME } from '../assets/brand'
import { BrandMark } from './BrandLogo'
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
      aria-label={`${BRAND_NAME} — homepage`}
      onClick={(e) => {
        e.preventDefault()
        onClick?.()
      }}
    >
      <BrandMark size={36} className="logo-mark-slot" />
      <span className="logo-text">{BRAND_NAME}</span>
    </a>
  )
}

function UserMenu({ user, onLogout, onAccount, onMyAds, onWishlist, onSell }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

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
        <span className="hdr-user-avatar" aria-hidden>
          {(user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase()}
        </span>
        <span className="hdr-user-name">{user?.fullName?.split(' ')[0] || 'Account'}</span>
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="hdr-user-menu" role="menu">
          <div className="hdr-user-meta">
            <strong>{user?.fullName}</strong>
            <span>{user?.email}</span>
            {user?.provider === 'google' && (
              <span className="hdr-user-provider">Signed in with Google</span>
            )}
          </div>
          <button type="button" className="hdr-user-item" onClick={handle(onSell)}>
            <PlusIcon size={16} /> Sell
          </button>
          <button type="button" className="hdr-user-item" onClick={handle(onMyAds)}>
            <PlusIcon size={16} /> My ADS
          </button>
          <button type="button" className="hdr-user-item" onClick={handle(onWishlist)}>
            <HeartIcon size={16} /> Wishlist
          </button>
          <button type="button" className="hdr-user-item" onClick={handle(onAccount)}>
            <SettingsIcon size={16} /> Account
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

export default function Header() {
  const {
    query,
    setQuery,
    submit,
    clearSearch,
    dropdownOpen,
    setDropdownOpen,
    recent,
    removeRecent,
    clearRecent,
    suggestions,
    isFiltering,
  } = useSearch()
  const { user, logout, isSeller } = useAuth()
  const {
    goHome,
    goLogin,
    goSignup,
    goSell,
    goWishlist,
    goMyAds,
    goAccount,
  } = useNavigation()
  const { count: wishlistCount } = useWishlist()
  const { theme, toggleTheme } = useTheme()
  const searchRef = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [setDropdownOpen])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    submit(query)
    setDropdownOpen(false)
  }

  return (
    <header className="lx-header">
      <div className="lx-header-inner">
        <Logo onClick={goHome} />

        <button type="button" className="loc-pill" aria-label="Change location">
          <PinIcon size={18} />
          <span className="loc-pill-text">India</span>
          <ChevronDown size={16} />
        </button>

        <div className="search-wrap" ref={searchRef}>
          <form className="search" onSubmit={handleSearchSubmit}>
            <span className="search-leading" aria-hidden>
              <SearchIcon size={18} />
            </span>
            <input
              type="search"
              placeholder="Find washing machines, dryers, and more…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (!dropdownOpen) setDropdownOpen(true)
              }}
              onFocus={() => setDropdownOpen(true)}
              aria-label={`Search ${BRAND_NAME}`}
              aria-expanded={dropdownOpen}
              aria-controls="search-dropdown"
            />
            {query && (
              <button
                type="button"
                className="search-clear"
                aria-label="Clear search"
                onClick={() => {
                  clearSearch()
                  setDropdownOpen(false)
                }}
              >
                <CloseIcon size={16} />
              </button>
            )}
          </form>

          {dropdownOpen && (
            <SearchDropdown
              id="search-dropdown"
              query={query}
              recent={recent}
              suggestions={suggestions}
              isFiltering={isFiltering}
              onPick={(q) => {
                submit(q)
                setDropdownOpen(false)
              }}
              onRemoveRecent={removeRecent}
              onClearRecent={clearRecent}
            />
          )}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="hdr-theme"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>

          {isSeller && (
            <button type="button" className="sell-pill" onClick={goSell}>
              <span className="sell-pill-inner">
                <PlusIcon size={16} /> SELL
              </span>
            </button>
          )}

          <button
            type="button"
            className="hdr-icon hdr-icon-wishlist"
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
            <div className="hdr-auth">
              <button type="button" className="hdr-auth-btn" onClick={goLogin}>
                Login
              </button>
              <button
                type="button"
                className="hdr-auth-btn hdr-auth-btn-primary"
                onClick={goSignup}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
