import { test, expect } from '@playwright/test'
import { env } from '../../config/env.js'
import { installLifecycleHooks } from '../support/hooks.js'
import { attachJson } from '../support/evidence.js'

installLifecycleHooks(test)

const cities = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Faisalabad', 'Multan', 'Quetta', 'Hyderabad', 'Sialkot']
const purposes = ['SALE', 'RENT']
const types = ['APARTMENT', 'HOUSE', 'VILLA', 'PENTHOUSE', 'STUDIO', 'OFFICE', 'SHOP', 'COMMERCIAL', 'WAREHOUSE', 'FACTORY']
const cases: Array<{ name: string; params: Record<string, string>; assert: (rows: any[]) => void }> = []

for (const city of cities) for (const purpose of purposes) cases.push({
  name: `city ${city} and ${purpose} purpose`, params: { city, purpose },
  assert: (rows) => { for (const row of rows) { expect(row.city.toLowerCase()).toContain(city.toLowerCase()); expect(row.purpose).toBe(purpose) } },
})

for (const type of types) for (const purpose of purposes) cases.push({
  name: `${type} listings for ${purpose}`, params: { type, purpose },
  assert: (rows) => { for (const row of rows) { expect(row.type).toBe(type); expect(row.purpose).toBe(purpose) } },
})

const priceBands = [
  ['0–100000', '0', '100000'], ['100001–200000', '100001', '200000'], ['200001–1000000', '200001', '1000000'],
  ['1000001–5000000', '1000001', '5000000'], ['5000001–10000000', '5000001', '10000000'], ['10000001–25000000', '10000001', '25000000'],
  ['25000001–50000000', '25000001', '50000000'], ['50000001–100000000', '50000001', '100000000'], ['90000000+', '90000000', '200000000'], ['all seeded prices', '0', '500000000'],
]
for (const [label, minPrice, maxPrice] of priceBands) for (const purpose of purposes) cases.push({
  name: `price band ${label} for ${purpose}`, params: { minPrice, maxPrice, purpose },
  assert: (rows) => { for (const row of rows) { expect(Number(row.price)).toBeGreaterThanOrEqual(Number(minPrice)); expect(Number(row.price)).toBeLessThanOrEqual(Number(maxPrice)); expect(row.purpose).toBe(purpose) } },
})

for (const value of [1, 2, 3, 4, 5]) cases.push({ name: `minimum bedrooms ${value}`, params: { minBedrooms: String(value) }, assert: (rows) => { for (const row of rows) expect(row.bedrooms).toBeGreaterThanOrEqual(value) } })
for (const value of [1, 2, 3, 4]) cases.push({ name: `minimum bathrooms ${value}`, params: { minBathrooms: String(value) }, assert: (rows) => { for (const row of rows) expect(row.bathrooms).toBeGreaterThanOrEqual(value) } })
for (const value of [650, 900, 1500, 2500, 5000]) cases.push({ name: `minimum area ${value} square feet`, params: { minArea: String(value) }, assert: (rows) => { for (const row of rows) expect(row.areaSqft).toBeGreaterThanOrEqual(value) } })
for (const value of [900, 1500, 3000, 6500, 20000, 60000]) cases.push({ name: `maximum area ${value} square feet`, params: { maxArea: String(value) }, assert: (rows) => { for (const row of rows) expect(row.areaSqft).toBeLessThanOrEqual(value) } })

for (const sort of ['newest', 'price-asc', 'price-desc', 'area-desc']) cases.push({
  name: `sort order ${sort}`, params: { sort, take: '30' },
  assert: (rows) => {
    const values = rows.map((row) => Number(sort === 'area-desc' ? row.areaSqft : sort.startsWith('price-') ? row.price : new Date(row.createdAt).getTime()))
    for (let index = 1; index < values.length; index++) {
      if (sort === 'price-desc' || sort === 'area-desc' || sort === 'newest') expect(values[index]).toBeLessThanOrEqual(values[index - 1])
      else expect(values[index]).toBeGreaterThanOrEqual(values[index - 1])
    }
  },
})

for (const take of [1, 2, 5]) for (const skip of [0, 1]) cases.push({
  name: `pagination take ${take} skip ${skip}`, params: { take: String(take), skip: String(skip), sort: 'price-asc' },
  assert: (rows) => expect(rows.length).toBeLessThanOrEqual(take),
})

for (const city of cities) cases.push({
  name: `free-text query matches ${city}`, params: { q: city },
  assert: (rows) => { for (const row of rows) expect(`${row.title} ${row.city} ${row.community}`.toLowerCase()).toContain(city.toLowerCase()) },
})

test.describe('API · property query contracts · 100 cases', () => {
  for (const scenario of cases) test(`GET /properties · ${scenario.name}`, async ({ request }) => {
    await test.step(`Given the visitor filters by ${scenario.name}`, async () => {
      const response = await request.get(`${env.apiUrl}/properties?${new URLSearchParams(scenario.params)}`)
      const body = await response.text()
      await attachJson(`GET /properties query evidence · ${scenario.name}`, { query: scenario.params, status: response.status(), body: body.slice(0, 2500) })
      await test.step('When the API returns the filtered property inventory', async () => {
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('application/json')
        const rows = JSON.parse(body)
        expect(Array.isArray(rows)).toBeTruthy()
        await test.step('Then every returned result satisfies the requested filters', () => scenario.assert(rows))
      })
    })
  })
})

const protectedRoutes = ['/properties/favorites', '/properties/review', '/auth/profile', '/workspace/statement', '/tasks', '/leads', '/sales/team', '/units', '/portfolio/properties', '/admin/users']
test.describe('API · anonymous access-control contracts · 10 cases', () => {
  for (const route of protectedRoutes) test(`anonymous GET ${route} is rejected`, async ({ request }) => {
    const response = await request.get(`${env.apiUrl}${route}`)
    await attachJson(`Anonymous access evidence · ${route}`, { method: 'GET', path: route, status: response.status(), body: (await response.text()).slice(0, 1000) })
    expect(response.status(), `${route} must require authentication`).toBe(401)
  })
})
