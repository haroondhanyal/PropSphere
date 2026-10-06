import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createSignupLocators } from '../../locators/auth/signup.locators.js'

export class SignupPage extends ScreenPage {
  readonly locators: ReturnType<typeof createSignupLocators>
  constructor(page: Page) {
    super(page, '/signup')
    this.locators = createSignupLocators(page)
  }
}
