import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const failures = new Rate('health_failures')
const latency = new Trend('health_latency', true)
const base = (__ENV.API_BASE_URL || 'http://127.0.0.1:3002/api').replace(/\/$/, '')
export const options = { stages: [{ duration: '30s', target: 10 }, { duration: '1m', target: 25 }, { duration: '30s', target: 0 }], thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<800'], health_failures: ['rate<0.01'] } }
export default function () {
  const response = http.get(`${base}/health`, { tags: { endpoint: 'health' } })
  latency.add(response.timings.duration)
  const ok = check(response, { 'health endpoint is HTTP 200': (r) => r.status === 200, 'health JSON is healthy': (r) => r.json('status') === 'ok' })
  failures.add(!ok)
  sleep(1)
}
