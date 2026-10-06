import { test, expect } from '@playwright/test'
import { ListPropertyPage } from '../../../../pages/workspace/list-property.page.js'
import { signInForUi } from '../../../../utils/auth.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('ListProperty screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    await signInForUi(page, 'admin')
    const screen = new ListPropertyPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/list\-property')
  })

  test('ListProperty page exposes its title control', async ({ page }) => {
    await signInForUi(page, 'admin')
    const screen = new ListPropertyPage(page)
    await screen.open()
    await expect(screen.locators.titleInput).toBeVisible()
  })
})
