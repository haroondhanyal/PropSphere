import { test, expect } from '@playwright/test'
import { signInForUi } from '../../../../utils/auth.js'
import { installLifecycleHooks } from '../../../support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Access-control negative paths', () => {
  test('anonymous visitor opening admin is redirected to the admin login portal', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login\?portal=admin/)
    await expect(page.getByRole('heading', { name: 'Sign in as Admin' })).toBeVisible()
  })

  test('buyer session is refused by the organization admin console', async ({ page }) => {
    await signInForUi(page, 'buyer')
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/unauthorized$/)
    await expect(page.getByRole('heading', { name: 'This workspace needs another role' })).toBeVisible()
  })

  test('invalid sign-in keeps the customer on the login form and shows an error', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill('invalid@example.test')
    await page.getByPlaceholder('Your password').fill('DefinitelyWrong!123')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByText(/could not sign in|invalid|incorrect|credentials/i)).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })
})
