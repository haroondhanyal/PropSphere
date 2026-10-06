import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createUnauthorizedLocators } from '../../locators/system/unauthorized.locators.js'

export class UnauthorizedPage extends ScreenPage {
  readonly locators: ReturnType<typeof createUnauthorizedLocators>
  constructor(page: Page) {
    super(page, '/unauthorized')
    this.locators = createUnauthorizedLocators(page)
  }
}
