import type { Page } from '@playwright/test'

export const createSavedSearchesLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Saved\ searches\ and\ alerts/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
