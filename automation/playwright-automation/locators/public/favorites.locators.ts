import type { Page } from '@playwright/test'

export const createFavoritesLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Saved\ properties/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
