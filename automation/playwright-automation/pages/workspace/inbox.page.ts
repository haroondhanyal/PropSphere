import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createInboxLocators } from '../../locators/workspace/inbox.locators.js'

export class InboxPage extends ScreenPage {
  readonly locators: ReturnType<typeof createInboxLocators>
  constructor(page: Page) {
    super(page, '/workspace/inbox')
    this.locators = createInboxLocators(page)
  }
}
