import type { Page } from '@playwright/test'

export const createDevelopmentsLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Development\ inventory/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
