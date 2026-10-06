import type { Page } from '@playwright/test'

export const createHomeLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Featured\ properties/i }).first(),
  main: page.locator('main, .login-layout').first(),
  heroSearch: page.getByPlaceholder('House name, city, or area'),
  searchButton: page.locator('.search-submit'),
})
