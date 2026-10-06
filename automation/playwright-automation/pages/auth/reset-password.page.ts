import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createResetPasswordLocators } from '../../locators/auth/reset-password.locators.js'

export class ResetPasswordPage extends ScreenPage {
  readonly locators: ReturnType<typeof createResetPasswordLocators>
  constructor(page: Page) {
    super(page, '/reset-password?token=e2e-invalid-token')
    this.locators = createResetPasswordLocators(page)
  }
}
