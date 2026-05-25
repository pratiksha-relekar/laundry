import { PinIcon } from './Icons'

// Lightweight Posted-in + map card for the product details page.
// We avoid the Google Maps JS SDK (no API key required for prototypes)
// and instead use a simple `?q=...&output=embed` iframe with the
// location string. Works without authentication.

export default function LocationMap({ location }) {
  const q = encodeURIComponent(location)
  const src = `https://maps.google.com/maps?q=${q}&z=12&output=embed`

  return (
    <section className="location-card">
      <h3 className="location-title">Posted in</h3>
      <div className="location-row">
        <PinIcon size={18} />
        <span>{location}</span>
      </div>
      <div className="location-map">
        <iframe
          title={`Map of ${location}`}
          src={src}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </section>
  )
}
