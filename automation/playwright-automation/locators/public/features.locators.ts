import type { Page } from '@playwright/test'

export const createFeaturesLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /The\ tools\ around\ the\ property,\ all\ connected\./i }).first(),
  main: page.locator('main, .login-layout').first(),

})
