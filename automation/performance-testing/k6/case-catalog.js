const cities = [
  'Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar',
  'Faisalabad', 'Multan', 'Quetta', 'Hyderabad', 'Sialkot',
]

const filters = [
  ['SALE listings', { purpose: 'SALE' }],
  ['RENT listings', { purpose: 'RENT' }],
  ['APARTMENT listings', { type: 'APARTMENT' }],
  ['HOUSE listings', { type: 'HOUSE' }],
  ['VILLA listings', { type: 'VILLA' }],
  ['PENTHOUSE listings', { type: 'PENTHOUSE' }],
  ['STUDIO listings', { type: 'STUDIO' }],
  ['OFFICE listings', { type: 'OFFICE' }],
  ['SHOP listings', { type: 'SHOP' }],
  ['LAND listings', { type: 'LAND' }],
  ['WAREHOUSE listings', { type: 'WAREHOUSE' }],
  ['FACTORY listings', { type: 'FACTORY' }],
  ['COMMERCIAL listings', { type: 'COMMERCIAL' }],
  ['Budget under PKR 10M', { maxPrice: 10000000 }],
  ['Premium from PKR 20M', { minPrice: 20000000 }],
  ['Family homes 3+ bedrooms', { minBedrooms: 3 }],
  ['Two or more bathrooms', { minBathrooms: 2 }],
  ['Floor area from 1,000 sq ft', { minArea: 1000 }],
  ['Floor area up to 2,000 sq ft', { maxArea: 2000 }],
  ['Price ascending order', { sort: 'price-asc' }],
]

export const cases = filters.flatMap(([label, query]) => cities.map((city, cityIndex) => ({
  id: `K6-${String(filters.findIndex(([name]) => name === label) * cities.length + cityIndex + 1).padStart(3, '0')}`,
  title: `${city} · ${label}`,
  city,
  query: { city, ...query, take: 12 },
})))

if (cases.length !== 200) throw new Error(`Expected 200 K6 cases, found ${cases.length}`)
