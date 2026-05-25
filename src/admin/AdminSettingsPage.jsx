import { useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import AdminLogo from './AdminLogo'
import { useAdmin } from '../context/AdminContext'
import { useNavigation } from '../context/NavigationContext'
import { useTheme } from '../context/ThemeContext'
import {
  CalendarIcon,
  CheckIcon,
  EditIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  LogoutIcon,
  MailIcon,
  MoonIcon,
  ShieldIcon,
  SunIcon,
  UserIcon,
} from '../components/Icons'

// =====================================================================
// AdminSettingsPage
// ---------------------------------------------------------------------
// Account management for the signed-in admin. Three sections:
//   1. Admin profile     — edit display name & contact email
//   2. Change password   — full validation + show/hide toggles
//   3. Appearance        — light / dark theme switch (with preview)
//   4. Session           — last login + sign-out button
//
// Everything uses the existing admin form / card classes so the page
// inherits the same look as the rest of the panel and reacts to the
// theme toggle automatically.
// =====================================================================

function formatDateTime(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function initial(value) {
  return (value || 'A').toString().trim().charAt(0).toUpperCase()
}

export default function AdminSettingsPage() {
  const {
    admin,
    profile,
    defaultUsername,
    isUsingDefaultPassword,
    updateProfile,
    changePassword,
    logout,
  } = useAdmin()
  const { goLogin } = useNavigation()

  const handleSignOut = () => {
    logout()
    goLogin()
  }

  return (
    <AdminLayout
      title="Settings"
      subtitle="Update your admin profile, change your password and tweak preferences."
    >
      <div className="admin-settings">
        <ProfileCard
          admin={admin}
          profile={profile}
          defaultUsername={defaultUsername}
          onSave={updateProfile}
        />

        <PasswordCard
          isUsingDefaultPassword={isUsingDefaultPassword}
          onChange={changePassword}
        />

        <AppearanceCard />

        <SessionCard admin={admin} onSignOut={handleSignOut} />
      </div>
    </AdminLayout>
  )
}

/* -------------------------------------------------------------------- */
/*  Profile card                                                         */
/* -------------------------------------------------------------------- */

function ProfileCard({ admin, profile, defaultUsername, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: profile.name || '',
    email: profile.email || '',
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const startEdit = () => {
    setForm({ name: profile.name || '', email: profile.email || '' })
    setErrors({})
    setMessage(null)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setErrors({})
    setMessage(null)
  }

  const submit = (e) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)
    const result = onSave({
      name: form.name,
      email: form.email,
    })
    if (!result.ok) {
      setErrors({ [result.field || 'form']: result.error })
      return
    }
    setEditing(false)
    setMessage({ kind: 'success', text: 'Profile updated successfully.' })
  }

  return (
    <section className="admin-card admin-settings-card">
      <div className="admin-card-head admin-card-head-row">
        <div>
          <h2>Admin profile</h2>
          <p>Your name and contact email used across the admin panel.</p>
        </div>
        {!editing && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary admin-btn-sm"
            onClick={startEdit}
          >
            <EditIcon size={14} />
            Edit profile
          </button>
        )}
      </div>

      <div className="admin-profile-head">
        <span className="admin-user-avatar-xl">{initial(profile.name)}</span>
        <div className="admin-profile-head-meta">
          <span className="admin-profile-head-name">
            {profile.name || 'Administrator'}
          </span>
          <span className="admin-profile-head-role">
            <ShieldIcon size={12} /> {profile.role || 'Super admin'}
          </span>
        </div>
        <div className="admin-profile-head-logo">
          <AdminLogo size={56} />
        </div>
      </div>

      {message && (
        <div
          className={`admin-form-${message.kind === 'success' ? 'success' : 'error'} admin-form-toast`}
        >
          <CheckIcon size={14} />
          <span>{message.text}</span>
        </div>
      )}

      {editing ? (
        <form className="admin-form" onSubmit={submit} noValidate>
          <div className="admin-form-row">
            <Field label="Display name" error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={update('name')}
                placeholder="Administrator"
                autoFocus
              />
            </Field>
            <Field label="Contact email" error={errors.email}>
              <input
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="admin@laundry.app"
                autoComplete="email"
              />
            </Field>
          </div>

          {errors.form && (
            <div className="admin-form-error admin-form-toast">
              <span>{errors.form}</span>
            </div>
          )}

          <div className="admin-modal-actions admin-modal-actions-split">
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={cancelEdit}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary">
              <CheckIcon size={14} />
              Save changes
            </button>
          </div>
        </form>
      ) : (
        <dl className="admin-detail-grid admin-profile-grid">
          <DetailRow
            icon={UserIcon}
            label="Username"
            value={admin?.username || defaultUsername}
            mono
            hint="Username cannot be changed"
          />
          <DetailRow
            icon={UserIcon}
            label="Display name"
            value={profile.name || 'Administrator'}
          />
          <DetailRow
            icon={MailIcon}
            label="Contact email"
            value={profile.email || '—'}
          />
          <DetailRow
            icon={ShieldIcon}
            label="Role"
            value={profile.role || 'Super admin'}
          />
        </dl>
      )}
    </section>
  )
}

