import { test, expect } from '@playwright/test'
import { FavoritesPage } from '../../../../pages/public/favorites.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Favorites screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new FavoritesPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/favorites')
  })

  test('Favorites page has a useful next step', async ({ page }) => {
    const screen = new FavoritesPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    await expect(screen.locators.main.locator('a[href], button').first()).toBeVisible()
  })
})
