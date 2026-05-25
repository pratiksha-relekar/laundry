// =====================================================================
// 8-category taxonomy for the Laundry resell marketplace
// =====================================================================
//
// Every category has:
//   id            — short slug used to tag products and look them up
//   name          — display name
//   icon          — emoji shown on the home-page section header
//   tagline       — short line under the category title
//   count         — sample listing count (used for "(8,540)" labels)
//   subcategories — flat list of sub-types shown in the sidebar tree
//
// The order of the categories below is the order they appear on the
// landing page and in the sidebar.
// =====================================================================

export const categories = [
  {
    id: 'washing-machines',
    name: 'Washing & Cleaning Machines',
    iconName: 'WashingMachine',
    iconColor: '#1B6FFF',
    tagline: 'High demand for laundromats & hostels',
    count: 8540,
    subcategories: [
      'Industrial Washing Machines',
      'Commercial Front-Load Washing Machines',
      'Semi-Automatic Washing Machines',
      'Fully Automatic Washing Machines',
      'Portable Mini Washing Machines',
    ],
  },
  {
    id: 'dry-cleaning',
    name: 'Dry Cleaning Machines',
    iconName: 'Flame',
    iconColor: '#ef6c2b',
    tagline: 'Premium business category',
    count: 1245,
    subcategories: [
      'Perchloroethylene (Perc) Dry-Cleaning Machines',
      'Hydrocarbon Dry-Cleaning Machines',
      'Green / Eco Dry-Cleaning Machines',
      'Compact Dry-Cleaning Units',
    ],
  },
  {
    id: 'dryers',
    name: 'Dryers & Drying Equipment',
    iconName: 'Wind',
    iconColor: '#0ea5b7',
    tagline: 'Essential for fast service',
    count: 2103,
    subcategories: [
      'Industrial Tumble Dryers',
      'Heat Pump Dryers',
      'Drying Cabinets',
      'Conveyor Dryers',
    ],
  },
  {
    id: 'ironing',
    name: 'Ironing & Pressing Equipment',
    iconName: 'Shirt',
    iconColor: '#7a4dd7',
    tagline: 'Finishing = customer satisfaction',
    count: 3210,
    subcategories: [
      'Steam Irons (Heavy-Duty)',
      'Garment Steamers (Vertical)',
      'Steam Press Machines',
      'Vacuum Ironing Tables',
      'Calendar / Roller Ironing Machines',
    ],
  },
  {
    id: 'steam-boilers',
    name: 'Steam Generators & Boilers',
    iconName: 'Cloud',
    iconColor: '#5a6473',
    tagline: 'Required for professional setups',
    count: 624,
    subcategories: [
      'Electric Steam Boilers',
      'Steam Generators',
      'Central Steam Systems',
    ],
  },
  {
    id: 'folding',
    name: 'Laundry Finishing & Folding',
    iconName: 'Package',
    iconColor: '#2c8a5f',
    tagline: 'Automation = time saving',
    count: 482,
    subcategories: [
      'Automatic Cloth Folding Machines',
      'Towel Folding Machines',
      'Shirt Finishing Machines',
      'Steam Tunnel Finishing Systems',
    ],
  },
  {
    id: 'specialized-cleaning',
    name: 'Specialized Cleaning Equipment',
    iconName: 'Sparkles',
    iconColor: '#d39d11',
    tagline: 'Niche but profitable',
    count: 1371,
    subcategories: [
      'Ultrasonic Cleaning Machines',
      'Shoe Cleaning Machines',
      'Carpet Cleaning Machines',
      'Spot Cleaning / Stain Removal Machines',
    ],
  },
  {
    id: 'electrical',
    name: 'Supporting Electrical Equipment',
    iconName: 'Zap',
    iconColor: '#e1a000',
    tagline: 'Powering the operation',
    count: 945,
    subcategories: [
      'Voltage Stabilizers',
      'Detergent Dispensers',
      'Industrial Inverters',
      'Soft Starters',
    ],
  },
]

export const totalListings = categories.reduce((s, c) => s + c.count, 0)

// Quick lookup by id
export const categoryMap = Object.fromEntries(
  categories.map((c) => [c.id, c])
)

// Sidebar tree — main category list with sub-types as second-level rows
// for the active category. We mark the first one as the default active.
export const sideCategories = (() => {
  const rows = [{ id: 'all', name: 'All Categories', level: 0 }]
  categories.forEach((c, i) => {
    rows.push({
      id: c.id,
      name: c.name,
      level: 1,
      count: c.count,
      active: i === 0,
    })
  })
  return rows
})()

// Top horizontal pills under the search bar
export const topPills = categories.map((c) => ({
  id: c.id,
  label: c.name.replace(/ & .*$/, '').replace(/ Equipment$/, ''),
}))

export const popularSearches = [
  'industrial washing machine',
  'dry cleaning machine',
  'tumble dryer',
  'steam press',
  'garment steamer',
  'fully automatic',
  'semi automatic',
  'calendar ironer',
  'carpet cleaner',
  'voltage stabilizer',
]
