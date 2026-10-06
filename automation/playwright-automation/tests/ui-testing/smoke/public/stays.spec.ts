import { test, expect } from '@playwright/test'
import { StaysPage } from '../../../../pages/public/stays.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Stays screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new StaysPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/stays')
  })

  test('Stays page exposes its city control', async ({ page }) => {
    const screen = new StaysPage(page)
    await screen.open()
    await expect(screen.locators.cityInput).toBeVisible()
  })
})
