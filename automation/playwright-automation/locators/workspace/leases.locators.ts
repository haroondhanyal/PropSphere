import type { Page } from '@playwright/test'

export const createLeasesLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Lease\ register/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
