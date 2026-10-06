import { test, expect } from '@playwright/test'
import { SearchPage } from '../../pages/public/search.page.js'
import { SignupPage } from '../../pages/auth/signup.page.js'
import { AdminOverviewPage } from '../../pages/admin/admin-overview.page.js'
import { signInForUi } from '../../utils/auth.js'
import { installLifecycleHooks } from '../support/hooks.js'

installLifecycleHooks(test, true)

test.describe('BDD · distinct marketplace and admin journeys', () => {
  test('Given a buyer wants a sale home, when they choose sale, then sale filters and listings are shown', async ({ page }) => {
    const search = new SearchPage(page)
    await test.step('Given the buyer opens Buy results', () => page.goto('/search?purpose=SALE'))
    await test.step('When sale is selected and the results are refreshed', async () => {
      await expect(page.locator('label').filter({ hasText: 'Looking to' }).locator('select')).toHaveValue('SALE')
      await page.getByRole('button', { name: 'Search', exact: true }).click()
    })
    await test.step('Then listing results are presented for purchase', async () => {
      await expect(page.getByText(/Showing \d+ published listing/)).toBeVisible()
      await expect(search.locators.heading).toBeVisible()
    })
  })

  test('Given a renter wants an apartment, when the rent filter is applied, then rental listings remain visible', async ({ page }) => {
    await page.goto('/search?purpose=RENT&type=APARTMENT')
    await expect(page.locator('label').filter({ hasText: 'Looking to' }).locator('select')).toHaveValue('RENT')
    await expect(page.locator('label').filter({ hasText: 'Property type' }).locator('select')).toHaveValue('APARTMENT')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(page.getByText(/Showing \d+ published listing/)).toBeVisible()
  })

  test('Given a guest opens filters, when they expand advanced search, then budget and area controls appear', async ({ page }) => {
    const search = new SearchPage(page)
    await search.open()
    await search.locators.filterButton.click()
    await expect(page.getByPlaceholder('No minimum')).toBeVisible()
    await expect(page.getByPlaceholder('No maximum')).toBeVisible()
    await expect(search.locators.minArea).toBeVisible()
  })

  test('Given a guest searches in Islamabad, when results load, then the search term stays in the filter', async ({ page }) => {
    const search = new SearchPage(page)
    await search.open()
    await search.locators.cityInput.fill('Islamabad')
    await page.getByRole('button', { name: 'Search', exact: true }).click()
    await expect(search.locators.cityInput).toHaveValue('Islamabad')
    await expect(page.getByText(/Showing \d+ published listing/)).toBeVisible()
  })

  test('Given a new customer opens signup, when they choose Tenant, then that account type is selected', async ({ page }) => {
    const signup = new SignupPage(page)
    await signup.open()
    await page.getByLabel('Tenant', { exact: false }).check()
    await expect(page.getByRole('radio', { name: /tenant/i })).toBeChecked()
    await expect(signup.locators.organizationInput).toBeVisible()
  })

  test('Given a guest opens the admin entry, when they choose admin sign-in, then the admin portal is identified', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: 'Sign in as Admin' }).click()
    await expect(page).toHaveURL(/portal=admin/)
    await expect(page.getByRole('heading', { name: 'Sign in as Admin' })).toBeVisible()
  })

  test('Given a visitor requests the workspace directly, when no session exists, then they are sent to sign-in', async ({ page }) => {
    await page.goto('/workspace/finance')
    await expect(page).toHaveURL(/\/login\?next=/)
    await expect(page.getByRole('heading', { name: 'Sign in to your account' })).toBeVisible()
  })

  test('Given an organization admin opens the console, when they select listing review, then pending listings are shown', async ({ page }) => {
    await signInForUi(page, 'admin')
    const admin = new AdminOverviewPage(page)
    await admin.open()
    await page.getByRole('link', { name: 'Listing approvals' }).click()
    await expect(page).toHaveURL(/\/admin\/review$/)
    await expect(page.getByRole('heading', { name: 'Listing review' })).toBeVisible()
  })
})
