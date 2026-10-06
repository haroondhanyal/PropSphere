import type { Page } from '@playwright/test'

export const createLeadsLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Sales\ pipeline/i }).first(),
  main: page.locator('main, .login-layout').first(),
  taskInput: page.getByPlaceholder(/follow-up note/i).first(),
})
