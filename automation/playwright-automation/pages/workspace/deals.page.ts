import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createDealsLocators } from '../../locators/workspace/deals.locators.js'

export class DealsPage extends ScreenPage {
  readonly locators: ReturnType<typeof createDealsLocators>
  constructor(page: Page) {
    super(page, '/workspace/deals')
    this.locators = createDealsLocators(page)
  }
}
