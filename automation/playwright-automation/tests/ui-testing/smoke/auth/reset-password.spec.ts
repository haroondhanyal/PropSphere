import { test, expect } from '@playwright/test'
import { ResetPasswordPage } from '../../../../pages/auth/reset-password.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('ResetPassword screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new ResetPasswordPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/reset\-password')
  })

  test('ResetPassword page exposes its password control', async ({ page }) => {
    const screen = new ResetPasswordPage(page)
    await screen.open()
    await expect(screen.locators.passwordInput).toBeVisible()
  })
})
