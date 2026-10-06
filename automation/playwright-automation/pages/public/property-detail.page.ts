import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createPropertyDetailLocators } from '../../locators/public/property-detail.locators.js'

export class PropertyDetailPage extends ScreenPage {
  readonly locators: ReturnType<typeof createPropertyDetailLocators>
  constructor(page: Page) {
    super(page, '/property/sunlit-apartment-f-11')
    this.locators = createPropertyDetailLocators(page)
  }
}
