import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createFeaturesLocators } from '../../locators/public/features.locators.js'

export class FeaturesPage extends ScreenPage {
  readonly locators: ReturnType<typeof createFeaturesLocators>
  constructor(page: Page) {
    super(page, '/features')
    this.locators = createFeaturesLocators(page)
  }
}
