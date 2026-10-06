import { test } from '@playwright/test'

export async function attachJson(name: string, value: unknown) {
  await test.info().attach(name, { body: JSON.stringify(value, null, 2), contentType: 'application/json' })
}

export async function attachRequest(name: string, request: { url(): string; method(): string }, response: { status(): number; headers(): Record<string, string>; text(): Promise<string> }) {
  const body = await response.text()
  await attachJson(name, { method: request.method(), url: request.url(), status: response.status(), headers: response.headers(), body: body.slice(0, 12_000) })
}
