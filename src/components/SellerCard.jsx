import { useState } from 'react'
import { ChatIcon, PhoneIcon, UserIcon } from './Icons'
import { useChats } from '../context/ChatsContext'
import { useNavigation } from '../context/NavigationContext'
import { useAuth } from '../context/AuthContext'

// Card on the right rail of the product details page that displays the
// seller's profile and exposes "Chat with seller" + "Call seller".
//
// The Call action reveals the masked phone number on first tap (the
// classic OLX flow) and turns into a "tap to call" link.

export default function SellerCard({ seller, productId }) {
  const [phoneShown, setPhoneShown] = useState(false)
  const { startChat } = useChats()
  const { goChats, goLogin } = useNavigation()
  const { user } = useAuth()

  const handleChat = () => {
    if (!user) {
      goLogin()
      return
    }
    startChat(productId)
    goChats()
  }

  return (
    <section className="seller-card">
      <div className="seller-row">
        <div className="seller-avatar" aria-hidden>
          <UserIcon size={26} />
        </div>
        <div className="seller-info">
          <span className="seller-tag">Posted By</span>
          <span className="seller-name">{seller.name}</span>
          <span className="seller-since">Member since {seller.memberSince}</span>
        </div>
      </div>

      <div className="seller-stats">
        <div className="seller-stat">
          <span className="seller-stat-num">{seller.itemsListed}</span>
          <span className="seller-stat-label">Items listed</span>
        </div>
      </div>

      <button
        type="button"
        className="seller-btn seller-btn-chat"
        onClick={handleChat}
      >
        <ChatIcon size={18} /> Chat with seller
      </button>

      <button
        type="button"
        className={`seller-btn seller-btn-call ${phoneShown ? 'is-revealed' : ''}`}
        onClick={() => setPhoneShown(true)}
      >
        <PhoneIcon size={18} />
        {phoneShown ? (
          <a href={`tel:${seller.phoneMasked.replace(/\s/g, '')}`}>
            {seller.phoneMasked}
          </a>
        ) : (
          <span>Show phone number</span>
        )}
      </button>
    </section>
  )
}
