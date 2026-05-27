import { categories } from '../data/categories'
import { useNavigation } from '../context/NavigationContext'

const LAUNDRY_BRANDS = [
  'LG',
  'Samsung',
  'Whirlpool',
  'IFB',
  'Bosch',
  'Godrej',
  'Panasonic',
  'Haier',
]

/** Shorter labels for footer links */
function footerCategoryLabel(name) {
  return name
    .replace(/ & Cleaning Machines$/, '')
    .replace(/ Machines$/, '')
    .replace(/ Equipment$/, '')
    .replace(/ & Folding$/, '')
}

function FooterColumn({ title, children }) {
  return (
    <div className="footer-col">
      <h4>{title}</h4>
      <ul>{children}</ul>
    </div>
  )
}

function FooterLink({ children, onClick }) {
  return (
    <li>
      <button type="button" className="footer-link" onClick={onClick}>
        {children}
      </button>
    </li>
  )
}

export default function Footer() {
  const { goHome, goCategory, goSell, goMyAds, goAccount } = useNavigation()

  const shopCategories = categories.slice(0, 4)
  const moreCategories = categories.slice(4)

  return (
    <footer className="lx-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <FooterColumn title="Shop by category">
            {shopCategories.map((c) => (
              <FooterLink key={c.id} onClick={() => goCategory(c.id)}>
                {footerCategoryLabel(c.name)}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="More equipment">
            {moreCategories.map((c) => (
              <FooterLink key={c.id} onClick={() => goCategory(c.id)}>
                {footerCategoryLabel(c.name)}
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Top brands">
            {LAUNDRY_BRANDS.slice(0, 6).map((b) => (
              <FooterLink key={b} onClick={goHome}>
                {b} laundry equipment
              </FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="Sell on Laundry">
            <FooterLink onClick={goSell}>Post your machine for free</FooterLink>
            <FooterLink onClick={goMyAds}>My ADS</FooterLink>
            <FooterLink onClick={goAccount}>My account</FooterLink>
            <FooterLink onClick={goHome}>Browse all listings</FooterLink>
            <FooterLink onClick={goAccount}>Help &amp; support</FooterLink>
          </FooterColumn>

          <FooterColumn title="Follow us">
            <FooterLink onClick={() => {}}>Facebook</FooterLink>
            <FooterLink onClick={() => {}}>Instagram</FooterLink>
            <FooterLink onClick={() => {}}>Twitter</FooterLink>
            <FooterLink onClick={() => {}}>YouTube</FooterLink>
          </FooterColumn>
        </div>

        <div className="footer-bottom">
          <button type="button" className="footer-logo" onClick={goHome}>
            <span className="footer-logo-mark">L</span>
            <span>Laundry</span>
          </button>
          <p>
            Buy &amp; sell pre-owned laundry equipment in India · ©{' '}
            {new Date().getFullYear()} Laundry Resell
          </p>
        </div>
      </div>
    </footer>
  )
}
