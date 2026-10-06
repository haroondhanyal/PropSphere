import type { Page } from '@playwright/test'
import * as allure from 'allure-js-commons'

export function installLifecycleHooks(testType: any, withVisualEvidence = false) {
  testType.beforeEach(async ({}, info: any) => {
    try {
      await info.attach('before-hook-test-context.json', {
        body: Buffer.from(JSON.stringify({ title: info.title, retry: info.retry, startedAt: new Date().toISOString() }, null, 2)),
        contentType: 'application/json',
      })
    } catch { /* Evidence should never turn a completed test into a hook failure. */ }
  })
  if (withVisualEvidence) testType.afterEach(async ({ page }: { page: Page }, _info: any) => {
    if (!page) return
    try {
      if (!page.isClosed()) {
        await allure.attachment('Screen capture', await page.screenshot({ fullPage: true }), { contentType: 'image/png' })
      }
    } catch { /* Keep evidence failures from changing the test outcome. */ }

    let video: ReturnType<Page['video']> = null
    try { video = page.video() } catch { /* Context may already be closing. */ }

    // Closing the page finalizes its recording. Playwright may already have
    // torn the context down after a browser crash, so treat this as best effort.
    try { if (!page.isClosed()) await page.close() } catch { /* Context already closed. */ }
    if (video) {
      try {
        await allure.attachmentPath('Session video', await video.path(), { contentType: 'video/webm' })
      } catch { /* Preserve the result if Chromium could not finalize the video. */ }
    }
  })
  testType.afterEach(async ({}, info: any) => {
    try {
      await info.attach('after-hook-test-summary.json', {
        body: Buffer.from(JSON.stringify({ title: info.title, status: info.status, durationMs: info.duration, retry: info.retry }, null, 2)),
        contentType: 'application/json',
      })
    } catch { /* A closed reporter context must not fail the test run. */ }
  })
}
