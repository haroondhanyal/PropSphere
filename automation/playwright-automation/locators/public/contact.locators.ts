import type { Page } from '@playwright/test'

export const createContactLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Tell\ us\ what\ you’re\ looking\ for\./i }).first(),
  main: page.locator('main, .login-layout').first(),
  nameInput: page.getByPlaceholder('Your name'),
  emailInput: page.getByPlaceholder('you@example.com'),
})
