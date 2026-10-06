import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createProfileLocators } from '../../locators/workspace/profile.locators.js'

export class ProfilePage extends ScreenPage {
  readonly locators: ReturnType<typeof createProfileLocators>
  constructor(page: Page) {
    super(page, '/profile')
    this.locators = createProfileLocators(page)
  }
}
