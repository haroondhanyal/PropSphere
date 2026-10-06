import { test, expect } from '@playwright/test'
import { ContactPage } from '../../../../pages/public/contact.page.js'
import { installLifecycleHooks } from '../../../../tests/support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Contact screen', () => {
  test('loads its own route and section heading', async ({ page }) => {
    const screen = new ContactPage(page)
    await screen.open()
    await screen.expectLoaded(screen.locators.heading)
    expect(new URL(page.url()).pathname).toBe('/contact')
  })

  test('Contact page exposes its name control', async ({ page }) => {
    const screen = new ContactPage(page)
    await screen.open()
    await expect(screen.locators.nameInput).toBeVisible()
  })
})
