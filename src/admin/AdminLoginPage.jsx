import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'
import { useNavigation } from '../context/NavigationContext'
import AdminLogo from './AdminLogo'
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
} from '../components/Icons'

export default function AdminLoginPage() {
  const { login } = useAdmin()
  const { goLogin, goAdminDashboard } = useNavigation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    const result = login({ username, password })
    if (!result.ok) {
      setErrors({ [result.field || 'form']: result.error })
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    goAdminDashboard()
  }

  return (
    <div className="auth-page admin-auth-page">
      <button type="button" className="details-back auth-back" onClick={goLogin}>
        <ArrowLeftIcon size={16} /> Back to user login
      </button>

      <div className="auth-card admin-auth-card">
        <div className="admin-auth-logo">
          <AdminLogo size={56} />
        </div>

        <div className="auth-header">
          <h1>Admin Sign In</h1>
          <p>Restricted area · authorised staff only.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className={`auth-field ${errors.username ? 'has-error' : ''}`}>
            <span className="auth-label">Username</span>
            <input
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
            />
            {errors.username && (
              <small className="auth-error">{errors.username}</small>
            )}
          </label>

          <label className={`auth-field ${errors.password ? 'has-error' : ''}`}>
            <span className="auth-label">Password</span>
            <div className="auth-input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                aria-label={showPw ? 'Hide password' : 'Show password'}
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.password && (
              <small className="auth-error">{errors.password}</small>
            )}
          </label>

          {errors.form && (
            <div className="auth-error auth-form-error">{errors.form}</div>
          )}

          <button
            type="submit"
            className="auth-submit admin-auth-submit"
            disabled={submitting}
          >
            {submitting ? 'Signing in…' : 'Submit'}
          </button>
        </form>

        <p className="auth-switch admin-auth-hint">
          Demo credentials · username <strong>admin</strong> · password{' '}
          <strong>admin123</strong>
        </p>
      </div>
    </div>
  )
}
