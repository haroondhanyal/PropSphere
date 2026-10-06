import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const failures = new Rate('workspace_failures')
const base = (__ENV.API_BASE_URL || 'http://127.0.0.1:3002/api').replace(/\/$/, '')
export const options = { stages: [{ duration: '20s', target: 5 }, { duration: '1m', target: 15 }, { duration: '20s', target: 0 }], thresholds: { http_req_failed: ['rate<0.02'], http_req_duration: ['p(95)<1500'], workspace_failures: ['rate<0.02'] } }
export default function () {
  if (!__ENV.E2E_TOKEN) { throw new Error('Set E2E_TOKEN to a short-lived token for a dedicated test account.') }
  const headers = { headers: { Authorization: `Bearer ${__ENV.E2E_TOKEN}` } }
  const response = http.get(`${base}/workspace/overview`, { ...headers, tags: { endpoint: 'workspace-overview' } })
  const ok = check(response, { 'workspace is authorized': (r) => r.status === 200, 'overview response is JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json') })
  failures.add(!ok)
  sleep(1)
}
