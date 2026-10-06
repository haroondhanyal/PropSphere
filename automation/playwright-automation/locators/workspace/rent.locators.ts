import type { Page } from '@playwright/test'

export const createRentLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Rent\ ledger/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
