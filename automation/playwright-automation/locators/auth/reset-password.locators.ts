import type { Page } from '@playwright/test'

export const createResetPasswordLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Choose\ a\ new\ password/i }).first(),
  main: page.locator('main, .login-layout').first(),
  passwordInput: page.getByPlaceholder('At least 10 characters'),
  submitButton: page.getByRole('button',{name:/update|reset|save/i}),
})
