import type { Page } from '@playwright/test'

export const createLoginLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Sign\ in\ to\ your\ account/i }).first(),
  main: page.locator('main, .login-layout').first(),
  emailInput: page.getByPlaceholder('you@example.com'),
  passwordInput: page.getByPlaceholder('Your password'),
  submitButton: page.getByRole('button',{name:/sign in/i}),
  passwordToggle: page.getByRole('button', { name: 'Show password' }),
})
