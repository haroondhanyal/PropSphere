import { test, expect } from '@playwright/test'
import { LoginPage } from '../../../../pages/auth/login.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Login screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new LoginPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/login')
  })

  test('Login page exposes its email control', async ({ page }) => {
    const screen = new LoginPage(page)
    await screen.open()
    await expect(screen.locators.emailInput).toBeVisible()
  })
})
