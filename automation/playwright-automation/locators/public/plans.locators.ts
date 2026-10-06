import type { Page } from '@playwright/test'

export const createPlansLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /A\ setup\ that\ fits\ how\ you\ work\ with\ property\./i }).first(),
  main: page.locator('main, .login-layout').first(),

})
