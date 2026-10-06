import type { Page } from '@playwright/test'

export const createSignupLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Create\ your\ account/i }).first(),
  main: page.locator('main, .login-layout').first(),
  nameInput: page.getByPlaceholder('Your name'),
  emailInput: page.getByPlaceholder('you@example.com'),
  organizationInput: page.getByPlaceholder('Company, team, or personal'),
  accountTypes: page.getByRole('radiogroup',{name:'Choose account type'}),
  passwordInput: page.getByPlaceholder('At least 10 characters'),
})
