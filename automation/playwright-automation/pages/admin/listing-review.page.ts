import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createListingReviewLocators } from '../../locators/admin/listing-review.locators.js'

export class ListingReviewPage extends ScreenPage {
  readonly locators: ReturnType<typeof createListingReviewLocators>
  constructor(page: Page) {
    super(page, '/admin/review')
    this.locators = createListingReviewLocators(page)
  }
}
