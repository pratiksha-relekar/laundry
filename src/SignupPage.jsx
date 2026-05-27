import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigation } from './context/NavigationContext'
import {
  ArrowLeftIcon,
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
} from './components/Icons'

export default function SignupPage() {
  const { signup, loginGoogle } = useAuth()
  const { goHome, goLogin } = useNavigation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [consentModal, setConsentModal] = useState(null) // 'terms' | 'privacy' | null
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})

    if (!agreedTerms || !agreedPrivacy) {
      setErrors({
        form: 'Please accept Terms and Privacy Policy to continue.',
      })
      setSubmitting(false)
      return
    }

    const result = await signup({ fullName, email, password, confirmPassword })
    if (!result.ok) {
      setErrors({ [result.field || 'form']: result.error })
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    goHome()
  }

  const handleGoogle = async () => {
    setErrors({})
    setSubmitting(true)
    const result = await loginGoogle()
    setSubmitting(false)
    if (!result.ok) {
      setErrors({ [result.field || 'form']: result.error })
      return
    }
    goHome()
  }

  return (
    <div className="auth-page">
      <button type="button" className="details-back auth-back" onClick={goHome}>
        <ArrowLeftIcon size={16} /> Back to home
      </button>

      <div className="auth-card">
        <div className="auth-header">
          <h1>Create your account</h1>
          <p>Join Laundry to buy and sell pre-owned washing & cleaning equipment.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className={`auth-field ${errors.fullName ? 'has-error' : ''}`}>
            <span className="auth-label">Full name</span>
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Catherin Antonia"
            />
            {errors.fullName && (
              <small className="auth-error">{errors.fullName}</small>
            )}
          </label>

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
            <span className="auth-label">Password</span>
            <div className="auth-input-wrap">
              <input
                type={showPw ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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

          <label
            className={`auth-field ${errors.confirmPassword ? 'has-error' : ''}`}
          >
            <span className="auth-label">Confirm password</span>
            <div className="auth-input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                className="auth-input-toggle"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm((v) => !v)}
              >
                {showConfirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <small className="auth-error">{errors.confirmPassword}</small>
            )}
          </label>

          {errors.form && (
            <div className="auth-error auth-form-error">{errors.form}</div>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <p className="auth-terms">
          By signing up you agree to our{' '}
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => setConsentModal('terms')}
          >
            Terms
          </button>{' '}
          and{' '}
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => setConsentModal('privacy')}
          >
            Privacy Policy
          </button>
          .
        </p>

        {(agreedTerms || agreedPrivacy) && (
          <p className="auth-consent-status">
            {agreedTerms ? '✓ Terms' : 'Terms not accepted'} ·{' '}
            {agreedPrivacy ? '✓ Privacy' : 'Privacy not accepted'}
          </p>
        )}

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button type="button" className="auth-google" onClick={handleGoogle}>
          <GoogleIcon size={20} /> Continue with Google
        </button>

        <p className="auth-switch">
          Already have an account?{' '}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              goLogin()
            }}
          >
            Login
          </a>
        </p>
      </div>

      {consentModal && (
        <div
          className="auth-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Terms and privacy"
          onClick={() => setConsentModal(null)}
        >
          <div
            className="auth-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="auth-modal-head">
              <h2 className="auth-modal-title">
                {consentModal === 'terms' ? 'Terms' : 'Privacy Policy'}
              </h2>
              <button
                type="button"
                className="auth-modal-close"
                aria-label="Close"
                onClick={() => setConsentModal(null)}
              >
                ×
              </button>
            </div>

            <div className="auth-modal-body">
              <p className="auth-modal-text">
                {consentModal === 'terms'
                  ? 'This is a demo Terms of Service screen. In production, link to your real Terms page.'
                  : 'This is a demo Privacy Policy screen. In production, link to your real Privacy page.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label className="auth-modal-check">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                  />
                  <span>I agree to the Terms</span>
                </label>
                <label className="auth-modal-check">
                  <input
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                  />
                  <span>I agree to the Privacy Policy</span>
                </label>
              </div>
            </div>

            <div className="auth-modal-actions">
              <button
                type="button"
                className="auth-submit"
                onClick={() => setConsentModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
