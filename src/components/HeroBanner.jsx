import { PlusIcon } from './Icons'
import { heroImages } from '../data/products'
import { useNavigation } from '../context/NavigationContext'
import { BrandWordmark } from './BrandLogo'

export default function HeroBanner() {
  const { goSell } = useNavigation()
  return (
    <div className="hero-banner">
      <div className="hero-strip">
        <div className="hero-brand">
          <BrandWordmark markSize={40} className="hero-brand-wordmark" />
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
          <button className="hero-cta-btn" type="button" onClick={goSell}>
            <PlusIcon size={16} />
            Post your machine for FREE
          </button>
        </div>
      </div>
    </div>
  )
}
