const required = (name: string, fallback: string) => process.env[name]?.trim() || fallback

export const env = {
  webUrl: required('WEB_BASE_URL', 'http://127.0.0.1:5174'),
  apiUrl: required('API_BASE_URL', 'http://127.0.0.1:3002/api').replace(/\/$/, ''),
  adminEmail: process.env.E2E_ADMIN_EMAIL?.trim() || '',
  adminPassword: process.env.E2E_ADMIN_PASSWORD || '',
  buyerEmail: process.env.E2E_BUYER_EMAIL?.trim() || '',
  buyerPassword: process.env.E2E_BUYER_PASSWORD || '',
  testSeed: Number(process.env.TEST_SEED || 20261006),
  timeoutMs: Number(process.env.TEST_TIMEOUT_MS || 30_000),
}
