import { test, expect } from '@playwright/test'
import { PlansPage } from '../../../../pages/public/plans.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Plans screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new PlansPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/plans')
  })

  test('Plans page has a useful next step', async ({ page }) => {
    const screen = new PlansPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    await expect(screen.locators.main.locator('a[href], button').first()).toBeVisible()
  })
})
