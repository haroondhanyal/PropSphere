import { test, expect } from '@playwright/test'
import { SignupPage } from '../../../../pages/auth/signup.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Signup screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new SignupPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/signup')
  })

  test('Signup page exposes its name control', async ({ page }) => {
    const screen = new SignupPage(page)
    await screen.open()
    await expect(screen.locators.nameInput).toBeVisible()
  })
})
