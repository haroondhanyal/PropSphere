import { test, expect } from '@playwright/test'
import { LoginPage } from '../../../pages/auth/login.page.js'
import { SignupPage } from '../../../pages/auth/signup.page.js'
import { newOrganization } from '../../../utils/faker.js'
import { installLifecycleHooks } from '../../support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Authentication form behavior', () => {
  test('login password reveal button switches input visibility and accessible label', async ({ page }) => {
    const login = new LoginPage(page)
    await login.open()
    await expect(login.locators.passwordInput).toHaveAttribute('type', 'password')
    await login.locators.passwordToggle.click()
    await expect(login.locators.passwordInput).toHaveAttribute('type', 'text')
    await expect(page.getByRole('button', { name: 'Hide password' })).toBeVisible()
  })

  test('signup captures a generated organization and radio account type without submitting', async ({ page }) => {
    const signup = new SignupPage(page)
    const record = newOrganization()
    await signup.open()
    await signup.locators.nameInput.fill(record.name)
    await signup.locators.emailInput.fill(record.email)
    await signup.locators.organizationInput.fill(record.organization)
    await page.getByRole('radio', { name: /owner/i }).check()
    await expect(signup.locators.nameInput).toHaveValue(record.name)
    await expect(page.getByRole('radio', { name: /owner/i })).toBeChecked()
    await expect(signup.locators.passwordInput).toHaveAttribute('minlength', '10')
  })

  test('password recovery validates email format before submission', async ({ page }) => {
    await page.goto('/forgot-password')
    const email = page.getByPlaceholder('you@example.com')
    await email.fill('not-an-email')
    expect(await email.evaluate((input: HTMLInputElement) => input.validity.typeMismatch)).toBeTruthy()
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeEnabled()
  })
})
