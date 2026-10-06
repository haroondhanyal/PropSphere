import type { Page } from '@playwright/test'

export const createWorkspaceHomeLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /At\ a\ glance/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
