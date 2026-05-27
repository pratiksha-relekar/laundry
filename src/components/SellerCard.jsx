import { useChats } from '../context/ChatsContext'
import { useNavigation } from '../context/NavigationContext'
import { useAuth } from '../context/AuthContext'
import { ChatIcon, PhoneIcon, UserIcon } from './Icons'
import { digitsForTel, getPhoneDisplay, getProductPhone } from '../utils/phone'

/**
 * Seller block on the product page — chat and call (opens device dialer).
 */
export default function SellerCard({ seller, productId, product }) {
  const { startChat } = useChats()
  const { goChats, goLogin } = useNavigation()
  const { user } = useAuth()

  const realPhone = getProductPhone(product, seller)
  const telHref = digitsForTel(realPhone)
  const displayPhone = getPhoneDisplay(product, seller)

  const handleChat = async () => {
    if (!user) {
      goLogin()
      return
    }
    const chatId = await startChat(productId)
    if (chatId) goChats()
  }

  const handleCall = () => {
    if (!telHref) return
    window.location.href = telHref
  }

  return (
    <section className="seller-card">
      <div className="seller-row">
        <div className="seller-avatar" aria-hidden>
          <UserIcon size={26} />
        </div>
        <div className="seller-info">
          <span className="seller-tag">Posted By</span>
          <span className="seller-name">{seller?.name || 'Seller'}</span>
          <span className="seller-since">
            Member since {seller?.memberSince || '—'}
          </span>
        </div>
      </div>

      <div className="seller-stats">
        <div className="seller-stat">
          <span className="seller-stat-num">{seller?.itemsListed ?? '—'}</span>
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

      {telHref ? (
        <a
          href={telHref}
          className="seller-btn seller-btn-call seller-btn-call-link"
          onClick={(e) => {
            e.preventDefault()
            handleCall()
          }}
        >
          <PhoneIcon size={18} />
          <span>Call {displayPhone}</span>
        </a>
      ) : (
        <button
          type="button"
          className="seller-btn seller-btn-call is-disabled"
          disabled
          title="Seller has not added a phone number"
        >
          <PhoneIcon size={18} />
          <span>Phone not available</span>
        </button>
      )}
    </section>
  )
}
