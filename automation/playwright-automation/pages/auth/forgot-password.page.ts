import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createForgotPasswordLocators } from '../../locators/auth/forgot-password.locators.js'

export class ForgotPasswordPage extends ScreenPage {
  readonly locators: ReturnType<typeof createForgotPasswordLocators>
  constructor(page: Page) {
    super(page, '/forgot-password')
    this.locators = createForgotPasswordLocators(page)
  }
}
