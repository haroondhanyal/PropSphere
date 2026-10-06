import type { Page } from '@playwright/test'

export const createDealsLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Offers\ and\ rental\ applications/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
