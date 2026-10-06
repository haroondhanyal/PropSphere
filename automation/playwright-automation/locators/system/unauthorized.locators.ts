import type { Page } from '@playwright/test'

export const createUnauthorizedLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /This\ workspace\ needs\ another\ role/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
