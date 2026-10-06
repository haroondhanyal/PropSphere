import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Gauge, Rate, Trend } from 'k6/metrics'
import exec from 'k6/execution'
import { cases } from './case-catalog.js'

const caseFailures = new Rate('case_failures')
const caseExecutions = new Counter('case_executions')
const caseStatuses = new Gauge('case_http_status')
const caseLatency = new Trend('case_latency', true)
const caseTimings = Object.fromEntries(['blocked', 'connecting', 'tls_handshaking', 'sending', 'waiting', 'receiving'].map((name) => [name, new Trend(`case_${name}`, true)]))
const caseResponseBytes = new Gauge('case_response_bytes')
const base = (__ENV.API_BASE_URL || 'http://127.0.0.1:3002/api').replace(/\/$/, '')
const vus = Number(__ENV.K6_VUS || 8)

export const options = {
  scenarios: {
    property_search_200_cases: {
      executor: 'shared-iterations',
      vus,
      iterations: cases.length,
      maxDuration: __ENV.K6_MAX_DURATION || '3m',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    checks: ['rate>0.98'],
    case_failures: ['rate<0.02'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
}

export default function () {
  const testCase = cases[exec.scenario.iterationInTest]
  if (!testCase) return

  const query = Object.entries(testCase.query).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
  const requestUrl = `${base}/properties?${query}`
  const tags = {
    case_id: testCase.id,
    case_title: testCase.title,
    city: testCase.city,
    scenario: 'property_search_200_cases',
    executor: 'shared-iterations',
    vu: String(__VU),
    vu_iteration: String(__ITER),
    iteration_in_test: String(exec.scenario.iterationInTest),
    request_url: requestUrl,
  }
  caseExecutions.add(1, tags)
  const response = http.get(requestUrl, {
    tags: { ...tags, suite: 'performance' },
    timeout: '10s',
  })
  let isArray = false
  try { isArray = Array.isArray(response.json()) } catch { /* Invalid JSON fails the check below. */ }
  caseStatuses.add(response.status, tags)
  caseLatency.add(response.timings.duration, tags)
  caseResponseBytes.add(response.body?.length || 0, tags)
  for (const name of Object.keys(caseTimings)) caseTimings[name].add(response.timings[name] || 0, tags)
  const latencyOkay = response.timings.duration < 3000
  const result = check(response, {
    [`${testCase.id} · HTTP 200`]: (res) => res.status === 200,
    [`${testCase.id} · JSON listing array`]: () => isArray,
    [`${testCase.id} · response under 3 seconds`]: () => latencyOkay,
  }, tags)
  caseFailures.add(!result, { case_id: testCase.id, city: testCase.city })
  sleep(0.1)
}

export function handleSummary(data) {
  const path = __ENV.K6_SUMMARY_PATH || 'automation/performance-testing/k6/results/k6-summary.json'
  return { [path]: JSON.stringify(data, null, 2) }
}
