import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createLoginLocators } from '../../locators/auth/login.locators.js'

export class LoginPage extends ScreenPage {
  readonly locators: ReturnType<typeof createLoginLocators>
  constructor(page: Page) {
    super(page, '/login')
    this.locators = createLoginLocators(page)
  }
}
