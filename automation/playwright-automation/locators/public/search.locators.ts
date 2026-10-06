import type { Page } from '@playwright/test'

export const createSearchLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Find\ your\ next\ place/i }).first(),
  main: page.locator('main, .login-layout').first(),
  queryInput: page.getByPlaceholder('e.g. house in F-11'),
  cityInput: page.getByPlaceholder('e.g. Islamabad'),
  minPrice: page.getByLabel('Min price (PKR)'),
  maxPrice: page.getByLabel('Max price (PKR)'),
  minArea: page.getByLabel('Min area (sq ft)'),
  maxArea: page.getByLabel('Max area (sq ft)'),
  filterButton: page.getByRole('button',{name:/filters/i}),
})
