import type { Page } from '@playwright/test'

export const createFinanceLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Finance\ and\ reporting/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
