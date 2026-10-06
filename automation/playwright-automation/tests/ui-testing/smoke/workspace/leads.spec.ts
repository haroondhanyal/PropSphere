import { test, expect } from '@playwright/test'
import { LeadsPage } from '../../../../pages/workspace/leads.page.js'
import { signInForUi } from '../../../../utils/auth.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Leads screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    await signInForUi(page, 'admin')
    const screen = new LeadsPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/workspace/leads')
  })

  test('Leads page exposes its task control', async ({ page }) => {
    await signInForUi(page, 'admin')
    const screen = new LeadsPage(page)
    await screen.open()
    await expect(screen.locators.taskInput).toBeVisible()
  })
})
