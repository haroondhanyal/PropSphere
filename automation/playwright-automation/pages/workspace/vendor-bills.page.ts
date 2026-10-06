import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createVendorBillsLocators } from '../../locators/workspace/vendor-bills.locators.js'

export class VendorBillsPage extends ScreenPage {
  readonly locators: ReturnType<typeof createVendorBillsLocators>
  constructor(page: Page) {
    super(page, '/workspace/vendor-bills')
    this.locators = createVendorBillsLocators(page)
  }
}
