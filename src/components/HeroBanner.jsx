import { PlusIcon } from './Icons'
import { heroImages } from '../data/products'

export default function HeroBanner() {
  return (
    <div className="hero-banner">
      <div className="hero-strip">
        <div className="hero-brand">
          <span className="hero-brand-mark">L</span>
          <span className="hero-brand-text">Laundry</span>
          <span className="hero-brand-sub">RESELL</span>
        </div>

        <div className="hero-machines" aria-hidden>
          {heroImages.map((src, i) => (
            <div className="hero-machine" key={i}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div>

        <div className="hero-cta">
          <span className="hero-cta-eyebrow">Up to 70% OFF</span>
          <h3>Pre-loved Washing Machines</h3>
          <p>From verified resellers across India · Free delivery in 10 cities</p>
          <button className="hero-cta-btn" type="button">
            <PlusIcon size={16} />
            Post your machine for FREE
          </button>
        </div>
      </div>
    </div>
  )
}
