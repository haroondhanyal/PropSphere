import type { Page } from '@playwright/test'

export const createListPropertyLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /List\ your\ property/i }).first(),
  main: page.locator('main, .login-layout').first(),
  titleInput: page.getByPlaceholder(/family home|property title/i),
})
