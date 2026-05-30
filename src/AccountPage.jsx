import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigation } from './context/NavigationContext'
import { useWishlist } from './context/WishlistContext'
import { useChats } from './context/ChatsContext'
import { useUserAds } from './context/UserAdsContext'
import {
  ArrowLeftIcon,
  CalendarIcon,
  ChatIcon,
  CheckIcon,
  EditIcon,
  HeartIcon,
  HelpIcon,
  LogoutIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from './components/Icons'

const SECTIONS = [
  { id: 'profile', label: 'Profile details', Icon: UserIcon },
  { id: 'settings', label: 'Account settings', Icon: SettingsIcon },
  { id: 'help', label: 'Help & support', Icon: HelpIcon },
]

const DEFAULT_SETTINGS = {
  showPhone: false,
}

function Avatar({ user, size = 64 }) {
  const initial = (user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase()
  return (
    <div className="account-avatar" style={{ width: size, height: size, fontSize: size / 2.5 }}>
      {initial}
    </div>
  )
}

function ProfileSection() {
  const { user, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [location, setLocation] = useState(user?.location || '')
  const [about, setAbout] = useState(user?.about || '')
  const [saved, setSaved] = useState(false)

  const handleSave = (e) => {
    e.preventDefault()
    updateProfile({
      fullName: fullName.trim() || user.fullName,
      phone: phone.trim(),
      location: location.trim(),
      about: about.trim(),
    })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleCancel = () => {
    setFullName(user?.fullName || '')
    setPhone(user?.phone || '')
    setLocation(user?.location || '')
    setAbout(user?.about || '')
    setEditing(false)
  }

  return (
    <section className="account-section">
      <div className="account-section-head">
        <div>
          <h2>Profile details</h2>
          <p className="account-section-sub">
            Manage how other NexDeal users see you.
          </p>
        </div>
        {!editing && (
          <button
            type="button"
            className="account-section-action"
            onClick={() => setEditing(true)}
          >
            <EditIcon size={14} /> Edit profile
          </button>
        )}
      </div>

      {saved && (
        <div className="account-toast" role="status">
          <CheckIcon size={14} /> Profile updated successfully.
        </div>
      )}

      {!editing ? (
        <div className="account-profile-view">
          <div className="account-profile-summary">
            <Avatar user={user} size={72} />
            <div>
              <h3>{user.fullName}</h3>
              <div className="account-role-line">
                <span className={`account-role-badge account-role-${user.role || 'user'}`}>
                  {user.role === 'admin'
                    ? 'Admin'
                    : user.role === 'seller'
                    ? 'Seller'
                    : 'User'}
                </span>
                {user.provider === 'google' && (
                  <span className="account-provider">via Google</span>
                )}
              </div>
              <p className="account-member">
                <CalendarIcon size={14} />
                Member since {new Date().toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <dl className="account-fields">
            <div>
              <dt><MailIcon size={14} /> Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt><PhoneIcon size={14} /> Phone</dt>
              <dd>{user.phone || <span className="account-empty">Not added</span>}</dd>
            </div>
            <div>
              <dt><PinIcon size={14} /> Location</dt>
              <dd>{user.location || <span className="account-empty">Not added</span>}</dd>
            </div>
            <div className="account-field-full">
              <dt><UserIcon size={14} /> About me</dt>
              <dd>{user.about || <span className="account-empty">Share a short bio so buyers and sellers know you.</span>}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <form className="account-form" onSubmit={handleSave}>
          <label className="auth-field">
            <span className="auth-label">Full name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Phone number</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98xxxxxx00"
              autoComplete="tel"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Location</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Area, City"
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">About me</span>
            <textarea
              rows={3}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              placeholder="Tell buyers / sellers a little about yourself."
            />
          </label>

          <div className="account-form-actions">
            <button type="button" className="auth-google" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="auth-submit">
              Save changes
            </button>
          </div>
        </form>
      )}
    </section>
  )
}

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="account-toggle">
      <span className="account-toggle-text">
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      <span
        className={`account-switch ${checked ? 'on' : ''}`}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onChange(!checked)
          }
        }}
        onClick={() => onChange(!checked)}
      >
        <span className="account-switch-thumb" />
      </span>
    </label>
  )
}

function SettingsSection() {
  const { user, updateProfile } = useAuth()
  const current = { ...DEFAULT_SETTINGS, ...(user?.settings || {}) }
  const [draft, setDraft] = useState(current)
  const [saved, setSaved] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(current)

  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }))

  const handleSave = () => {
    updateProfile({ settings: draft })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section className="account-section">
      <div className="account-section-head">
        <div>
          <h2>Account settings</h2>
          <p className="account-section-sub">
            Control what other NexDeal users can see on your profile and listings.
          </p>
        </div>
      </div>

      {saved && (
        <div className="account-toast" role="status">
          <CheckIcon size={14} /> Settings saved.
        </div>
      )}

      <div className="account-toggles">
        <Toggle
          label="Show phone number publicly"
          hint="Visible on your listings so buyers can call you directly."
          checked={draft.showPhone}
          onChange={(v) => set('showPhone', v)}
        />
      </div>

      {/* Password reset link removed (handled outside this UI). */}

      <div className="account-form-actions">
        <button
          type="button"
          className="auth-submit"
          onClick={handleSave}
          disabled={!dirty}
        >
          Save settings
        </button>
      </div>
    </section>
  )
}

