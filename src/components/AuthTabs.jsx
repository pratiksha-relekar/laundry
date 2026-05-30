import { useNavigation } from '../context/NavigationContext'

export default function AuthTabs() {
  const { view, goLogin, goSignup } = useNavigation()
  const onLogin = view === 'login'
  const onSignup = view === 'signup'

  return (
    <div className="auth-tabs" role="tablist" aria-label="Authentication">
      <button
        type="button"
        role="tab"
        aria-selected={onLogin}
        className={`auth-tab ${onLogin ? 'is-active' : ''}`}
        onClick={goLogin}
      >
        Login
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={onSignup}
        className={`auth-tab ${onSignup ? 'is-active' : ''}`}
        onClick={goSignup}
      >
        Sign up
      </button>
    </div>
  )
}
