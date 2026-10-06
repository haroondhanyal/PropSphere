import type { Page } from '@playwright/test'

export const createInboxLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Inbox/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
