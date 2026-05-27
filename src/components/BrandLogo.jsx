import { BRAND_NAME } from '../assets/brand'

/**
 * Compact NexDeal mark — balanced N + D sizes for header and mobile.
 */
export function BrandMark({ size = 36, className = '' }) {
  return (
    <svg
      className={`brand-mark ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <g className="brand-mark-group">
        {/* N — reduced height so it matches D scale */}
        <path
          className="brand-mark-n"
          d="M7 14v20h3.6v-8.2L19.2 34H22v-20h-3.6v8.2L9.8 14H7z"
        />
        {/* D — same visual weight as N */}
        <path
          className="brand-mark-d"
          d="M20 14h6.8c4.9 0 8.2 3.4 8.2 8.6 0 5.4-3.5 9.4-8.2 9.4H20V14zm3.4 3.6v15.4h2.9c2.5 0 4.1-1.9 4.1-4.9 0-3.1-1.7-5.1-4.1-5.1h-2.9z"
        />
        <path
          className="brand-mark-tag"
          d="M29.8 21.2l3.8 2.2-1.6 2.8-3.8-2.2 1.6-2.8z"
        />
        <circle className="brand-mark-tag-hole" cx="32.2" cy="22.4" r="0.75" />
      </g>
    </svg>
  )
}

export function BrandWordmark({
  markSize = 40,
  className = '',
  showName = true,
}) {
  return (
    <div className={`brand-wordmark ${className}`.trim()}>
      <BrandMark size={markSize} />
      {showName && <span className="brand-wordmark-text">{BRAND_NAME}</span>}
    </div>
  )
}
