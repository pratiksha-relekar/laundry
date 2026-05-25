import { useAdmin } from '../context/AdminContext'
import { useNavigation } from '../context/NavigationContext'
import { useTheme } from '../context/ThemeContext'
import AdminLogo, { AdminWordmark } from '../admin/AdminLogo'
import {
  BarChartIcon,
  GridIcon,
  LogoutIcon,
  MoonIcon,
  PackageIcon,
  SettingsIcon,
  StarIcon,
  SunIcon,
  UsersIcon,
} from './Icons'

// Sidebar entries. `view` is the NavigationContext view this item
// activates. Items that haven't been wired up yet are marked `soon`
// and render as disabled — the user has said additional pages are
// coming after this dashboard.
const NAV_ITEMS = [
  { key: 'admin-dashboard', label: 'Dashboard', icon: GridIcon },
  { key: 'admin-products', label: 'Products', icon: PackageIcon },
  { key: 'admin-users', label: 'Users', icon: UsersIcon },
  { key: 'admin-reviews', label: 'Reviews', icon: StarIcon },
  { key: 'admin-analytics', label: 'Analytics', icon: BarChartIcon },
  { key: 'admin-settings', label: 'Settings', icon: SettingsIcon },
]

export default function AdminLayout({ title, subtitle, children }) {
  const { admin, profile, logout } = useAdmin()
  const displayName = profile?.name || admin?.name || 'Admin'
  const displayRole = profile?.role || 'Super admin'
  const avatarInitial = (displayName || 'A').trim().charAt(0).toUpperCase()
  const {
    view,
    goAdminDashboard,
    goAdminProducts,
    goAdminUsers,
    goAdminReviews,
    goAdminAnalytics,
    goAdminSettings,
    goLogin,
  } = useNavigation()
  const { isDark, toggleTheme } = useTheme()

  const handleLogout = () => {
    logout()
    goLogin()
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <button
          type="button"
          className="admin-brand admin-brand-olx"
          onClick={goAdminDashboard}
          aria-label="Admin home"
        >
          <AdminLogo size={40} className="admin-brand-logo" />
          <AdminWordmark />
        </button>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = item.key === view
            const isDisabled = !!item.soon
            return (
              <button
                key={item.key}
                type="button"
                className={`admin-nav-item ${isActive ? 'is-active' : ''} ${
                  isDisabled ? 'is-disabled' : ''
                }`}
                onClick={() => {
                  if (isDisabled) return
                  if (item.key === 'admin-dashboard') goAdminDashboard()
                  else if (item.key === 'admin-products') goAdminProducts()
                  else if (item.key === 'admin-users') goAdminUsers()
                  else if (item.key === 'admin-reviews') goAdminReviews()
                  else if (item.key === 'admin-analytics') goAdminAnalytics()
                  else if (item.key === 'admin-settings') goAdminSettings()
                }}
                aria-disabled={isDisabled}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {isDisabled && <span className="admin-nav-soon">Soon</span>}
              </button>
            )
          })}
        </nav>

        <div className="admin-sidebar-foot">
          <button
            type="button"
            className="admin-nav-item admin-nav-logout"
            onClick={handleLogout}
          >
            <LogoutIcon size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="admin-main-wrap">
        <header className="admin-topbar">
          <div className="admin-topbar-titles">
            <h1 className="admin-topbar-title">{title}</h1>
            {subtitle && <p className="admin-topbar-sub">{subtitle}</p>}
          </div>

          <div className="admin-topbar-actions">
            <button
              type="button"
              className="admin-icon-btn"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            <button
              type="button"
              className="admin-user admin-user-btn"
              onClick={goAdminSettings}
              aria-label="Open admin settings"
              title="Open settings"
            >
              <span className="admin-user-avatar">{avatarInitial}</span>
              <span className="admin-user-meta">
                <span className="admin-user-name">{displayName}</span>
                <span className="admin-user-role">{displayRole}</span>
              </span>
            </button>
          </div>
        </header>

        <main className="admin-content">{children}</main>
      </div>
    </div>
  )
}
