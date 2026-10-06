import 'dotenv/config'
import { defineConfig, devices } from '@playwright/test'
import { env } from './env.js'

export const playwrightConfig = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: env.timeoutMs,
  expect: { timeout: 7_000 },
  reporter: [
    ['list'],
    ['allure-playwright', { resultsDir: './allure-results', detail: true, suiteTitle: true, environmentInfo: { product: 'PropSphere', qa: 'Raja Haroon Jamal', department: 'QA Department', role: 'Full Stack QA Automation Tester' } }],
    ['html', { outputFolder: './playwright-report', open: 'never' }],
  ],
  outputDir: './test-results',
  use: {
    baseURL: env.webUrl,
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    ...devices['Desktop Chrome'],
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
