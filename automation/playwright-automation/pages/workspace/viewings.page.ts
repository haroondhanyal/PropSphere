import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createViewingsLocators } from '../../locators/workspace/viewings.locators.js'

export class ViewingsPage extends ScreenPage {
  readonly locators: ReturnType<typeof createViewingsLocators>
  constructor(page: Page) {
    super(page, '/workspace/viewings')
    this.locators = createViewingsLocators(page)
  }
}
