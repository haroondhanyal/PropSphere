import { test, expect } from '@playwright/test'
import { AboutPage } from '../../../../pages/public/about.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('About screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new AboutPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/about')
  })

  test('About page has a useful next step', async ({ page }) => {
    const screen = new AboutPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    await expect(screen.locators.main.locator('a[href], button').first()).toBeVisible()
  })
})
