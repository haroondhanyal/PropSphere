import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createContactLocators } from '../../locators/public/contact.locators.js'

export class ContactPage extends ScreenPage {
  readonly locators: ReturnType<typeof createContactLocators>
  constructor(page: Page) {
    super(page, '/contact')
    this.locators = createContactLocators(page)
  }
}
