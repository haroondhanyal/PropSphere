import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createDevelopmentsLocators } from '../../locators/workspace/developments.locators.js'

export class DevelopmentsPage extends ScreenPage {
  readonly locators: ReturnType<typeof createDevelopmentsLocators>
  constructor(page: Page) {
    super(page, '/workspace/developments')
    this.locators = createDevelopmentsLocators(page)
  }
}
