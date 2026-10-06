import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const failures = new Rate('search_failures')
const base = (__ENV.API_BASE_URL || 'http://127.0.0.1:3002/api').replace(/\/$/, '')
export const options = { stages: [{ duration: '30s', target: 15 }, { duration: '90s', target: 40 }, { duration: '30s', target: 0 }], thresholds: { http_req_failed: ['rate<0.02'], http_req_duration: ['p(95)<1200'], search_failures: ['rate<0.02'] } }
export default function () {
  const responses = http.batch([
    ['GET', `${base}/properties?purpose=SALE`, null, { tags: { endpoint: 'property-search-sale' } }],
    ['GET', `${base}/properties?purpose=RENT`, null, { tags: { endpoint: 'property-search-rent' } }],
    ['GET', `${base}/stays`, null, { tags: { endpoint: 'short-stays' } }],
  ])
  responses.forEach((response) => {
    const ok = check(response, { 'listing request returns success': (r) => r.status === 200, 'listing response is JSON': (r) => (r.headers['Content-Type'] || '').includes('application/json') })
    failures.add(!ok)
  })
  sleep(1)
}
