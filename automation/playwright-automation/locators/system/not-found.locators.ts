import type { Page } from '@playwright/test'

export const createNotFoundLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /This\ page\ isn’t\ here/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
