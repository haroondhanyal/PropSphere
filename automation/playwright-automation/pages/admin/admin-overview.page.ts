import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createAdminOverviewLocators } from '../../locators/admin/admin-overview.locators.js'

export class AdminOverviewPage extends ScreenPage {
  readonly locators: ReturnType<typeof createAdminOverviewLocators>
  constructor(page: Page) {
    super(page, '/admin')
    this.locators = createAdminOverviewLocators(page)
  }
}
