import { test, expect } from '@playwright/test'
import { signInForUi } from '../../utils/auth.js'
import { installLifecycleHooks } from './hooks.js'

installLifecycleHooks(test, true)

const viewports = [
  { name: 'wide desktop', width: 1440, height: 900 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'laptop', width: 1024, height: 768 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'small mobile', width: 360, height: 740 },
]

export function defineScreenUiCoverage(screen: { name: string; path: string; requiresAdmin?: boolean }) {
  const open = async (page: import('@playwright/test').Page) => {
    if (screen.requiresAdmin) await signInForUi(page, 'admin')
    await page.goto(screen.path)
  }

  test.describe(`UI · ${screen.name} responsive and accessibility coverage · 10 cases`, () => {
    for (const viewport of viewports) test(`${screen.name} renders at ${viewport.name} ${viewport.width}px width`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await open(page)
      await expect(page.locator('main').first()).toBeVisible()
      const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
      expect(documentWidth, `${screen.name} should fit the ${viewport.width}px viewport`).toBeLessThanOrEqual(viewport.width + 8)
    })

    test(`${screen.name} exposes a visible primary page heading`, async ({ page }) => {
      await open(page)
      await expect(page.getByRole('heading').first()).toBeVisible()
    })

    test(`${screen.name} exposes its portal identity`, async ({ page }) => {
      await open(page)
      if (screen.path.startsWith('/admin')) {
        await expect(page.locator('.admin-brand')).toBeVisible()
        await expect(page.locator('.admin-brand')).toContainText(/PropSphere/i)
      } else if (screen.path.startsWith('/workspace')) {
        await expect(page.locator('.workspace-heading h1')).toBeVisible()
      } else {
        await expect(page.locator('.brand img[alt*="PropSphere"], .login-logo[alt*="PropSphere"], a:has-text("PropSphere")').first()).toBeVisible()
      }
    })

    test(`${screen.name} keeps a useful browser document title`, async ({ page }) => {
      await open(page)
      await expect(page.locator('main').first()).toBeVisible()
      expect(await page.title()).toMatch(/propsphere/i)
    })

    test(`${screen.name} supports keyboard focus on visible controls`, async ({ page }) => {
      await open(page)
      await page.keyboard.press('Tab')
      await expect(page.locator(':focus')).toBeVisible()
    })
  })
}
