import { test, expect } from '@playwright/test'
import { signInForUi } from '../../../utils/auth.js'
import { installLifecycleHooks } from '../../support/hooks.js'

installLifecycleHooks(test, true)

test('admin can move between workspace leads, finance, and the admin console', async ({ page }) => {
  await signInForUi(page, 'admin')
  await page.goto('/workspace')
  await page.getByRole('link', { name: 'Leads', exact: true }).click()
  await expect(page).toHaveURL(/\/workspace\/leads$/)
  await expect(page.getByRole('heading', { name: 'Sales pipeline' })).toBeVisible()
  await page.getByRole('link', { name: 'Finance' }).click()
  await expect(page).toHaveURL(/\/workspace\/finance$/)
  await expect(page.getByRole('heading', { name: 'Finance and reporting' })).toBeVisible()
  await page.getByRole('link', { name: 'Admin', exact: true }).click()
  await expect(page).toHaveURL(/\/admin$/)
  await expect(page.getByRole('heading', { name: 'Admin workspace' })).toBeVisible()
})
