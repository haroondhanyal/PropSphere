import { test, expect } from '@playwright/test'
import { PropertyDetailPage } from '../../../../pages/public/property-detail.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('PropertyDetail screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new PropertyDetailPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/property/sunlit\-apartment\-f\-11')
  })

  test('PropertyDetail page exposes its save control', async ({ page }) => {
    const screen = new PropertyDetailPage(page)
    await screen.open()
    await expect(screen.locators.saveButton).toBeVisible()
  })
})
