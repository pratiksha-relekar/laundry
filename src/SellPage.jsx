import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useNavigation } from './context/NavigationContext'
import { useUserAds } from './context/UserAdsContext'
import AdListingForm from './components/AdListingForm'
import {
  ArrowLeftIcon,
  CheckIcon,
  PackageIcon,
  ShieldIcon,
  UserIcon,
} from './components/Icons'

function BecomeSellerPrompt({ user, onUpgrade, onBack, upgrading, error }) {
  return (
    <div className="lx-page sell-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={onBack}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>
        <h1 className="lx-page-h1">Become a seller</h1>
      </div>

      <div className="seller-onboarding">
        <div className="seller-onboarding-icon" aria-hidden>
          <PackageIcon size={36} />
        </div>
        <h2>Unlock seller privileges</h2>
        <p>
          Your account <strong>{user?.email}</strong> is currently a
          <em> user</em>. Upgrade to a <strong>seller</strong> account to
          list products on the NexDeal marketplace. You can continue to
          buy and chat just like before.
        </p>
        <ul className="seller-onboarding-list">
          <li>
            <CheckIcon size={14} /> List unlimited used laundry equipment
          </li>
          <li>
            <CheckIcon size={14} /> Manage your ads &amp; chats in one place
          </li>
          <li>
            <CheckIcon size={14} /> Free forever — no listing fees
          </li>
        </ul>

        {error && (
          <div className="auth-error auth-form-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="button"
          className="auth-submit seller-onboarding-cta"
          onClick={onUpgrade}
          disabled={upgrading}
        >
          {upgrading ? 'Upgrading…' : 'Upgrade to seller account'}
        </button>
        <p className="seller-onboarding-note">
          <ShieldIcon size={12} /> Admin can promote or demote roles at any
          time from the admin Users page.
        </p>
      </div>
    </div>
  )
}

function SellLoginPrompt({ onLogin, onBack }) {
  return (
    <div className="lx-page sell-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={onBack}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>
        <h1 className="lx-page-h1">Sell on NexDeal</h1>
      </div>

      <div className="seller-onboarding">
        <div className="seller-onboarding-icon" aria-hidden>
          <UserIcon size={36} />
        </div>
        <h2>Become a seller in 60 seconds</h2>
        <p>
          Login or create your free NexDeal account to post listings, chat with
          buyers and manage your ads from one place.
        </p>
        <ul className="seller-onboarding-list">
          <li><CheckIcon size={14} /> Reach thousands of buyers across India</li>
          <li><CheckIcon size={14} /> No listing fees, no commission</li>
          <li><CheckIcon size={14} /> Verified user badge for trusted sellers</li>
        </ul>
        <button type="button" className="auth-submit seller-onboarding-cta" onClick={onLogin}>
          Login to continue
        </button>
      </div>
    </div>
  )
}

export default function SellPage() {
  const { user, isSeller, becomeSeller } = useAuth()
  const { goHome, goLogin, goMyAds } = useNavigation()
  const { postAd } = useUserAds()
  const [upgrading, setUpgrading] = useState(false)
  const [upgradeError, setUpgradeError] = useState('')
  const [posted, setPosted] = useState(false)

  const handleUpgrade = async () => {
    setUpgradeError('')
    setUpgrading(true)
    const result = await becomeSeller()
    setUpgrading(false)
    if (!result.ok) {
      setUpgradeError(result.error || 'Could not upgrade your account.')
    }
  }

  if (!user) {
    return <SellLoginPrompt onLogin={goLogin} onBack={goHome} />
  }

  if (!isSeller) {
    return (
      <BecomeSellerPrompt
        user={user}
        onUpgrade={handleUpgrade}
        onBack={goHome}
        upgrading={upgrading}
        error={upgradeError}
      />
    )
  }

  const handleSubmit = async (data) => {
    const phone = data.phone
    await postAd({
      ...data,
      seller: {
        id: user.id,
        name: user.fullName,
        memberSince: 'Today',
        itemsListed: 1,
        phoneMasked: phone
          ? phone.replace(/\d(?=\d{4})/g, 'x')
          : '+91 9xxxxxxxxx',
      },
    })
    setPosted(true)
    setTimeout(() => goMyAds(), 900)
  }

  if (posted) {
    return (
      <div className="lx-page sell-page">
        <div className="sell-success">
          <div className="sell-success-icon" aria-hidden>
            <CheckIcon size={36} />
          </div>
          <h2>Your ad is live!</h2>
          <p>Buyers can now find it on NexDeal. Taking you to My ADS…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lx-page sell-page">
      <div className="lx-page-head">
        <button type="button" className="details-back" onClick={goHome}>
          <ArrowLeftIcon size={16} /> Back to home
        </button>
        <h1 className="lx-page-h1">Post your ad</h1>
        <p className="lx-page-sub">
          Fill out the details below — we'll publish it instantly.
        </p>
      </div>

      <AdListingForm
        initial={{
          location: user?.location || '',
          phone: user?.phone || '',
        }}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
