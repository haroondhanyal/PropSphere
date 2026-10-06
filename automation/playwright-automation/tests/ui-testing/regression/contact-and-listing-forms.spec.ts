import { test, expect } from '@playwright/test'
import { signInForUi } from '../../../utils/auth.js'
import { newContact, newProperty } from '../../../utils/faker.js'
import { installLifecycleHooks } from '../../support/hooks.js'

installLifecycleHooks(test, true)

test.describe('Contact and listing form validation', () => {
  test('contact form accepts a named contact while requiring a topic and message', async ({ page }) => {
    const contact = newContact()
    await page.goto('/contact')
    await page.getByPlaceholder('Your name').fill(contact.name)
    await page.getByPlaceholder('you@example.com').fill(contact.email)
    const form = page.locator('form').first()
    expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBeFalsy()
    await page.getByLabel('What can we help with?').selectOption('Subscriptions')
    await page.getByPlaceholder('Share a little context so we can point you in the right direction.').fill(contact.message)
    expect(await form.evaluate((element: HTMLFormElement) => element.checkValidity())).toBeTruthy()
  })

  test('listing draft uses positive price and area values before any upload or submit', async ({ page }) => {
    await signInForUi(page, 'admin')
    await page.goto('/list-property')
    const property = newProperty()
    await page.getByPlaceholder('e.g. Bright family home in F-11').fill(property.title)
    await page.getByPlaceholder('e.g. F-11').fill(property.community)
    await page.getByPlaceholder('28500000').fill(String(property.price))
    await page.getByPlaceholder('1850').fill(String(property.areaSqft))
    await page.getByPlaceholder('Describe the property and its features…').fill(property.description)
    await expect(page.getByPlaceholder('28500000')).toHaveValue(String(property.price))
    await expect(page.getByPlaceholder('1850')).toHaveValue(String(property.areaSqft))
    expect(await page.locator('form').evaluate((form: HTMLFormElement) => form.checkValidity())).toBeTruthy()
  })
})
