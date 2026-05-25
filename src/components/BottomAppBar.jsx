import {
  HomeIcon,
  ChatIcon,
  HeartIcon,
  UserIcon,
  PlusIcon,
} from './Icons'
import { useNavigation } from '../context/NavigationContext'
import { useAuth } from '../context/AuthContext'
import { useChats } from '../context/ChatsContext'
import { useWishlist } from '../context/WishlistContext'

export default function BottomAppBar() {
  const {
    view,
    goHome,
    goChats,
    goMyAds,
    goLogin,
    goAccount,
    goSell,
  } = useNavigation()
  const { user } = useAuth()
  const { totalUnread } = useChats()
  const { count: wishlistCount } = useWishlist()

  const tabs = [
    {
      id: 'home',
      label: 'HOME',
      Icon: HomeIcon,
      onClick: goHome,
      active: view === 'home' || view === 'details',
    },
    {
      id: 'chats',
      label: 'CHATS',
      Icon: ChatIcon,
      onClick: user ? goChats : goLogin,
      active: view === 'chats',
      badge: totalUnread,
    },
    {
      id: 'sell',
      label: 'SELL',
      sell: true,
      onClick: user ? goSell : goLogin,
    },
    {
      id: 'ads',
      label: 'MY ADS',
      Icon: HeartIcon,
      onClick: user ? goMyAds : goLogin,
      active: view === 'my-ads' || view === 'wishlist',
      badge: wishlistCount || undefined,
    },
    {
      id: 'account',
      label: 'ACCOUNT',
      Icon: UserIcon,
      onClick: user ? goAccount : goLogin,
      active: view === 'account' || view === 'login' || view === 'signup',
    },
  ]

  return (
    <nav className="bottom-bar" aria-label="Primary navigation">
      {tabs.map(({ id, label, Icon, sell, onClick, active, badge }) => {
        if (sell) {
          return (
            <button
              key={id}
              type="button"
              className="bottom-bar-sell"
              onClick={onClick}
              aria-label="Post an ad"
            >
              <span className="bottom-bar-sell-ring" aria-hidden>
                <span className="bottom-bar-sell-inner">
                  <PlusIcon size={24} />
                </span>
              </span>
              <span className="bottom-bar-label">{label}</span>
            </button>
          )
        }

        return (
          <button
            key={id}
            type="button"
            className={`bottom-bar-item ${active ? 'active' : ''}`}
            onClick={onClick}
          >
            <span className="bottom-bar-icon-wrap">
              <Icon
                size={22}
                filled={active && id === 'home'}
                className="bottom-bar-icon"
              />
              {badge > 0 && (
                <span className="bottom-bar-badge" aria-hidden>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span className="bottom-bar-label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
