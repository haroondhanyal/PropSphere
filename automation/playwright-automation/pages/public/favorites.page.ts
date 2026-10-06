import type { Page } from '@playwright/test'
import { ScreenPage } from '../screen.page.js'
import { createFavoritesLocators } from '../../locators/public/favorites.locators.js'

export class FavoritesPage extends ScreenPage {
  readonly locators: ReturnType<typeof createFavoritesLocators>
  constructor(page: Page) {
    super(page, '/favorites')
    this.locators = createFavoritesLocators(page)
  }
}
