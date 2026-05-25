const POPULAR_LOCATIONS = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Pune',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Surat',
  'Indore',
]

const POPULAR_BRANDS = [
  'LG',
  'Samsung',
  'Whirlpool',
  'IFB',
  'Bosch',
  'Godrej',
  'Panasonic',
  'Haier',
  'Onida',
  'Voltas Beko',
]

export default function Footer() {
  return (
    <footer className="lx-footer">
      <div className="footer-grid">
        <div>
          <h4>Popular Locations</h4>
          <ul>
            {POPULAR_LOCATIONS.slice(0, 6).map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Trending Locations</h4>
          <ul>
            {POPULAR_LOCATIONS.slice(6).map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Top Brands</h4>
          <ul>
            {POPULAR_BRANDS.slice(0, 5).map((b) => (
              <li key={b}>
                <a href="#">{b} Washing Machines</a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4>About Laundry</h4>
          <ul>
            <li>
              <a href="#">Tech@Laundry</a>
            </li>
            <li>
              <a href="#">Careers</a>
            </li>
            <li>
              <a href="#">Help</a>
            </li>
            <li>
              <a href="#">Sitemap</a>
            </li>
            <li>
              <a href="#">Legal &amp; Privacy</a>
            </li>
          </ul>
        </div>
        <div>
          <h4>Follow Us</h4>
          <ul>
            <li>
              <a href="#">Facebook</a>
            </li>
            <li>
              <a href="#">Instagram</a>
            </li>
            <li>
              <a href="#">Twitter</a>
            </li>
            <li>
              <a href="#">YouTube</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-logo">
          <span className="footer-logo-mark">L</span>
          <span>Laundry</span>
        </div>
        <p>Free Classifieds in India · © {new Date().getFullYear()} Laundry Resell</p>
      </div>
    </footer>
  )
}
