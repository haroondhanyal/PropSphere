import { test, expect } from '@playwright/test'
import { NotFoundPage } from '../../../../pages/system/not-found.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('NotFound screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new NotFoundPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/not\-found')
  })

  test('NotFound page has a useful next step', async ({ page }) => {
    const screen = new NotFoundPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    await expect(screen.locators.main.locator('a[href], button').first()).toBeVisible()
  })
})
