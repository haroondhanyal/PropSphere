import type { Page } from '@playwright/test'

export const createPortfolioLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Property\ portfolio/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
