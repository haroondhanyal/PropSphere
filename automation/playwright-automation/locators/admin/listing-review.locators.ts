import type { Page } from '@playwright/test'

export const createListingReviewLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Listing\ review/i }).first(),
  main: page.locator('main, .login-layout').first(),

})
