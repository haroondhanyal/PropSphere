import type { Page } from '@playwright/test'

export const createSalesTeamLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Team\ performance/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
