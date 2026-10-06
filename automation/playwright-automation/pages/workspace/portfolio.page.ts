import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createPortfolioLocators } from '../../locators/workspace/portfolio.locators.js'

export class PortfolioPage extends ScreenPage {
  readonly locators: ReturnType<typeof createPortfolioLocators>
  constructor(page: Page) {
    super(page, '/workspace/portfolio')
    this.locators = createPortfolioLocators(page)
  }
}
