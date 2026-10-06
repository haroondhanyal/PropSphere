import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createFinanceLocators } from '../../locators/workspace/finance.locators.js'

export class FinancePage extends ScreenPage {
  readonly locators: ReturnType<typeof createFinanceLocators>
  constructor(page: Page) {
    super(page, '/workspace/finance')
    this.locators = createFinanceLocators(page)
  }
}
