import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigation } from './context/NavigationContext'
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  ShieldIcon,
} from './components/Icons'

export default function LoginPage() {
  const { login, loginGoogle } = useAuth()
  const { goHome, goSignup, goAdminLogin } = useNavigation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    const result = login({ email, password })
    if (!result.ok) {
      setErrors({ [result.field || 'form']: result.error })
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    goHome()
  }

  const handleGoogle = () => {
    setErrors({})
    loginGoogle()
    goHome()
  }

  return (
    <div className="auth-page">
      <button type="button" className="details-back auth-back" onClick={goHome}>
        <ArrowLeftIcon size={16} /> Back to home
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome back</h1>
          <p>Login to your Laundry account to buy and sell appliances.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className={`auth-field ${errors.email ? 'has-error' : ''}`}>
            <span className="auth-label">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {errors.email && <small className="auth-error">{errors.email}</small>}
          </label>

          <label className={`auth-field ${errors.password ? 'has-error' : ''}`}>
            <span className="auth-label">
              Password
              <a
                href="#"
                className="auth-forgot"
                onClick={(e) => e.preventDefault()}
              >
                Forgot password?
              </a>
            </span>
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

          {errors.form && <div className="auth-error auth-form-error">{errors.form}</div>}

          <button
            type="submit"
            className="auth-submit"
            disabled={submitting}
          >
            {submitting ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="auth-google"
          onClick={handleGoogle}
        >
          <GoogleIcon size={20} /> Continue with Google
        </button>

        <button
          type="button"
          className="auth-admin"
          onClick={goAdminLogin}
        >
          <ShieldIcon size={18} /> Login as Admin
        </button>

        <p className="auth-switch">
          Don't have an account?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              goSignup()
            }}
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
