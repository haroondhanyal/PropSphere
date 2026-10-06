import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createSalesTeamLocators } from '../../locators/workspace/sales-team.locators.js'

export class SalesTeamPage extends ScreenPage {
  readonly locators: ReturnType<typeof createSalesTeamLocators>
  constructor(page: Page) {
    super(page, '/workspace/sales-team')
    this.locators = createSalesTeamLocators(page)
  }
}
