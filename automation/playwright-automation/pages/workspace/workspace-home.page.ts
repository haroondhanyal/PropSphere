import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createWorkspaceHomeLocators } from '../../locators/workspace/workspace-home.locators.js'

export class WorkspaceHomePage extends ScreenPage {
  readonly locators: ReturnType<typeof createWorkspaceHomeLocators>
  constructor(page: Page) {
    super(page, '/workspace')
    this.locators = createWorkspaceHomeLocators(page)
  }
}
