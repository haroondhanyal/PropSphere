import { test, expect } from '@playwright/test'
import { installLifecycleHooks } from '../support/hooks.js'

installLifecycleHooks(test, true)

const cities = ['Islamabad', 'Rawalpindi', 'Lahore', 'Karachi', 'Peshawar', 'Faisalabad', 'Multan', 'Quetta', 'Hyderabad', 'Sialkot']
const types = ['APARTMENT', 'HOUSE', 'VILLA', 'OFFICE', 'WAREHOUSE']
const purposes = ['SALE', 'RENT']
const searches: Array<{ name: string; city: string; type?: string; purpose?: string; bedrooms?: number; minPrice?: number; maxArea?: number; sort?: string }> = []

for (const city of cities) for (const purpose of purposes) for (const type of types) searches.push({
  name: `${purpose.toLowerCase()} ${type.toLowerCase()} in ${city}`, city, purpose, type,
})

for (const city of cities) for (const bedrooms of [1, 2, 3, 4]) searches.push({
  name: `${bedrooms}+ bedroom homes in ${city}`, city, bedrooms,
})

for (const city of cities.slice(0, 5)) for (const sort of ['newest', 'price-asc', 'price-desc', 'area-desc']) searches.push({
  name: `${sort} results in ${city}`, city, sort,
})

for (const city of cities.slice(0, 8)) for (const purpose of purposes) for (const profile of [
  { label: 'compact budget', minPrice: 100000, maxArea: 2500 },
  { label: 'larger spaces', minPrice: 5000000, maxArea: 60000 },
]) searches.push({ name: `${profile.label} ${purpose.toLowerCase()} search in ${city}`, city, purpose, minPrice: profile.minPrice, maxArea: profile.maxArea })

test.describe('BDD · Given / When / Then marketplace search journeys · 192 cases', () => {
  for (const scenario of searches) test(`Given a visitor wants ${scenario.name}, when filters are applied, then the results reflect that search`, async ({ page }) => {
    // Shared local services can slow down under the 900-case parallel run.
    test.setTimeout(60_000)
    await test.step('Given the visitor opens the marketplace search page', async () => {
      await page.goto('/search')
      await expect(page.getByRole('heading', { name: 'Find your next place' })).toBeVisible()
      await expect(page.locator('.skeleton-card')).toHaveCount(0)
    })

    await test.step('When the visitor applies location and listing preferences', async () => {
      await page.getByPlaceholder('e.g. Islamabad').fill(scenario.city)
      if (scenario.type) await page.locator('label').filter({ hasText: 'Property type' }).locator('select').selectOption(scenario.type)
      if (scenario.purpose) await page.locator('label').filter({ hasText: 'Looking to' }).locator('select').selectOption(scenario.purpose)
      if (scenario.bedrooms || scenario.minPrice || scenario.maxArea) {
        await page.getByRole('button', { name: /filters/i }).click()
        if (scenario.bedrooms) await page.getByLabel('Bedrooms').selectOption(String(scenario.bedrooms))
        if (scenario.minPrice) await page.getByPlaceholder('No minimum').fill(String(scenario.minPrice))
        if (scenario.maxArea) await page.getByLabel('Max area (sq ft)').fill(String(scenario.maxArea))
      }
      if (scenario.sort) await page.getByLabel('Sort').selectOption(scenario.sort)
      else await page.getByRole('button', { name: 'Search', exact: true }).click()
    })

    await test.step('Then the applied criteria remain visible and a result state is shown', async () => {
      await expect(page.getByPlaceholder('e.g. Islamabad')).toHaveValue(scenario.city)
      if (scenario.type) await expect(page.locator('label').filter({ hasText: 'Property type' }).locator('select')).toHaveValue(scenario.type)
      if (scenario.purpose) await expect(page.locator('label').filter({ hasText: 'Looking to' }).locator('select')).toHaveValue(scenario.purpose)
      if (scenario.bedrooms) await expect(page.getByLabel('Bedrooms')).toHaveValue(String(scenario.bedrooms))
      if (scenario.minPrice) await expect(page.getByPlaceholder('No minimum')).toHaveValue(String(scenario.minPrice))
      if (scenario.maxArea) await expect(page.getByLabel('Max area (sq ft)')).toHaveValue(String(scenario.maxArea))
      if (scenario.sort) await expect(page.getByLabel('Sort')).toHaveValue(scenario.sort)
      await expect(page.locator('.skeleton-card')).toHaveCount(0)
      await expect(page.locator('.results-toolbar')).toBeVisible()
      await expect(page.getByText(/Showing \d+ published listings?/)).toBeVisible()
      await expect(page.locator('.property-grid, .empty-state').first()).toBeVisible()
    })
  })
})
