import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createPlansLocators } from '../../locators/public/plans.locators.js'

export class PlansPage extends ScreenPage {
  readonly locators: ReturnType<typeof createPlansLocators>
  constructor(page: Page) {
    super(page, '/plans')
    this.locators = createPlansLocators(page)
  }
}
