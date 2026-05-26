import DesktopView from './DesktopView'
import { SearchProvider } from './context/SearchContext'
import { NavigationProvider } from './context/NavigationContext'
import { AuthProvider } from './context/AuthContext'
import { WishlistProvider } from './context/WishlistContext'
import { ChatsProvider } from './context/ChatsContext'
import { UserAdsProvider } from './context/UserAdsContext'
import { ProductsProvider } from './context/ProductsContext'
import { ThemeProvider } from './context/ThemeContext'
import { AdminProvider } from './context/AdminContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminProvider>
          <ProductsProvider>
            <UserAdsProvider>
              <WishlistProvider>
                <ChatsProvider>
                  <SearchProvider>
                    <NavigationProvider>
                      <DesktopView />
                    </NavigationProvider>
                  </SearchProvider>
                </ChatsProvider>
              </WishlistProvider>
            </UserAdsProvider>
          </ProductsProvider>
        </AdminProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
