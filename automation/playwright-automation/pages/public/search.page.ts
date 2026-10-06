import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createSearchLocators } from '../../locators/public/search.locators.js'

export class SearchPage extends ScreenPage {
  readonly locators: ReturnType<typeof createSearchLocators>
  constructor(page: Page) {
    super(page, '/search')
    this.locators = createSearchLocators(page)
  }
}
