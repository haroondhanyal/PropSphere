import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createNotFoundLocators } from '../../locators/system/not-found.locators.js'

export class NotFoundPage extends ScreenPage {
  readonly locators: ReturnType<typeof createNotFoundLocators>
  constructor(page: Page) {
    super(page, '/not-found')
    this.locators = createNotFoundLocators(page)
  }
}
