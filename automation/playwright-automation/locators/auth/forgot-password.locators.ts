import type { Page } from '@playwright/test'

export const createForgotPasswordLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Forgot\ your\ password\?/i }).first(),
  main: page.locator('main, .login-layout').first(),
  emailInput: page.getByPlaceholder('you@example.com'),
  submitButton: page.getByRole('button',{name:/send|reset|continue/i}),
})
