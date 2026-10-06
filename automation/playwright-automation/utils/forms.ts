import type { Locator } from '@playwright/test'

export async function fillAndCheck(locator: Locator, value: string) {
  await locator.fill(value)
  await locator.blur()
}

export async function isRequired(locator: Locator) {
  return locator.evaluate((input: HTMLInputElement) => input.required)
}
