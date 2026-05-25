import {
  WashingMachine,
  Flame,
  Wind,
  Shirt,
  Cloud,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react'

// Map from category.iconName -> Lucide component.
// Keep the keys aligned with `iconName` in `src/data/categories.js`.
const ICONS = {
  WashingMachine,
  Flame,
  Wind,
  Shirt,
  Cloud,
  Package,
  Sparkles,
  Zap,
}

export default function CategoryIcon({ name, size = 20, strokeWidth = 1.8, ...rest }) {
  const Icon = ICONS[name]
  if (!Icon) return null
  return <Icon size={size} strokeWidth={strokeWidth} {...rest} />
}