function HelpSection() {
  const [openId, setOpenId] = useState(null)
  const faqs = [
    {
      id: 'sell',
      q: 'How do I post an ad on NexDeal?',
      a: 'Tap "Sell" in the header or bottom bar, fill in the details, add photos and submit. Your listing appears under My ADS immediately.',
    },
    {
      id: 'safe',
      q: 'How do I stay safe while buying?',
      a: 'Always inspect the product in person before paying. Avoid sharing OTPs and prefer cash or UPI on delivery.',
    },
    {
      id: 'edit',
      q: 'Can I edit or delete my listing?',
      a: 'Yes — go to My ADS and use Edit or Delete on any of your active listings.',
    },
    {
      id: 'price',
      q: 'How is the listing price decided?',
      a: 'Sellers set their own price. Use the budget filter on the home page to compare similar listings.',
    },
  ]

  return (
    <section className="account-section">
      <div className="account-section-head">
        <div>
          <h2>Help &amp; support</h2>
          <p className="account-section-sub">
            Common questions about buying and selling on NexDeal.
          </p>
        </div>
      </div>

      <div className="account-faq">
        {faqs.map((f) => {
          const open = openId === f.id
          return (
            <div key={f.id} className={`account-faq-item ${open ? 'open' : ''}`}>
              <button
                type="button"
                className="account-faq-q"
                onClick={() => setOpenId(open ? null : f.id)}
                aria-expanded={open}
              >
                {f.q}
                <span aria-hidden>{open ? '−' : '+'}</span>
              </button>
              {open && <div className="account-faq-a">{f.a}</div>}
            </div>
          )
        })}
      </div>

      <div className="account-card">
        <div>
          <h4>Still need help?</h4>
          <p>Send us a note and we'll reply within one business day.</p>
        </div>
        <a href="mailto:hello@laundry.example" className="auth-submit account-card-btn">
          Contact support
        </a>
      </div>
    </section>
  )
}

export default function AccountPage() {
  const { user, logout } = useAuth()
  const {
    goHome,
    goLogin,
    goMyAds,
    goWishlist,
    goChats,
    goSell,
  } = useNavigation()
  const { count: wishlistCount } = useWishlist()
  const { chats, totalUnread } = useChats()
  const chatCount = chats.length
  const { count: adsCount } = useUserAds()
  const [section, setSection] = useState('profile')

  if (!user) {
    return (
      <div className="lx-page account-page">
        <div className="lx-page-head">
          <button type="button" className="details-back" onClick={goHome}>
            <ArrowLeftIcon size={16} /> Home
          </button>
          <h1 className="lx-page-h1">My account</h1>
        </div>
        <div className="myads-empty">
          <div className="myads-empty-icon" aria-hidden>
            <UserIcon size={36} />
          </div>
          <h2>Login to access your account</h2>
          <p>
            Sign in to manage your profile, listings, wishlist and conversations.
          </p>
          <button type="button" className="auth-submit" onClick={goLogin}>
            Login or Sign up
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="lx-page account-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={goHome}>
          <ArrowLeftIcon size={16} /> Home
        </button>
        <div className="lx-page-title-row">
          <div>
            <h1 className="lx-page-h1">My account</h1>
            <p className="lx-page-sub">Welcome back, {user.fullName.split(' ')[0]}.</p>
          </div>
          <button type="button" className="myads-post" onClick={goSell}>
            <PlusIcon size={16} /> Post a new ad
          </button>
        </div>
      </div>

      <div className="account-shell">
        <aside className="account-side">
          <div className="account-side-card">
            <Avatar user={user} size={56} />
            <div className="account-side-meta">
              <strong>{user.fullName}</strong>
              <span>{user.email}</span>
              <span
                className={`account-role-badge account-role-${user.role || 'user'} account-role-pill`}
              >
                {user.role === 'admin'
                  ? 'Admin'
                  : user.role === 'seller'
                  ? 'Seller'
                  : 'User'}
              </span>
            </div>
          </div>

          <nav className="account-nav" aria-label="Account sections">
            {SECTIONS.map((s) => {
              const Icon = s.Icon
              const active = section === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`account-nav-item ${active ? 'active' : ''}`}
                  onClick={() => setSection(s.id)}
                >
                  <Icon size={16} /> {s.label}
                </button>
              )
            })}

            <div className="account-nav-sep" aria-hidden />

            <button type="button" className="account-nav-item" onClick={goMyAds}>
              <PlusIcon size={16} /> My ADS
              <span className="account-nav-badge">{adsCount}</span>
            </button>
            <button type="button" className="account-nav-item" onClick={goWishlist}>
              <HeartIcon size={16} /> Wishlist
              <span className="account-nav-badge">{wishlistCount}</span>
            </button>
            <button type="button" className="account-nav-item" onClick={goChats}>
              <ChatIcon size={16} /> Chats
              <span
                className={`account-nav-badge${
                  totalUnread > 0 ? ' account-nav-badge-alert' : ''
                }`}
              >
                {chatCount}
              </span>
            </button>

            <div className="account-nav-sep" aria-hidden />

            <button
              type="button"
              className="account-nav-item account-nav-logout"
              onClick={() => {
                logout()
                goHome()
              }}
            >
              <LogoutIcon size={16} /> Logout
            </button>
          </nav>
        </aside>

        <div className="account-content">
          {section === 'profile' && <ProfileSection />}
          {section === 'settings' && <SettingsSection />}
          {section === 'help' && <HelpSection />}
        </div>
      </div>
    </div>
  )
}
