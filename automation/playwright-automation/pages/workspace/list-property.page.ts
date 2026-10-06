import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createListPropertyLocators } from '../../locators/workspace/list-property.locators.js'

export class ListPropertyPage extends ScreenPage {
  readonly locators: ReturnType<typeof createListPropertyLocators>
  constructor(page: Page) {
    super(page, '/list-property')
    this.locators = createListPropertyLocators(page)
  }
}
