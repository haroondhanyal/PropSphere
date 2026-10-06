import { test, expect } from '@playwright/test'
import { installLifecycleHooks } from '../../../support/hooks.js'

installLifecycleHooks(test, true)

async function openFilters(page: import('@playwright/test').Page) {
  await page.goto('/search')
  await expect(page.getByRole('heading', { name: 'Find your next place' })).toBeVisible()
  await expect(page.locator('.skeleton-card')).toHaveCount(0)
  await page.getByRole('button', { name: /filters/i }).click()
}

test.describe('UI · Search page advanced filter states · 6 cases', () => {
  test('minimum price field accepts a valid lower boundary', async ({ page }) => {
    await openFilters(page)
    await page.getByPlaceholder('No minimum').fill('1000000')
    await expect(page.getByPlaceholder('No minimum')).toHaveValue('1000000')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.locator('.results-toolbar')).toBeVisible()
  })

  test('maximum price field accepts a valid upper boundary', async ({ page }) => {
    await openFilters(page)
    await page.getByPlaceholder('No maximum').fill('50000000')
    await expect(page.getByPlaceholder('No maximum')).toHaveValue('50000000')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.locator('.results-toolbar')).toBeVisible()
  })

  test('bedroom selector preserves a three-bedroom minimum', async ({ page }) => {
    await openFilters(page)
    await page.getByLabel('Bedrooms').selectOption('3')
    await expect(page.getByLabel('Bedrooms')).toHaveValue('3')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.locator('.results-toolbar')).toBeVisible()
  })

  test('bathroom selector preserves a two-bathroom minimum', async ({ page }) => {
    await openFilters(page)
    await page.getByLabel('Bathrooms').selectOption('2')
    await expect(page.getByLabel('Bathrooms')).toHaveValue('2')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.locator('.results-toolbar')).toBeVisible()
  })

  test('minimum area control accepts a square-foot boundary', async ({ page }) => {
    await openFilters(page)
    await page.getByLabel('Min area (sq ft)').fill('1500')
    await expect(page.getByLabel('Min area (sq ft)')).toHaveValue('1500')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.locator('.results-toolbar')).toBeVisible()
  })

  test('clear filters resets location, purpose, and advanced numeric values', async ({ page }) => {
    await openFilters(page)
    await page.getByPlaceholder('e.g. Islamabad').fill('Islamabad')
    await page.locator('label').filter({ hasText: 'Looking to' }).locator('select').selectOption('RENT')
    await page.getByPlaceholder('No minimum').fill('250000')
    await page.getByRole('button', { name: /clear filters/i }).click()
    await expect(page.getByPlaceholder('e.g. Islamabad')).toHaveValue('')
    await expect(page.locator('label').filter({ hasText: 'Looking to' }).locator('select')).toHaveValue('')
    await expect(page.getByPlaceholder('No minimum')).toHaveValue('')
  })
})
