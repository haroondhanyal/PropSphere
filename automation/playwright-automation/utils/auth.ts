import type { Page } from '@playwright/test'
import { env } from '../config/env.js'
import { accounts } from '../data/seeded.js'

export async function signInForUi(page: Page, role: 'admin' | 'buyer' = 'admin') {
  const account = role === 'admin' ? accounts.admin : accounts.buyer
  const response = await page.request.post(`${env.apiUrl}/auth/login`, { data: { ...account, rememberMe: true } })
  if (!response.ok()) throw new Error(`Test ${role} login failed with HTTP ${response.status()}; seed local DB or update E2E credentials.`)
  const session = await response.json()
  await page.addInitScript((value) => {
    localStorage.setItem('propsphere-session', JSON.stringify(value))
    localStorage.setItem('propsphere-token', value.token)
  }, session)
  return session.user
}
