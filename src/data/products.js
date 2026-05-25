// =====================================================================
// Curated resell listings across all 8 Laundry categories.
//
// Each product has:
//   category — id from categories.js
//   image    — primary thumbnail (Unsplash CDN URL)
//
// After the base array, an enrichment pass below adds the rest of the
// fields required by the details page:
//   images[5]   — gallery of 5 Unsplash CDN URLs
//   description — multi-paragraph description
//   condition   — e.g. "Used – Like New"
//   adId        — 10-digit OLX-style ad id
//   seller      — { name, memberSince, itemsListed, phoneMasked }
// =====================================================================

const img = (id, w = 720, h = 720) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`

// A small palette of confirmed-working washing-machine / laundry photo
// IDs. Different IDs are mapped to different products so the grid never
// feels copy-pasted.
const PHOTO = {
  whiteFront1: '1626806787461-102c1bfaaea1',
  whiteFront2: '1604335399105-a0c585fd81a1',
  whiteFrontCabinet: '1622473590925-e3616c0a41bf',
  whiteCloseUp: '1662220984920-3bd1f88e846f',
  washerDryerRoom: '1626806819282-2c1dc01a5e0c',
  laundryRoom: '1655041448985-f6666cba2d6c',
  silverBlackRow: '1668417863230-64f268d1d252',
  smallRoomWasher: '1722764375817-4f9ca20aefc1',
  multipleWhiteFront: '1604335398980-ededcadcc37d',
  drumCloseup: '1649105057951-e3006c21a664',
}

const PHOTO_LIST = Object.values(PHOTO)

const SELLERS = [
  { name: 'Catherin Antonia R.', memberSince: 'Jul 2022', itemsListed: 6, phoneMasked: '+91 98xxxxxx41' },
  { name: 'Rajesh Kumar', memberSince: 'Mar 2023', itemsListed: 12, phoneMasked: '+91 99xxxxxx08' },
  { name: 'Priya Sharma', memberSince: 'Oct 2021', itemsListed: 8, phoneMasked: '+91 90xxxxxx77' },
  { name: 'Aman Verma', memberSince: 'Feb 2024', itemsListed: 3, phoneMasked: '+91 70xxxxxx12' },
  { name: 'Neha Iyer', memberSince: 'Jan 2023', itemsListed: 14, phoneMasked: '+91 82xxxxxx55' },
  { name: 'Sandeep Joshi', memberSince: 'Aug 2020', itemsListed: 21, phoneMasked: '+91 96xxxxxx33' },
  { name: 'Fatima Khan', memberSince: 'May 2023', itemsListed: 5, phoneMasked: '+91 87xxxxxx94' },
  { name: 'Kabir Mehta', memberSince: 'Dec 2022', itemsListed: 9, phoneMasked: '+91 98xxxxxx20' },
  { name: 'Anjali Pillai', memberSince: 'Sep 2021', itemsListed: 17, phoneMasked: '+91 73xxxxxx66' },
  { name: 'Vikram Singh', memberSince: 'Nov 2019', itemsListed: 32, phoneMasked: '+91 91xxxxxx18' },
  { name: 'Meera Nair', memberSince: 'Apr 2024', itemsListed: 2, phoneMasked: '+91 80xxxxxx07' },
  { name: 'Imran Sayed', memberSince: 'Jun 2022', itemsListed: 11, phoneMasked: '+91 99xxxxxx51' },
]

const CONDITIONS = ['Used – Like New', 'Used – Good', 'Used – Fair', 'Used – Excellent']

const DESCRIPTION_TEMPLATES = {
  'washing-machines': [
    '{title}',
    '',
    'Excellent working condition. Lightly used at home with no scratches or dents.',
    'Wash motor, drum and inlet pipes work perfectly. Original bill and warranty card available.',
    'Genuine buyers only. Self pick-up preferred; delivery within city possible at actual cost.',
  ],
  'dry-cleaning': [
    '{title}',
    '',
    'Commercial-grade dry-cleaning machine in fully working order. Used at our laundromat for routine cycles only.',
    'Recently serviced — solvent filter and pump replaced last quarter. Comes with operator manual and installation drawings.',
    'Buyer to arrange transport. AMC contact details provided on request.',
  ],
  dryers: [
    '{title}',
    '',
    'Energy-efficient dryer with sensor controls. Drum lint filter cleaned regularly.',
    'No vibration issues, original drum belt intact. Power consumption verified at rated value.',
    'Selling because of upgrade to higher capacity model. Inspection welcome.',
  ],
  ironing: [
    '{title}',
    '',
    'Professional-grade pressing equipment, ideal for boutique laundry or in-house garment finishing.',
    'Steam vents unblocked, soleplate without scaling. Boiler tank cleaned and descaled before listing.',
    'Comes with detachable cord and spare gasket set.',
  ],
  'steam-boilers': [
    '{title}',
    '',
    'Heavy-duty steam generator with all safety valves intact. Pressure gauge and water level indicator working.',
    'Last hydro-test certificate provided. Connection fittings included.',
    'Industrial buyers preferred. Loading by truck — transport at buyer cost.',
  ],
  folding: [
    '{title}',
    '',
    'Automated finishing/folding machine for commercial laundries. Reduces folding time per piece by ~70%.',
    'PLC-controlled, conveyor belt and folding arms in mint condition. Operator training video available.',
    'Currently in storage — inspection by appointment.',
  ],
  'specialized-cleaning': [
    '{title}',
    '',
    'Specialty cleaning equipment for niche use-cases. Operates on standard 230V single-phase supply.',
    'Brushes, agitator and filters all serviced. Hose and accessory kit included.',
    'Ideal for hotels, salons, or specialty laundry shops.',
  ],
  electrical: [
    '{title}',
    '',
    'Supporting electrical accessory for laundry and dry-cleaning shops. Voltage rating verified.',
    'Indicator LEDs working, no burn marks on terminals. Switchgear and MCB included.',
    'Suitable for plug-and-play installation.',
  ],
}

function makeImages(primaryUrl, seed) {
  // Place the existing primary URL first, then pick 4 more distinct
  // photos from PHOTO_LIST in a deterministic order based on the seed.
  const others = PHOTO_LIST
    .filter((p) => !primaryUrl.includes(p))
    .map((p, i) => ({ p, k: (i + seed * 7 + 3) % PHOTO_LIST.length }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 4)
    .map(({ p }) => img(p))
  return [primaryUrl, ...others]
}

function makeDescription(product) {
  const tpl = DESCRIPTION_TEMPLATES[product.category] || DESCRIPTION_TEMPLATES['washing-machines']
  return tpl.map((line) => line.replace('{title}', product.title)).join('\n')
}

function makeAdId(index) {
  // Stable, deterministic 10-digit OLX-style ad id per product.
  const base = 1700000000 + (index + 1) * 1373779
  return String(base).slice(0, 10)
}

function enrich(p, index) {
  const seller = SELLERS[index % SELLERS.length]
  const condition = CONDITIONS[index % CONDITIONS.length]
  const images = makeImages(p.image, index)
  return {
    ...p,
    images,
    description: makeDescription(p),
    condition,
    adId: makeAdId(index),
    seller,
  }
}

const RAW_PRODUCTS = [
  // ----- 1. Washing & Cleaning Machines -------------------------------
  {
    id: 'wm-1',
    category: 'washing-machines',
    title: 'LG 8kg Inverter Front Load Steam Wash',
    price: 18500,
    location: 'Whitefield, Bengaluru',
    date: 'TODAY',
    featured: true,
    verified: true,
    image: img(PHOTO.whiteFront1),
  },
  {
    id: 'wm-2',
    category: 'washing-machines',
    title: 'Bosch 8kg Front Load Serie 4',
    price: 12000,
    location: 'Panchkula, Haryana',
    date: '4 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.whiteFront2),
  },
  {
    id: 'wm-3',
    category: 'washing-machines',
    title: 'Samsung 8kg EcoBubble Front Load',
    price: 15000,
    location: 'Sector 62, Noida',
    date: '2 days ago',
    featured: false,
    verified: true,
    image: img(PHOTO.whiteFrontCabinet),
  },
  {
    id: 'wm-4',
    category: 'washing-machines',
    title: 'IFB 6kg Front Load Diva Aqua VX',
    price: 12500,
    location: 'Indiranagar, Bengaluru',
    date: 'YESTERDAY',
    featured: false,
    verified: true,
    image: img(PHOTO.whiteCloseUp),
  },
  {
    id: 'wm-5',
    category: 'washing-machines',
    title: 'Godrej 7kg Fully Automatic Top Load',
    price: 6000,
    location: 'Kharghar, Navi Mumbai',
    date: 'MAY 09',
    featured: true,
    verified: false,
    image: img(PHOTO.washerDryerRoom),
  },
  {
    id: 'wm-6',
    category: 'washing-machines',
    title: 'Whirlpool 7.2kg Semi-Automatic Twin Tub',
    price: 5400,
    location: 'Vadapalani, Chennai',
    date: 'MAY 18',
    featured: false,
    verified: false,
    image: img(PHOTO.silverBlackRow),
  },

  // ----- 2. Dry Cleaning Machines -------------------------------------
  {
    id: 'dc-1',
    category: 'dry-cleaning',
    title: 'Union HL-820 Perc Dry-Cleaning Machine',
    price: 350000,
    location: 'Andheri MIDC, Mumbai',
    date: '3 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.laundryRoom),
  },
  {
    id: 'dc-2',
    category: 'dry-cleaning',
    title: 'Renzacci Aquahybrid Hydrocarbon System',
    price: 420000,
    location: 'Saket, New Delhi',
    date: 'TODAY',
    featured: true,
    verified: true,
    image: img(PHOTO.silverBlackRow),
  },
  {
    id: 'dc-3',
    category: 'dry-cleaning',
    title: 'Multimatic Eco Solvent 14kg',
    price: 280000,
    location: 'Madhapur, Hyderabad',
    date: 'MAY 19',
    featured: false,
    verified: true,
    image: img(PHOTO.smallRoomWasher),
  },
  {
    id: 'dc-4',
    category: 'dry-cleaning',
    title: 'Donini Compact Dry-Cleaning Unit 10kg',
    price: 195000,
    location: 'Salt Lake, Kolkata',
    date: 'YESTERDAY',
    featured: false,
    verified: false,
    image: img(PHOTO.multipleWhiteFront),
  },
  {
    id: 'dc-5',
    category: 'dry-cleaning',
    title: 'IPSO Wet-Clean Premium 20kg',
    price: 320000,
    location: 'Whitefield, Bengaluru',
    date: '5 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.washerDryerRoom),
  },

  // ----- 3. Dryers & Drying Equipment ---------------------------------
  {
    id: 'dr-1',
    category: 'dryers',
    title: 'Bosch 9kg Heat Pump Tumble Dryer',
    price: 22000,
    location: 'Koregaon Park, Pune',
    date: 'TODAY',
    featured: true,
    verified: true,
    image: img(PHOTO.drumCloseup),
  },
  {
    id: 'dr-2',
    category: 'dryers',
    title: 'LG 8kg Sensor Dry True Steam',
    price: 18500,
    location: 'JP Nagar, Bengaluru',
    date: '2 days ago',
    featured: false,
    verified: true,
    image: img(PHOTO.smallRoomWasher),
  },
  {
    id: 'dr-3',
    category: 'dryers',
    title: 'Electrolux Industrial Tumble Dryer 20kg',
    price: 185000,
    location: 'Andheri East, Mumbai',
    date: 'MAY 22',
    featured: true,
    verified: true,
    image: img(PHOTO.laundryRoom),
  },
  {
    id: 'dr-4',
    category: 'dryers',
    title: 'Whirlpool Drying Cabinet ProDry 60L',
    price: 45000,
    location: 'Banjara Hills, Hyderabad',
    date: 'TODAY',
    featured: false,
    verified: false,
    image: img(PHOTO.multipleWhiteFront),
  },
  {
    id: 'dr-5',
    category: 'dryers',
    title: 'Speed Queen Conveyor Dryer 30kg',
    price: 220000,
    location: 'Peenya, Bengaluru',
    date: '4 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.silverBlackRow),
  },

  // ----- 4. Ironing & Pressing Equipment ------------------------------
  {
    id: 'ir-1',
    category: 'ironing',
    title: 'Philips Azur 2400W Heavy-Duty Steam Iron',
    price: 1800,
    location: 'JP Nagar, Bengaluru',
    date: 'TODAY',
    featured: false,
    verified: false,
    image: img(PHOTO.whiteFront2),
  },
  {
    id: 'ir-2',
    category: 'ironing',
    title: 'Tefal Pro Express Vertical Garment Steamer',
    price: 8500,
    location: 'Powai, Mumbai',
    date: 'YESTERDAY',
    featured: false,
    verified: true,
    image: img(PHOTO.whiteFrontCabinet),
  },
  {
    id: 'ir-3',
    category: 'ironing',
    title: 'Rotondi Mini Steam Press 5kg Industrial',
    price: 24000,
    location: 'Karol Bagh, New Delhi',
    date: '3 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.silverBlackRow),
  },
  {
    id: 'ir-4',
    category: 'ironing',
    title: 'Naomoto Vacuum Ironing Table HSP-655',
    price: 38000,
    location: 'Andheri West, Mumbai',
    date: 'TODAY',
    featured: true,
    verified: true,
    image: img(PHOTO.whiteFrontCabinet),
  },
  {
    id: 'ir-5',
    category: 'ironing',
    title: 'Yamamoto Calendar Ironer 2000mm',
    price: 165000,
    location: 'Hosur, Tamil Nadu',
    date: 'MAY 17',
    featured: true,
    verified: true,
    image: img(PHOTO.laundryRoom),
  },
  {
    id: 'ir-6',
    category: 'ironing',
    title: 'Singer Heavy-Duty Steam Iron Plus',
    price: 2200,
    location: 'Sector 22, Chandigarh',
    date: 'TODAY',
    featured: false,
    verified: false,
    image: img(PHOTO.whiteCloseUp),
  },

  // ----- 5. Steam Generators & Boilers --------------------------------
  {
    id: 'sb-1',
    category: 'steam-boilers',
    title: 'BTU Master Electric Steam Boiler 12kW',
    price: 78000,
    location: 'Peenya, Bengaluru',
    date: 'MAY 21',
    featured: true,
    verified: true,
    image: img(PHOTO.silverBlackRow),
  },
  {
    id: 'sb-2',
    category: 'steam-boilers',
    title: 'Mocom Steam Generator 6kW',
    price: 32000,
    location: 'Andheri MIDC, Mumbai',
    date: 'TODAY',
    featured: false,
    verified: true,
    image: img(PHOTO.whiteFrontCabinet),
  },
  {
    id: 'sb-3',
    category: 'steam-boilers',
    title: 'Italian Central Steam System 24kW',
    price: 240000,
    location: 'Bhiwadi, Rajasthan',
    date: '5 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.laundryRoom),
  },
  {
    id: 'sb-4',
    category: 'steam-boilers',
    title: 'Brio Wet Steam Generator 9L',
    price: 18000,
    location: 'Velachery, Chennai',
    date: 'YESTERDAY',
    featured: false,
    verified: false,
    image: img(PHOTO.multipleWhiteFront),
  },

  // ----- 6. Laundry Finishing & Folding -------------------------------
  {
    id: 'fo-1',
    category: 'folding',
    title: 'Tonello Automatic Cloth Folder T-Fold',
    price: 185000,
    location: 'Tirupur, Tamil Nadu',
    date: 'MAY 20',
    featured: true,
    verified: true,
    image: img(PHOTO.laundryRoom),
  },
  {
    id: 'fo-2',
    category: 'folding',
    title: 'Folding Machine Towel TF-500',
    price: 95000,
    location: 'Ludhiana, Punjab',
    date: 'TODAY',
    featured: false,
    verified: true,
    image: img(PHOTO.smallRoomWasher),
  },
  {
    id: 'fo-3',
    category: 'folding',
    title: 'Veit Shirt Finishing Topper 8388',
    price: 220000,
    location: 'Noida Sector 63, Noida',
    date: '3 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.silverBlackRow),
  },
  {
    id: 'fo-4',
    category: 'folding',
    title: 'Multimatic Steam Tunnel SST-30',
    price: 310000,
    location: 'Sanand, Ahmedabad',
    date: 'MAY 14',
    featured: true,
    verified: true,
    image: img(PHOTO.washerDryerRoom),
  },

  // ----- 7. Specialized Cleaning Equipment ----------------------------
  {
    id: 'sc-1',
    category: 'specialized-cleaning',
    title: 'Sonix Ultrasonic Jewellery Cleaner 6L',
    price: 12000,
    location: 'Karol Bagh, New Delhi',
    date: 'TODAY',
    featured: false,
    verified: true,
    image: img(PHOTO.drumCloseup),
  },
  {
    id: 'sc-2',
    category: 'specialized-cleaning',
    title: 'Shoe Care Pro Cleaner Machine',
    price: 8500,
    location: 'Mulund, Mumbai',
    date: 'YESTERDAY',
    featured: false,
    verified: false,
    image: img(PHOTO.smallRoomWasher),
  },
  {
    id: 'sc-3',
    category: 'specialized-cleaning',
    title: 'Bissell Big Green Carpet Cleaner',
    price: 28000,
    location: 'Vasant Kunj, New Delhi',
    date: 'TODAY',
    featured: true,
    verified: true,
    image: img(PHOTO.multipleWhiteFront),
  },
  {
    id: 'sc-4',
    category: 'specialized-cleaning',
    title: 'Kärcher SE 4002 Spot Stain Remover',
    price: 16000,
    location: 'HSR Layout, Bengaluru',
    date: 'MAY 23',
    featured: false,
    verified: true,
    image: img(PHOTO.whiteFrontCabinet),
  },
  {
    id: 'sc-5',
    category: 'specialized-cleaning',
    title: 'Ultracleaning USC-200 Industrial',
    price: 45000,
    location: 'Peenya, Bengaluru',
    date: '4 days ago',
    featured: true,
    verified: true,
    image: img(PHOTO.silverBlackRow),
  },

  // ----- 8. Supporting Electrical Equipment ---------------------------
  {
    id: 'el-1',
    category: 'electrical',
    title: 'V-Guard 4kVA Voltage Stabilizer',
    price: 4800,
    location: 'Kochi, Kerala',
    date: 'TODAY',
    featured: false,
    verified: false,
    image: img(PHOTO.whiteFront2),
  },
  {
    id: 'el-2',
    category: 'electrical',
    title: 'Auto Detergent Dispenser 5-port',
    price: 12000,
    location: 'Sector 18, Noida',
    date: 'YESTERDAY',
    featured: false,
    verified: true,
    image: img(PHOTO.whiteFrontCabinet),
  },
  {
    id: 'el-3',
    category: 'electrical',
    title: 'Schneider Soft Starter 11kW',
    price: 15500,
    location: 'Peenya, Bengaluru',
    date: 'MAY 22',
    featured: true,
    verified: true,
    image: img(PHOTO.silverBlackRow),
  },
  {
    id: 'el-4',
    category: 'electrical',
    title: 'Microtek 5kVA Pure Sine Wave Inverter',
    price: 22000,
    location: 'Andheri East, Mumbai',
    date: 'TODAY',
    featured: false,
    verified: true,
    image: img(PHOTO.laundryRoom),
  },
  {
    id: 'el-5',
    category: 'electrical',
    title: 'Havells 8kVA Industrial Stabilizer',
    price: 8200,
    location: 'Salt Lake, Kolkata',
    date: '6 days ago',
    featured: false,
    verified: false,
    image: img(PHOTO.multipleWhiteFront),
  },
]

// Enrichment pass — every product gets a 5-image gallery, description,
// seller, condition and stable ad id used by the product details page.
export const products = RAW_PRODUCTS.map(enrich)

// Quick lookup by product id (used by the details page).
export const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

// Group products by their category id for the home page sections
export const productsByCategory = products.reduce((acc, p) => {
  if (!acc[p.category]) acc[p.category] = []
  acc[p.category].push(p)
  return acc
}, {})

// Photos shown in the hero strip (a quick visual mix)
export const heroImages = [
  img(PHOTO.whiteFront1),
  img(PHOTO.silverBlackRow),
  img(PHOTO.whiteFrontCabinet),
  img(PHOTO.washerDryerRoom),
]