/* -------------------------------------------------------------------- */
/*  Change password card                                                 */
/* -------------------------------------------------------------------- */

function PasswordCard({ isUsingDefaultPassword, onChange }) {
  const [form, setForm] = useState({
    current: '',
    next: '',
    confirm: '',
  })
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const toggleShow = (field) => () =>
    setShow((s) => ({ ...s, [field]: !s[field] }))

  const submit = (e) => {
    e.preventDefault()
    setErrors({})
    setMessage(null)
    setSubmitting(true)
    const result = onChange({
      current: form.current,
      next: form.next,
      confirm: form.confirm,
    })
    if (!result.ok) {
      setErrors({ [result.field || 'form']: result.error })
      setSubmitting(false)
      return
    }
    setForm({ current: '', next: '', confirm: '' })
    setShow({ current: false, next: false, confirm: false })
    setMessage({
      kind: 'success',
      text: 'Password updated. Use your new password the next time you sign in.',
    })
    setSubmitting(false)
  }

  // Tiny strength indicator — purely visual feedback.
  const strength = computeStrength(form.next)

  return (
    <section className="admin-card admin-settings-card">
      <div className="admin-card-head">
        <h2>Change password</h2>
        <p>
          Pick a new password — at least 6 characters and different from your
          current one.
        </p>
      </div>

      {isUsingDefaultPassword && (
        <div className="admin-warning-banner">
          <LockIcon size={14} />
          <span>
            You’re still using the default password (<strong>admin123</strong>).
            Change it now to secure the admin panel.
          </span>
        </div>
      )}

      {message && (
        <div className="admin-form-success admin-form-toast">
          <CheckIcon size={14} />
          <span>{message.text}</span>
        </div>
      )}

      <form className="admin-form" onSubmit={submit} noValidate autoComplete="off">
        <Field label="Current password" error={errors.current}>
          <PasswordInput
            value={form.current}
            onChange={update('current')}
            show={show.current}
            onToggle={toggleShow('current')}
            placeholder="Enter your current password"
            autoComplete="current-password"
          />
        </Field>

        <div className="admin-form-row">
          <Field label="New password" error={errors.next}>
            <PasswordInput
              value={form.next}
              onChange={update('next')}
              show={show.next}
              onToggle={toggleShow('next')}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
            {form.next && (
              <PasswordStrength strength={strength} />
            )}
          </Field>
          <Field label="Confirm new password" error={errors.confirm}>
            <PasswordInput
              value={form.confirm}
              onChange={update('confirm')}
              show={show.confirm}
              onToggle={toggleShow('confirm')}
              placeholder="Re-enter the new password"
              autoComplete="new-password"
            />
          </Field>
        </div>

        {errors.form && (
          <div className="admin-form-error admin-form-toast">
            <span>{errors.form}</span>
          </div>
        )}

        <div className="admin-modal-actions">
          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            disabled={submitting}
          >
            <LockIcon size={14} />
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </section>
  )
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  autoComplete,
}) {
  return (
    <div className="auth-input-wrap">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className="auth-input-toggle"
        onClick={onToggle}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        {show ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
      </button>
    </div>
  )
}

function computeStrength(value) {
  if (!value) return { score: 0, label: '' }
  let score = 0
  if (value.length >= 6) score++
  if (value.length >= 10) score++
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const label =
    score <= 1
      ? 'Weak'
      : score <= 2
      ? 'Fair'
      : score <= 3
      ? 'Good'
      : 'Strong'
  return { score, label }
}

function PasswordStrength({ strength }) {
  const tone =
    strength.score <= 1
      ? 'weak'
      : strength.score <= 2
      ? 'fair'
      : strength.score <= 3
      ? 'good'
      : 'strong'
  const pct = Math.min(100, (strength.score / 5) * 100)
  return (
    <div className={`admin-strength admin-strength-${tone}`}>
      <span className="admin-strength-bar">
        <span
          className="admin-strength-bar-fill"
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="admin-strength-label">{strength.label}</span>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/*  Appearance card                                                      */
/* -------------------------------------------------------------------- */

function AppearanceCard() {
  const { isDark, toggleTheme } = useTheme()

  return (
    <section className="admin-card admin-settings-card">
      <div className="admin-card-head">
        <h2>Appearance</h2>
        <p>Switch between light and dark themes — applies everywhere.</p>
      </div>

      <div className="admin-theme-row">
        <button
          type="button"
          className={`admin-theme-option ${!isDark ? 'is-active' : ''}`}
          onClick={() => {
            if (isDark) toggleTheme()
          }}
          aria-pressed={!isDark}
        >
          <span className="admin-theme-preview admin-theme-preview-light">
            <span className="admin-theme-preview-bar" />
            <span className="admin-theme-preview-block" />
            <span className="admin-theme-preview-block" />
          </span>
          <span className="admin-theme-option-meta">
            <span className="admin-theme-option-title">
              <SunIcon size={14} /> Light
            </span>
            <span className="admin-theme-option-sub">
              Default · clean &amp; bright
            </span>
          </span>
          {!isDark && <CheckIcon size={16} className="admin-theme-check" />}
        </button>

        <button
          type="button"
          className={`admin-theme-option ${isDark ? 'is-active' : ''}`}
          onClick={() => {
            if (!isDark) toggleTheme()
          }}
          aria-pressed={isDark}
        >
          <span className="admin-theme-preview admin-theme-preview-dark">
            <span className="admin-theme-preview-bar" />
            <span className="admin-theme-preview-block" />
            <span className="admin-theme-preview-block" />
          </span>
          <span className="admin-theme-option-meta">
            <span className="admin-theme-option-title">
              <MoonIcon size={14} /> Dark
            </span>
            <span className="admin-theme-option-sub">
              Easier on the eyes at night
            </span>
          </span>
          {isDark && <CheckIcon size={16} className="admin-theme-check" />}
        </button>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------- */
/*  Session card                                                         */
/* -------------------------------------------------------------------- */

function SessionCard({ admin, onSignOut }) {
  return (
    <section className="admin-card admin-settings-card">
      <div className="admin-card-head admin-card-head-row">
        <div>
          <h2>Session</h2>
          <p>Current admin session details.</p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn-danger admin-btn-sm"
          onClick={onSignOut}
        >
          <LogoutIcon size={14} />
          Sign out
        </button>
      </div>

      <dl className="admin-detail-grid admin-profile-grid">
        <DetailRow
          icon={CalendarIcon}
          label="Logged in since"
          value={formatDateTime(admin?.loggedInAt)}
        />
        <DetailRow
          icon={UserIcon}
          label="Signed in as"
          value={admin?.username || '—'}
          mono
        />
      </dl>
    </section>
  )
}

/* -------------------------------------------------------------------- */
/*  Helpers                                                              */
/* -------------------------------------------------------------------- */

function DetailRow({ icon: Icon, label, value, mono, hint }) {
  return (
    <div className="admin-detail-row">
      <dt>
        <Icon size={14} /> {label}
      </dt>
      <dd className={mono ? 'is-mono' : undefined}>{value}</dd>
      {hint && <small className="admin-field-hint">{hint}</small>}
    </div>
  )
}

function Field({ label, error, hint, children }) {
  return (
    <label className={`admin-field ${error ? 'has-error' : ''}`}>
      <span className="admin-field-label">{label}</span>
      {children}
      {hint && !error && <small className="admin-field-hint">{hint}</small>}
      {error && <small className="admin-field-error">{error}</small>}
    </label>
  )
}
