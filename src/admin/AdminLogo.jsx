// =====================================================================
// AdminLogo
// ---------------------------------------------------------------------
// OLX-inspired admin brand mark used in the sidebar, the login page
// badge and anywhere else the admin module needs a recognisable mark.
//
//  • Rounded square in OLX's signature dark teal (#002F34)
//  • Lime-green "lx" wordmark cut from the badge — a friendly nod to
//    OLX's lowercase wordmark, adapted as the "Laundry eXchange" mark
//  • Tiny lime dot accent for character
//  • Pure SVG, no external dependencies, scales cleanly at every size
// =====================================================================

export default function AdminLogo({ size = 40, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
    >
      <rect width="48" height="48" rx="12" fill="#002F34" />
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="11.25"
        fill="none"
        stroke="#C8E600"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      <text
        x="24"
        y="33"
        textAnchor="middle"
        fontFamily="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="22"
        fontWeight="900"
        fill="#C8E600"
        fontStyle="italic"
        letterSpacing="-1"
      >
        lx
      </text>
      <circle cx="36" cy="12" r="2.4" fill="#C8E600" />
    </svg>
  )
}

// Compact text-only wordmark used next to the badge. Lives here so the
// admin brand spelling stays in one place.
export function AdminWordmark() {
  return (
    <span className="admin-brand-text">
      <span className="admin-brand-name">Laundry</span>
      <span className="admin-brand-sub">Admin Panel</span>
    </span>
  )
}
