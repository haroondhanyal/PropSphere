import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createRentLocators } from '../../locators/workspace/rent.locators.js'

export class RentPage extends ScreenPage {
  readonly locators: ReturnType<typeof createRentLocators>
  constructor(page: Page) {
    super(page, '/workspace/rent')
    this.locators = createRentLocators(page)
  }
}
