import { test, expect } from '@playwright/test'
import { AdminOverviewPage } from '../../../../pages/admin/admin-overview.page.js'
import { signInForUi } from '../../../../utils/auth.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('AdminOverview screen', () => {
  async function openAdmin(page: import('@playwright/test').Page) {
    await signInForUi(page, 'admin')
    const screen = new AdminOverviewPage(page)
    await screen.open()
    return screen
  }

  test('loads its own route and section heading', async ({ page }) => {
    const screen = await openAdmin(page)
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/admin')
  })

  test('Users and roles tab shows the organization member list', async ({ page }) => {
    const screen = await openAdmin(page)
    await screen.locators.usersTab.click()
    await expect(page.getByRole('heading', { name: 'Team access' })).toBeVisible()
  })

  test('Risk review tab shows its risk flag form', async ({ page }) => {
    const screen = await openAdmin(page)
    await screen.locators.riskTab.click()
    await expect(page.getByRole('heading', { name: 'Flag an item for review' })).toBeVisible()
  })

  test('Audit history tab shows organization activity', async ({ page }) => {
    const screen = await openAdmin(page)
    await screen.locators.auditTab.click()
    await expect(page.getByRole('heading', { name: 'Recent organization activity' })).toBeVisible()
  })

  test('Settings tab shows organization contact settings', async ({ page }) => {
    const screen = await openAdmin(page)
    await screen.locators.settingsTab.click()
    await expect(page.getByRole('heading', { name: 'Organization settings' })).toBeVisible()
  })
})
