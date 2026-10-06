import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createSavedSearchesLocators } from '../../locators/workspace/saved-searches.locators.js'

export class SavedSearchesPage extends ScreenPage {
  readonly locators: ReturnType<typeof createSavedSearchesLocators>
  constructor(page: Page) {
    super(page, '/workspace/searches')
    this.locators = createSavedSearchesLocators(page)
  }
}
