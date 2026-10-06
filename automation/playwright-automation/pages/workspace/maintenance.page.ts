import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createMaintenanceLocators } from '../../locators/workspace/maintenance.locators.js'

export class MaintenancePage extends ScreenPage {
  readonly locators: ReturnType<typeof createMaintenanceLocators>
  constructor(page: Page) {
    super(page, '/workspace/maintenance')
    this.locators = createMaintenanceLocators(page)
  }
}
