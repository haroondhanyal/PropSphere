import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { config } from 'dotenv'

const baseUrl = process.env.REPORT_BASE_URL || 'http://127.0.0.1:4178'
const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)))
const output = resolve(scriptDir, '../../../docs/screenshots/automation')
const projectOutput = resolve(scriptDir, '../../../docs/screenshots')
const webUrl = process.env.WEB_BASE_URL || 'http://127.0.0.1:5174'
config({ path: resolve(scriptDir, '../.env'), quiet: true })
await mkdir(output, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })

async function capture(name, directory = output) {
  await page.screenshot({ path: resolve(directory, name), fullPage: true, type: 'jpeg', quality: 78, animations: 'disabled' })
  console.log(`Captured ${name}`)
}

try {
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  await capture('qa-report-center.jpg')

  await page.goto(`${baseUrl}/allure/index.html`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  await capture('allure-overview.jpg')

  for (const [label, file] of [
    ['Categories', 'allure-categories.jpg'],
    ['Suites', 'allure-suites.jpg'],
    ['Behaviors', 'allure-behaviors.jpg'],
    ['Packages', 'allure-packages.jpg'],
    ['Graphs', 'allure-graphs.jpg'],
    ['Timeline', 'allure-timeline.jpg'],
  ]) {
    const link = page.locator('.side-nav__link').filter({ hasText: label }).first()
    await link.click()
    await page.waitForTimeout(900)
    if (label === 'Suites') {
      await page.getByText('chromium', { exact: true }).click()
      await page.waitForTimeout(500)
    }
    if (label === 'Packages') {
      await page.getByText('@propsphere/playwright-automation', { exact: true }).click()
      await page.waitForTimeout(500)
    }
    await capture(file)
    if (label === 'Behaviors') {
      await page.getByText('About exposes a visible primary page heading', { exact: true }).click()
      await page.waitForTimeout(700)
      await capture('allure-test-case-details.jpg')
    }
  }

  await page.goto(`${baseUrl}/performance/index.html`, { waitUntil: 'networkidle' })
  await capture('k6-performance-dashboard.jpg')
  await page.goto(`${baseUrl}/performance/index.html?case=K6-001`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await capture('k6-case-execution-detail.jpg')
  await page.goto(`${baseUrl}/performance/native-k6-report.html`, { waitUntil: 'networkidle' })
  await capture('k6-native-report.jpg')

  await page.goto(webUrl, { waitUntil: 'networkidle' })
  const publicBrand = await page.evaluate(async () => {
    const favicon = document.querySelector('link[rel="icon"]')?.getAttribute('href')
    const response = favicon ? await fetch(favicon) : null
    const logo = document.querySelector('header .brand img[alt="PropSphere"]')
    return { title: document.title, faviconLoaded: response?.ok || false, wordmarkLoaded: Boolean(logo && logo.naturalWidth > 0) }
  })
  if (!publicBrand.faviconLoaded || !publicBrand.wordmarkLoaded) throw new Error(`Public PropSphere logo check failed: ${JSON.stringify(publicBrand)}`)
  await capture('propsphere-homepage-2026-10-07.jpg', projectOutput)

  await page.goto(`${webUrl}/login?portal=admin`, { waitUntil: 'networkidle' })
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!email || !password) throw new Error('Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD in automation/playwright-automation/.env to capture the protected admin view.')
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await page.waitForURL('**/admin', { timeout: 15_000 })
  const adminLogoLoaded = await page.locator('.admin-brand-mark').evaluate((image) => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0)
  if (!adminLogoLoaded) throw new Error('Admin sidebar PropSphere logo did not load.')
  await page.locator('.loading-row').waitFor({ state: 'hidden', timeout: 15_000 })
  await capture('propsphere-admin-overview-2026-10-07.jpg', projectOutput)
} finally {
  await browser.close()
}
