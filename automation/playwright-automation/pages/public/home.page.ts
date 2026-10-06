import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createHomeLocators } from '../../locators/public/home.locators.js'

export class HomePage extends ScreenPage {
  readonly locators: ReturnType<typeof createHomeLocators>
  constructor(page: Page) {
    super(page, '/')
    this.locators = createHomeLocators(page)
  }
}
