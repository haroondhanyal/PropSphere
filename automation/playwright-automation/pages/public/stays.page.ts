import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createStaysLocators } from '../../locators/public/stays.locators.js'

export class StaysPage extends ScreenPage {
  readonly locators: ReturnType<typeof createStaysLocators>
  constructor(page: Page) {
    super(page, '/stays')
    this.locators = createStaysLocators(page)
  }
}
