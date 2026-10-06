import type { Page } from '@playwright/test'

export const createViewingsLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Viewings\ calendar/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
