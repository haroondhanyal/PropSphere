import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)))
const output = resolve(root, 'report-output')
await mkdir(output, { recursive: true })
for (const file of ['native-k6-summary.json', 'k6-metrics.ndjson']) await writeFile(resolve(output, file), '')

function loadEnv(file) {
  return readFile(file, 'utf8').then((source) => {
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^\s*(API_BASE_URL|WEB_BASE_URL)\s*=\s*(.*?)\s*$/)
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '')
    }
  }).catch(() => {})
}
await Promise.all([loadEnv(resolve(root, '../../../.env')), loadEnv(resolve(root, '../../playwright-automation/.env'))])
const summaryPath = resolve(output, 'native-k6-summary.json')
const metricsPath = resolve(output, 'k6-metrics.ndjson')
const environment = { ...process.env, API_BASE_URL: process.env.API_BASE_URL || 'http://127.0.0.1:3002/api', K6_SUMMARY_PATH: summaryPath }
const startedAt = new Date().toISOString()
const version = spawnSync('k6', ['version'], { encoding: 'utf8' })
const run = spawnSync('k6', ['run', '--out', `json=${metricsPath}`, 'performance-cases.js'], { cwd: root, env: environment, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 })
await writeFile(resolve(output, 'run-meta.json'), JSON.stringify({
  k6Version: `${version.stdout || ''}${version.stderr || ''}`.trim(),
  apiBaseUrl: environment.API_BASE_URL,
  scenario: 'property_search_200_cases',
  executor: 'shared-iterations',
  configuredVUs: Number(environment.K6_VUS || 8),
  iterations: 200,
  startedAt,
  finishedAt: new Date().toISOString(),
  exitCode: run.status,
}, null, 2))
const native = `${run.stdout || ''}${run.stderr || ''}`
await writeFile(resolve(output, 'k6-cli-output.txt'), native || `k6 process failed to start: ${run.error?.message || `exit ${run.status}`}`)
try {
  const data = JSON.parse(await readFile(summaryPath, 'utf8'))
  const value = (name, key) => Number(data.metrics?.[name]?.values?.[key] || 0)
  const thresholds = Object.entries(data.metrics || {}).flatMap(([name, metric]) => Object.entries(metric.thresholds || {}).map(([rule, state]) => `  ${state.ok ? 'PASS' : 'FAIL'} ${name}: ${rule}`))
  const nativeSummary = [
    'PropSphere k6 performance run · Native k6 metric summary',
    `Iterations: ${value('iterations', 'count')}`,
    `Requests: ${value('http_reqs', 'count')} (${value('http_reqs', 'rate').toFixed(2)}/s)`,
    `Checks: ${value('checks', 'passes')} passed · ${value('checks', 'fails')} failed`,
    `Request failures: ${(value('http_req_failed', 'rate') * 100).toFixed(2)}%`,
    `Latency: avg ${value('http_req_duration', 'avg').toFixed(2)} ms · med ${value('http_req_duration', 'med').toFixed(2)} ms · p90 ${value('http_req_duration', 'p(90)').toFixed(2)} ms · p95 ${value('http_req_duration', 'p(95)').toFixed(2)} ms · p99 ${value('http_req_duration', 'p(99)').toFixed(2)} ms · max ${value('http_req_duration', 'max').toFixed(2)} ms`,
    'Thresholds:', ...(thresholds.length ? thresholds : ['  No threshold data']), '',
    'The source JSON at native-k6-summary.json is written by k6 handleSummary().',
  ].join('\n')
  await writeFile(resolve(output, 'native-k6-summary.txt'), nativeSummary)
} catch {
  await writeFile(resolve(output, 'native-k6-summary.txt'), native || 'k6 did not produce a summary. See k6-cli-output.txt for the run output.')
}
const rendered = spawnSync(process.execPath, [resolve(root, 'render-report.mjs')], { cwd: root, env: environment, encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 })
if (rendered.stdout) process.stdout.write(rendered.stdout)
if (rendered.stderr) process.stderr.write(rendered.stderr)
if (run.error) { console.error(`Could not start k6: ${run.error.message}`); process.exitCode = 1 }
else if (rendered.status !== 0) process.exitCode = rendered.status || 1
else if (run.status !== 0) process.exitCode = run.status || 1

try {
  const result = JSON.parse(await readFile(summaryPath, 'utf8'))
  console.log(`Native k6 summary: ${resolve(output, 'native-k6-summary.txt')}`)
  console.log(`Performance report: ${resolve(output, 'index.html')}`)
  console.log(`k6 iterations: ${result.metrics?.iterations?.values?.count || 0}`)
} catch { /* The report still exists and explains if k6 did not produce summary data. */ }
