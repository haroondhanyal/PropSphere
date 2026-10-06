import { test, expect } from '@playwright/test'
import { ForgotPasswordPage } from '../../../../pages/auth/forgot-password.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('ForgotPassword screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new ForgotPasswordPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/forgot\-password')
  })

  test('ForgotPassword page exposes its email control', async ({ page }) => {
    const screen = new ForgotPasswordPage(page)
    await screen.open()
    await expect(screen.locators.emailInput).toBeVisible()
  })
})
