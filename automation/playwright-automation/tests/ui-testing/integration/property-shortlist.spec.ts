import { test, expect } from '@playwright/test'
import { installLifecycleHooks } from '../../support/hooks.js'

installLifecycleHooks(test, true)

test('visitor saves a result locally, sees it marked saved, and can undo the action', async ({ page }) => {
  await page.goto('/search?q=Sunlit%20apartment')
  const propertyCard = page.locator('.property-card').filter({ hasText: 'Sunlit apartment with a garden view' })
  await expect(propertyCard).toBeVisible()
  const favorite = propertyCard.getByRole('button', { name: 'Save property' })
  await favorite.click()
  await expect(propertyCard.getByRole('button', { name: 'Remove saved property' })).toBeVisible()
  await propertyCard.getByRole('button', { name: 'Remove saved property' }).click()
  await expect(propertyCard.getByRole('button', { name: 'Save property' })).toBeVisible()
})
