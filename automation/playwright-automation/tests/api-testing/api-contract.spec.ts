import { test, expect } from '@playwright/test'
import { apiRoutes } from '../../data/api-routes.js'
import { attachJson } from '../support/evidence.js'
import { installLifecycleHooks } from '../support/hooks.js'
import { env } from '../../config/env.js'
import { accounts } from '../../data/seeded.js'

installLifecycleHooks(test)

const publicRoutes = ['/health', '/properties', '/properties?take=1', '/properties?purpose=SALE', '/properties?purpose=RENT', '/properties/slug/sunlit-apartment-f-11', '/stays']

test.describe('API endpoint journeys · one named case per route', () => {
  for (const route of apiRoutes) {
    test(`GET ${route}`, async ({ request }) => {
      const headers: Record<string, string> = {}
      if (!publicRoutes.includes(route)) {
        await test.step('Given the seeded administrator signs in', async () => {
          const response = await request.post(`${env.apiUrl}/auth/login`, { data: { ...accounts.admin, rememberMe: false } })
          expect(response.status()).toBe(201)
          const session = await response.json()
          expect(session.user.role).toBe('ADMIN')
          headers.Authorization = `Bearer ${session.token}`
        })
      }

      const response = await test.step(`When the client requests GET ${route}`, () => request.get(`${env.apiUrl}${route}`, { headers }))
      const body = await response.text()
      await attachJson(`GET ${route} request and response`, { method: 'GET', path: route, status: response.status(), headers: response.headers(), body: body.slice(0, 12_000) })

      await test.step('Then this endpoint returns a successful JSON response', async () => {
        expect(response.status(), `${route} HTTP status`).toBe(200)
        expect(response.headers()['content-type']).toContain('application/json')
        expect(() => JSON.parse(body)).not.toThrow()
      })
    })
  }
})
