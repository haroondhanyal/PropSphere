import { test, expect } from '@playwright/test'
import { WorkspaceStaysPage } from '../../../../pages/workspace/workspace-stays.page.js'
import { signInForUi } from '../../../../utils/auth.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('WorkspaceStays screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    await signInForUi(page, 'admin')
    const screen = new WorkspaceStaysPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/workspace/stays')
  })

  test('WorkspaceStays page has a useful next step', async ({ page }) => {
    await signInForUi(page, 'admin')
    const screen = new WorkspaceStaysPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    await expect(screen.locators.main.locator('a[href], button').first()).toBeVisible()
  })
})
