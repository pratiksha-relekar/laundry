import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import AdminPagination from './AdminPagination'
import { deleteUserProfile, subscribeToUsers } from '../auth/users'
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  MailIcon,
  PackageIcon,
  PinIcon,
  PhoneIcon,
  SearchIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
  VerifiedIcon,
} from '../components/Icons'

// =====================================================================
// AdminUsersPage
// ---------------------------------------------------------------------
// Lists every account stored in Firestore (`users/{uid}` collection).
// The table reacts in real time via `onSnapshot`, so newly registered
// accounts show up without a refresh. For each user we still pull the
// personal ads bucket (`laundry:userAds:<id>`) from localStorage —
// that's a separate, ad-only data source that lives client-side.
//
// Features:
//   • Search by name / email / phone
//   • Provider filter (All / Email / Google)
//   • Windowed pagination via <AdminPagination>
//   • A details modal with the full record + ad thumbnails
//   • Safe deletion (removes the Firestore profile + the ads bucket;
//     the underlying Firebase Auth account can only be deleted with
//     the Admin SDK so it lingers until removed server-side)
// =====================================================================

const PAGE_SIZE = 8

function readUserAds(userId) {
  if (!userId || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(`laundry:userAds:${userId}`)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function removeUserAds(userId) {
  try {
    window.localStorage.removeItem(`laundry:userAds:${userId}`)
  } catch {
    /* ignore */
  }
}

function initial(user) {
  return (user.fullName || user.email || 'U')
    .toString()
    .trim()
    .charAt(0)
    .toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [usersError, setUsersError] = useState(null)
  const [query, setQuery] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState(null)

  // Live Firestore subscription — emits every time a user is added,
  // updated or removed.
  useEffect(() => {
    const unsubscribe = subscribeToUsers(
      (list) => {
        setUsers(list)
        setUsersLoading(false)
        setUsersError(null)
      },
      (err) => {
        setUsersError(err?.message || 'Failed to load users from Firestore.')
        setUsersLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  // Enrich every user record with their live ad count + ads list so the
  // table and the modal can share the same lookup.
  const enrichedUsers = useMemo(() => {
    return users.map((u) => {
      const ads = readUserAds(u.id)
      return { ...u, ads, adsCount: ads.length }
    })
  }, [users])

  const totalEmail = useMemo(
    () => enrichedUsers.filter((u) => (u.provider || 'email') === 'email').length,
    [enrichedUsers]
  )
  const totalGoogle = useMemo(
    () => enrichedUsers.filter((u) => u.provider === 'google').length,
    [enrichedUsers]
  )
  const totalAds = useMemo(
    () => enrichedUsers.reduce((sum, u) => sum + u.adsCount, 0),
    [enrichedUsers]
  )

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase()
    return enrichedUsers.filter((u) => {
      const prov = u.provider || 'email'
      if (providerFilter !== 'all' && prov !== providerFilter) return false
      if (!q) return true
      return (
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.phone || '').toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q)
      )
    })
  }, [enrichedUsers, query, providerFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedUsers = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredUsers.slice(start, start + PAGE_SIZE)
  }, [filteredUsers, safePage])

  const handleQueryChange = useCallback((value) => {
    setQuery(value)
    setPage(1)
  }, [])

  const handleProviderChange = useCallback((value) => {
    setProviderFilter(value)
    setPage(1)
  }, [])

  const handleDelete = useCallback(async (user) => {
    if (
      !window.confirm(
        `Permanently delete ${user.fullName || user.email}?\n\nThis removes the Firestore profile + their posted ads. The Firebase Auth account itself can only be deleted server-side.`
      )
    ) {
      return
    }
    // Optimistic removal — the snapshot listener will reconcile.
    setSelectedUser((prev) => (prev?.id === user.id ? null : prev))
    removeUserAds(user.id)
    try {
      await deleteUserProfile(user.id)
    } catch (err) {
      window.alert(
        `Failed to delete user: ${err?.message || 'Firestore write failed.'}`
      )
    }
  }, [])

  return (
    <AdminLayout
      title="Users"
      subtitle="Every account registered on the Laundry marketplace."
    >
      <section className="admin-stats">
        <StatCard
          icon={UsersIcon}
          label="Total users"
          value={users.length.toLocaleString('en-IN')}
          trend="across all sessions"
          tone="brand"
        />
        <StatCard
          icon={MailIcon}
          label="Email signups"
          value={totalEmail.toLocaleString('en-IN')}
          trend={`${
            users.length > 0
              ? Math.round((totalEmail / users.length) * 100)
              : 0
          }% of total`}
          tone="violet"
        />
        <StatCard
          icon={ShieldIcon}
          label="Google signups"
          value={totalGoogle.toLocaleString('en-IN')}
          trend="OAuth provider"
          tone="amber"
        />
        <StatCard
          icon={PackageIcon}
          label="Ads posted"
          value={totalAds.toLocaleString('en-IN')}
          trend="across every user"
          tone="green"
        />
      </section>

      <div className="admin-toolbar">
        <div className="admin-toolbar-titles">
          <h2 className="admin-toolbar-heading">Registered accounts</h2>
          <p className="admin-toolbar-helper">
            {filteredUsers.length.toLocaleString('en-IN')} matching account
            {filteredUsers.length === 1 ? '' : 's'}
          </p>
        </div>

        <div className="admin-toolbar-actions">
          <label className="admin-search">
            <SearchIcon size={16} />
            <input
              type="text"
              placeholder="Search by name, email, phone or city…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
            />
            {query && (
              <button
                type="button"
                className="admin-search-clear"
                onClick={() => handleQueryChange('')}
                aria-label="Clear search"
              >
                <CloseIcon size={14} />
              </button>
            )}
          </label>

          <select
            className="admin-select"
            value={providerFilter}
            onChange={(e) => handleProviderChange(e.target.value)}
            aria-label="Filter by provider"
          >
            <option value="all">All providers</option>
            <option value="email">Email</option>
            <option value="google">Google</option>
          </select>
        </div>
      </div>

      <div className="admin-card admin-card-flush">
        {usersLoading ? (
          <div className="admin-empty admin-empty-lg">
            <UsersIcon size={28} />
            <p>Loading users from Firestore…</p>
          </div>
        ) : usersError ? (
          <div className="admin-empty admin-empty-lg">
            <UsersIcon size={28} />
            <p>Couldn’t load users — {usersError}</p>
          </div>
        ) : pagedUsers.length === 0 ? (
          <div className="admin-empty admin-empty-lg">
            <UsersIcon size={28} />
            <p>
              {users.length === 0
                ? 'No registered users yet — the table will populate as people sign up.'
                : 'No users match the current filters.'}
            </p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Provider</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Ads</th>
                  <th>Joined</th>
                  <th className="admin-table-actions-head">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <button
                        type="button"
                        className="admin-user-cell"
                        onClick={() => setSelectedUser(u)}
                      >
                        <span className="admin-user-avatar-lg">
                          {initial(u)}
                        </span>
                        <span className="admin-user-cell-meta">
                          <span className="admin-user-cell-name">
                            {u.fullName || 'Unnamed user'}
                            {u.provider === 'google' && (
                              <VerifiedIcon size={12} className="admin-user-cell-verified" />
                            )}
                          </span>
                          <span className="admin-user-cell-email">{u.email}</span>
                        </span>
                      </button>
                    </td>
                    <td>
                      <ProviderBadge provider={u.provider} />
                    </td>
                    <td className="admin-user-contact">
                      {u.phone ? (
                        <span className="admin-user-contact-row">
                          <PhoneIcon size={12} /> {u.phone}
                        </span>
                      ) : (
                        <span className="admin-user-muted">No phone</span>
                      )}
                    </td>
                    <td>
                      {u.location ? (
                        <span className="admin-user-contact-row">
                          <PinIcon size={12} /> {u.location}
                        </span>
                      ) : (
                        <span className="admin-user-muted">—</span>
                      )}
                    </td>
                    <td>
                      <span className="admin-chip admin-chip-soft">
                        <PackageIcon size={12} /> {u.adsCount}
                      </span>
                    </td>
                    <td className="admin-user-joined">{formatDate(u.createdAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn-sm"
                          title="View details"
                          aria-label="View details"
                          onClick={() => setSelectedUser(u)}
                        >
                          <UserIcon size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn-sm admin-icon-btn-danger"
                          title="Delete user"
                          aria-label="Delete user"
                          onClick={() => handleDelete(u)}
                        >
                          <TrashIcon size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <AdminPagination
          page={safePage}
          totalPages={totalPages}
          totalCount={filteredUsers.length}
          pageSize={PAGE_SIZE}
          onPage={setPage}
        />
      </div>

      {selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={() => handleDelete(selectedUser)}
        />
      )}
    </AdminLayout>
  )
}

/* -------------------------------------------------------------------- */
/*  Stat card (matches the dashboard's stat row)                          */
/* -------------------------------------------------------------------- */

function StatCard({ icon: Icon, label, value, trend, tone = 'brand' }) {
  return (
    <div className={`admin-stat admin-stat-${tone}`}>
      <span className="admin-stat-icon">
        <Icon size={22} />
      </span>
      <div className="admin-stat-body">
        <span className="admin-stat-label">{label}</span>
        <span className="admin-stat-value">{value}</span>
        {trend && (
          <span className="admin-stat-trend admin-stat-trend-muted">
            <CheckIcon size={14} /> {trend}
          </span>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Provider badge                                                       */
/* -------------------------------------------------------------------- */

function ProviderBadge({ provider }) {
  const p = provider || 'email'
  return (
    <span className={`admin-provider admin-provider-${p}`}>
      {p === 'google' ? 'Google' : 'Email'}
    </span>
  )
}

/* -------------------------------------------------------------------- */
/*  User detail modal                                                    */
/* -------------------------------------------------------------------- */

function UserDetailModal({ user, onClose, onDelete }) {
  return (
    <div
      className="admin-modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="admin-modal admin-modal-wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <div className="admin-modal-user-head">
            <span className="admin-user-avatar-xl">{initial(user)}</span>
            <div>
              <h2>{user.fullName || 'Unnamed user'}</h2>
              <p className="admin-modal-user-sub">
                <MailIcon size={12} /> {user.email}{' '}
                <ProviderBadge provider={user.provider} />
              </p>
            </div>
          </div>
          <button
            type="button"
            className="admin-icon-btn admin-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        <div className="admin-modal-body">
          <dl className="admin-detail-grid">
            <DetailRow icon={UserIcon} label="User ID" value={user.id} mono />
            <DetailRow
              icon={PhoneIcon}
              label="Phone"
              value={user.phone || '—'}
            />
            <DetailRow
              icon={PinIcon}
              label="Location"
              value={user.location || '—'}
            />
            <DetailRow
              icon={CalendarIcon}
              label="Joined"
              value={formatDate(user.createdAt)}
            />
          </dl>

          {user.about && (
            <div className="admin-detail-about">
              <span className="admin-field-label">About</span>
              <p>{user.about}</p>
            </div>
          )}

          <div className="admin-detail-ads">
            <div className="admin-card-head">
              <h2>
                Ads posted{' '}
                <span className="admin-tab-count">{user.adsCount}</span>
              </h2>
              <p>Listings submitted from this account.</p>
            </div>

            {user.ads.length === 0 ? (
              <div className="admin-empty">
                This user hasn’t posted any ads yet.
              </div>
            ) : (
              <ul className="admin-recent-list">
                {user.ads.slice(0, 6).map((ad) => (
                  <li key={ad.id} className="admin-recent-row">
                    <span
                      className="admin-recent-thumb"
                      style={
                        ad.image
                          ? { backgroundImage: `url(${ad.image})` }
                          : undefined
                      }
                    />
                    <div className="admin-recent-meta">
                      <span className="admin-recent-title">{ad.title}</span>
                      <span className="admin-recent-sub">
                        {ad.location || '—'}
                      </span>
                    </div>
                    <span className="admin-recent-price">
                      ₹{Number(ad.price || 0).toLocaleString('en-IN')}
                    </span>
                    <span
                      className={`admin-badge admin-badge-${ad.status || 'active'}`}
                    >
                      {ad.status || 'active'}
                    </span>
                  </li>
                ))}
                {user.ads.length > 6 && (
                  <li className="admin-detail-ads-more">
                    +{user.ads.length - 6} more ads…
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="admin-modal-actions admin-modal-actions-split">
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            onClick={onDelete}
          >
            <TrashIcon size={14} />
            Delete user
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Detail row inside the modal                                          */
/* -------------------------------------------------------------------- */

function DetailRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="admin-detail-row">
      <dt>
        <Icon size={14} /> {label}
      </dt>
      <dd className={mono ? 'is-mono' : undefined}>{value}</dd>
    </div>
  )
}
