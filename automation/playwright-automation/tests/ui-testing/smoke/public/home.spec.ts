import { test, expect } from '@playwright/test'
import { HomePage } from '../../../../pages/public/home.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Home screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new HomePage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/')
  })

  test('Home page exposes its herosearch control', async ({ page }) => {
    const screen = new HomePage(page)
    await screen.open()
    await expect(screen.locators.heroSearch).toBeVisible()
  })
})
