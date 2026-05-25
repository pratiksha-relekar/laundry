import DesktopView from './DesktopView'
import { SearchProvider } from './context/SearchContext'
import { NavigationProvider } from './context/NavigationContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { ChatsProvider } from './context/ChatsContext'
import { UserAdsProvider } from './context/UserAdsContext'
import { ThemeProvider } from './context/ThemeContext'
import { AdminProvider } from './context/AdminContext'

// Bind the UserAdsProvider to the current user so each account loads its
// own set of posted ads. Anonymous users get a transient "guest" bucket.
function UserScopedShell({ children }) {
  const { user } = useAuth()
  return (
    <UserAdsProvider userId={user?.id || 'guest'}>{children}</UserAdsProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AdminProvider>
        <AuthProvider>
          <UserScopedShell>
            <WishlistProvider>
              <ChatsProvider>
                <SearchProvider>
                  <NavigationProvider>
                    <DesktopView />
                  </NavigationProvider>
                </SearchProvider>
              </ChatsProvider>
            </WishlistProvider>
          </UserScopedShell>
        </AuthProvider>
      </AdminProvider>
    </ThemeProvider>
  )
}
