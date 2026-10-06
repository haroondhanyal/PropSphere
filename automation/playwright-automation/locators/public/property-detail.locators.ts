import type { Page } from '@playwright/test'

export const createPropertyDetailLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /About\ this\ property/i }).first(),
  main: page.locator('main, .login-layout').first(),
  saveButton: page.getByRole('button', { name: 'Save property', exact: true }).first(),
  inquiryButton: page.getByRole('button',{name:/inquir|contact/i}),
})
