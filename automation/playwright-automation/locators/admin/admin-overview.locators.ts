import type { Page } from '@playwright/test'

export const createAdminOverviewLocators = (page: Page) => ({
  heading: page.getByRole('heading', { name: /Admin\ workspace/i }).first(),
  main: page.locator('main, .login-layout').first(),
  usersTab: page.getByRole('button',{name:'Users & roles'}),
  riskTab: page.getByRole('button',{name:'Risk review'}),
  auditTab: page.getByRole('button',{name:'Audit history'}),
  settingsTab: page.getByRole('button',{name:'Settings'}),
})
