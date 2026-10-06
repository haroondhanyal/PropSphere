import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createLeasesLocators } from '../../locators/workspace/leases.locators.js'

export class LeasesPage extends ScreenPage {
  readonly locators: ReturnType<typeof createLeasesLocators>
  constructor(page: Page) {
    super(page, '/workspace/leases')
    this.locators = createLeasesLocators(page)
  }
}
