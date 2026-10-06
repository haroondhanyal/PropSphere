import { test, expect } from '@playwright/test'
import { SearchPage } from '../../../../pages/public/search.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Search screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new SearchPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/search')
  })

  test('Search page exposes its query control', async ({ page }) => {
    const screen = new SearchPage(page)
    await screen.open()
    await expect(screen.locators.queryInput).toBeVisible()
  })
})
