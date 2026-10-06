import type { Page } from '@playwright/test'

export const createVendorBillsLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Vendor\ invoices/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
