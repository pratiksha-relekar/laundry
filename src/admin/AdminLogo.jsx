import { BrandMark } from '../components/BrandLogo'
import { BRAND_NAME } from '../assets/brand'

export default function AdminLogo({ size = 40, className }) {
  return <BrandMark size={size} className={className} />
}

export function AdminWordmark() {
  return (
    <span className="admin-brand-text">
      <span className="admin-brand-name">{BRAND_NAME}</span>
      <span className="admin-brand-sub">Admin Panel</span>
    </span>
  )
}
