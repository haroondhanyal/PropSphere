import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createAboutLocators } from '../../locators/public/about.locators.js'

export class AboutPage extends ScreenPage {
  readonly locators: ReturnType<typeof createAboutLocators>
  constructor(page: Page) {
    super(page, '/about')
    this.locators = createAboutLocators(page)
  }
}
