import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export class ScreenPage {
  constructor(protected readonly page: Page, readonly path: string) {}
  async open() { await this.page.goto(this.path) }
  async expectLoaded(heading: Locator) { await expect(heading).toBeVisible(); await expect(this.page.locator('body')).not.toBeEmpty() }
}
