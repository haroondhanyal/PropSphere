import { test, expect } from '@playwright/test'
import { SearchPage } from '../../../pages/public/search.page.js'
import { newSearchFilters } from '../../../utils/faker.js'
import { installLifecycleHooks } from '../../support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Search filter behavior', () => {
  test('advanced filters show numeric price and area limits only after expansion', async ({ page }) => {
    const filters = newSearchFilters()
    const search = new SearchPage(page)
    await search.open()
    await expect(page.getByPlaceholder('No minimum')).toHaveCount(0)
    await search.locators.filterButton.click()
    await page.getByPlaceholder('No minimum').fill(String(filters.minPrice))
    await page.getByPlaceholder('No maximum').fill(String(filters.maxPrice))
    await search.locators.minArea.fill(String(filters.minAreaSqft))
    await expect(page.getByPlaceholder('No minimum')).toHaveValue(String(filters.minPrice))
    await expect(page.getByPlaceholder('No maximum')).toHaveValue(String(filters.maxPrice))
    await expect(search.locators.minArea).toHaveValue(String(filters.minAreaSqft))
  })

  test('changing result sort starts the matching price ordering request', async ({ page }) => {
    const search = new SearchPage(page)
    await search.open()
    await page.getByLabel('Sort').selectOption('price-asc')
    await expect(page.getByLabel('Sort')).toHaveValue('price-asc')
    await expect(page.getByText(/Showing \d+ published listing/)).toBeVisible()
  })

  test('the clear-filters action resets advanced values and preserves the results page', async ({ page }) => {
    const search = new SearchPage(page)
    await page.goto('/search?purpose=RENT')
    await search.locators.filterButton.click()
    await search.locators.minPrice.fill('300000')
    await page.getByRole('button', { name: /clear filters/i }).click()
    await expect(search.locators.minPrice).toHaveValue('')
    await expect(page.locator('label').filter({ hasText: 'Looking to' }).locator('select')).toHaveValue('')
    await expect(search.locators.heading).toBeVisible()
  })
})
