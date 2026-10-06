import type { Page } from '@playwright/test'

export const createWorkspaceStaysLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Short\ stays/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
