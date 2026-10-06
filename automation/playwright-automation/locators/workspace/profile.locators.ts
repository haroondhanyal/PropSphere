import type { Page } from '@playwright/test'

export const createProfileLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Profile\ settings/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
