import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createLeadsLocators } from '../../locators/workspace/leads.locators.js'

export class LeadsPage extends ScreenPage {
  readonly locators: ReturnType<typeof createLeadsLocators>
  constructor(page: Page) {
    super(page, '/workspace/leads')
    this.locators = createLeadsLocators(page)
  }
}
