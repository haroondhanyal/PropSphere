import type { Page } from '@playwright/test'

export const createMaintenanceLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Maintenance\ desk/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
