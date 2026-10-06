import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createWorkspaceStaysLocators } from '../../locators/workspace/workspace-stays.locators.js'

export class WorkspaceStaysPage extends ScreenPage {
  readonly locators: ReturnType<typeof createWorkspaceStaysLocators>
  constructor(page: Page) {
    super(page, '/workspace/stays')
    this.locators = createWorkspaceStaysLocators(page)
  }
}
