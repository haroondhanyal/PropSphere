import type { Page } from '@playwright/test'

export const createAboutLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Property\ decisions,\ with\ a\ clearer\ path\ forward\./i }).first(),
  main: page.locator('main, .login-layout').first(),

})
