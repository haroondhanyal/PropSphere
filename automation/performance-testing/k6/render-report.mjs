import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cases } from './case-catalog.js'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)))
const output = resolve(root, 'report-output')
const readJson = async (file, fallback) => {
  try { return JSON.parse(await readFile(resolve(output, file), 'utf8')) } catch { return fallback }
}
const [summary, rawMetrics, nativeText, runMeta] = await Promise.all([
  readJson('native-k6-summary.json', {}),
  readFile(resolve(output, 'k6-metrics.ndjson'), 'utf8').catch(() => ''),
  readFile(resolve(output, 'native-k6-summary.txt'), 'utf8').catch(() => 'No k6 summary is available yet.'),
  readJson('run-meta.json', {}),
])
const metric = (name, key) => Number(summary.metrics?.[name]?.values?.[key] || 0)
const details = new Map(cases.map((testCase) => [testCase.id, {
  checks: [], timings: {}, latencyMs: null, responseBytes: 0, responseStatus: null, execution: null, startedAt: null,
}]))

for (const line of rawMetrics.split(/\r?\n/)) {
  if (!line) continue
  try {
    const point = JSON.parse(line)
    const id = point.data?.tags?.case_id
    if (!id || !details.has(id)) continue
    const result = details.get(id)
    if (point.metric === 'checks') result.checks.push({ name: point.data.tags?.check || 'Check', passed: Number(point.data.value) === 1 })
    if (point.metric === 'case_executions') { result.execution = point.data.tags || {}; result.startedAt = point.data.time || null }
    if (point.metric === 'case_http_status') result.responseStatus = Number(point.data.value)
    if (point.metric === 'case_latency' || point.metric === 'http_req_duration') result.latencyMs = Number(point.data.value)
    if (point.metric === 'case_response_bytes') result.responseBytes = Number(point.data.value)
    for (const name of ['blocked', 'connecting', 'tls_handshaking', 'sending', 'waiting', 'receiving']) {
      if (point.metric === `case_${name}`) result.timings[name] = Number(point.data.value)
    }
  } catch { /* Ignore incomplete lines if k6 is interrupted. */ }
}

const caseResults = cases.map((testCase) => {
  const result = details.get(testCase.id)
  const failures = result.checks.filter((item) => !item.passed).length
  const execution = result.execution
  return {
    ...testCase,
    requestUrl: execution?.request_url || null,
    statusCode: result.responseStatus,
    responseBytes: result.responseBytes,
    checks: result.checks,
    failures,
    latencyMs: result.latencyMs,
    timings: result.timings,
    execution: execution ? {
      scenario: execution.scenario,
      executor: execution.executor,
      virtualUser: Number(execution.vu),
      vuIteration: Number(execution.vu_iteration),
      iterationInTest: Number(execution.iteration_in_test),
      startedAt: result.startedAt,
    } : null,
    status: !result.checks.length ? 'not-run' : failures ? 'failed' : 'passed',
  }
})

const responseTimes = caseResults.map((item) => item.latencyMs).filter((value) => value !== null).sort((a, b) => a - b)
const percentile = (quantile) => responseTimes.length ? responseTimes[Math.max(0, Math.ceil(quantile * responseTimes.length) - 1)] : 0
const counts = {
  total: caseResults.length,
  passed: caseResults.filter((item) => item.status === 'passed').length,
  failed: caseResults.filter((item) => item.status === 'failed').length,
  notRun: caseResults.filter((item) => item.status === 'not-run').length,
}
const report = {
  product: 'PropSphere', generatedAt: new Date().toISOString(), baseUrl: runMeta.apiBaseUrl || process.env.API_BASE_URL || 'http://127.0.0.1:3002/api',
  execution: runMeta,
  requests: metric('http_reqs', 'count'), throughput: metric('http_reqs', 'rate'),
  latency: {
    avg: metric('http_req_duration', 'avg'), med: metric('http_req_duration', 'med'),
    p90: metric('http_req_duration', 'p(90)'), p95: metric('http_req_duration', 'p(95)'),
    p99: metric('http_req_duration', 'p(99)') || percentile(0.99), max: metric('http_req_duration', 'max'),
  },
  failedRequestRate: metric('http_req_failed', 'rate'),
  checks: { passed: metric('checks', 'passes'), failed: metric('checks', 'fails') },
  thresholds: Object.fromEntries(Object.entries(summary.metrics || {}).flatMap(([name, item]) => Object.entries(item.thresholds || {}).map(([rule, state]) => [`${name}: ${rule}`, state.ok]))),
  counts, cases: caseResults, nativeText,
}

await mkdir(output, { recursive: true })
await writeFile(resolve(output, 'performance-report.json'), JSON.stringify(report, null, 2))
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const jsonForHtml = (value) => JSON.stringify(value).replace(/</g, '\\u003c')

const headerColors = {
  propsphere: ['#102b46', '#2675b8'], ocean: ['#073b4c', '#0ea5a4'], forest: ['#143d2b', '#4d8b5a'],
  violet: ['#34205f', '#7048c8'], rose: ['#64243d', '#d44c79'], amber: ['#663d13', '#ca861f'],
  slate: ['#29394b', '#687a91'], cobalt: ['#172d68', '#326bd7'], jade: ['#104e48', '#27a58d'], charcoal: ['#202428', '#555b63'],
}
const themes = {
  light: ['#f0f4f8', '#ffffff', '#f7f9fc', '#1c2b3a', '#65788c', '#dbe3eb', '#2675b8', '#e5eff8'],
  dark: ['#101923', '#172433', '#1c2a39', '#edf4fa', '#a8bbce', '#334558', '#64b5f6', '#21405a'],
  contrast: ['#000000', '#090909', '#111111', '#ffffff', '#f0f0f0', '#ffffff', '#ffef00', '#252000'],
  grey: ['#e6e8ea', '#f7f8f9', '#eef0f1', '#252b30', '#59636b', '#c4cbd1', '#53616d', '#dde2e6'],
  blue: ['#eaf2fb', '#ffffff', '#f2f7fd', '#172c43', '#5a7189', '#ccdaea', '#2162a6', '#dceafb'],
  ocean: ['#e8f4f6', '#ffffff', '#f1f8f9', '#17353d', '#55737a', '#c8e0e3', '#087f8c', '#d6edef'],
  forest: ['#edf4ed', '#ffffff', '#f4f8f3', '#21382a', '#607766', '#d4e2d5', '#397447', '#dfeddf'],
  rose: ['#f8eff1', '#ffffff', '#fcf5f6', '#3b2630', '#79636c', '#ead6dc', '#a74764', '#f5e0e6'],
}
const percentileRows = ['avg', 'med', 'p90', 'p95', 'p99'].map((name) => {
  const value = report.latency[name]
  const width = Math.max(value ? 2 : 0, Math.round(value / Math.max(report.latency.p99, 1) * 100))
  return `<div class="bar-row"><span>${name.toUpperCase()}</span><div class="track"><i style="width:${width}%"></i></div><b>${value.toFixed(2)} ms</b></div>`
}).join('')
const thresholdRows = Object.entries(report.thresholds).map(([name, okay]) => `<div class="threshold"><span>${escape(name)}</span><b class="status status-${okay ? 'passed' : 'failed'}">${okay ? 'PASS' : 'FAIL'}</b></div>`).join('') || '<p class="muted">No threshold data for this run.</p>'
const rows = caseResults.map((item) => `<tr data-status="${item.status}" data-search="${escape(`${item.id} ${item.title} ${item.city}`.toLowerCase())}"><td><a class="case-link" href="/performance/index.html?case=${item.id}" data-open-case="${item.id}">${item.id}<small>View execution ↗</small></a></td><td>${escape(item.title)}</td><td><span class="status status-${item.status}">${item.status}</span></td><td>${item.latencyMs === null ? '—' : `${item.latencyMs.toFixed(1)} ms`}</td><td>${item.statusCode ?? '—'}</td><td>${item.failures}/${item.checks.length}</td></tr>`).join('')
const themeButtons = (kind) => Object.keys(kind === 'header' ? headerColors : themes).map((name) => kind === 'header'
  ? `<button class="swatch" data-header="${name}" style="--a:${headerColors[name][0]};--b:${headerColors[name][1]}" title="${name} header" aria-label="${name} header" aria-pressed="false"></button>`
  : `<button class="swatch theme-swatch" data-theme="${name}" aria-pressed="false">${name}</button>`).join('')
const themeScript = `const headerColors=${jsonForHtml(headerColors)},themes=${jsonForHtml(themes)},root=document.documentElement;function setHeader(name,button){const c=headerColors[name];root.style.setProperty('--head-a',c[0]);root.style.setProperty('--head-b',c[1]);localStorage.setItem('propsphere-allure-header',name);document.querySelectorAll('[data-header]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)))}function setTheme(name,button){const t=themes[name],keys=['--canvas','--surface','--raised','--ink','--muted','--line','--accent','--active'];keys.forEach((key,i)=>root.style.setProperty(key,t[i]));root.style.colorScheme=name==='dark'?'dark':'light';localStorage.setItem('propsphere-allure-content',name);document.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===button)))}document.querySelectorAll('[data-header]').forEach(b=>b.onclick=()=>setHeader(b.dataset.header,b));document.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>setTheme(b.dataset.theme,b));const headerChoice=localStorage.getItem('propsphere-allure-header')||'propsphere',themeChoice=localStorage.getItem('propsphere-allure-content')||'light';setHeader(headerChoice,document.querySelector('[data-header="'+headerChoice+'"]'));setTheme(themeChoice,document.querySelector('[data-theme="'+themeChoice+'"]'));`
const nativeNav = '<a href="/performance/index.html">Main k6 report</a><a href="/allure/index.html">Allure report</a><a href="/">QA center</a>'
const header = (title, subtitle, countsText) => `<header class="top"><div class="head"><img class="logo" src="/propsphere-logo.svg" alt="PropSphere"><div class="brand"><h1>${title}</h1><p>${subtitle}</p></div><div class="stats">${countsText}</div><nav class="actions">${nativeNav}</nav></div><div class="themes"><b>Header color</b>${themeButtons('header')}<b class="theme-label">Report theme</b>${themeButtons('theme')}</div></header>`
const sharedCss = `:root{font:14px/1.5 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:#1c2b3a;background:#f0f4f8;--canvas:#f0f4f8;--surface:#fff;--raised:#f7f9fc;--ink:#1c2b3a;--muted:#65788c;--line:#dbe3eb;--accent:#2675b8;--active:#e5eff8}*{box-sizing:border-box}body{margin:0;background:var(--canvas);color:var(--ink)}.top{position:sticky;top:0;z-index:5;color:#fff;background:linear-gradient(105deg,var(--head-a,#102b46),var(--head-b,#2675b8));box-shadow:0 8px 28px #0b1f3333}.head{display:flex;align-items:center;gap:14px;padding:10px clamp(14px,2.2vw,34px);min-height:70px}.logo{width:158px;height:42px;object-fit:contain;background:white;border-radius:11px;padding:5px 9px}.brand h1{font-size:clamp(16px,1.7vw,23px);line-height:1.15;margin:0}.brand p{margin:4px 0 0;color:#ffffffc9;font-size:11px}.stats{display:flex;gap:6px;margin-left:auto;flex-wrap:wrap}.chip{border:1px solid #ffffff55;background:#ffffff18;border-radius:999px;padding:5px 8px;font-size:10px;white-space:nowrap}.actions{display:flex;gap:6px}.actions a{color:#fff;text-decoration:none;border:1px solid #ffffff66;border-radius:8px;padding:6px 8px;font-size:10px;white-space:nowrap}.actions a:hover{background:#ffffff20}.themes{display:flex;align-items:center;gap:7px;padding:5px clamp(14px,2.2vw,34px) 8px;border-top:1px solid #ffffff32;overflow:auto}.themes b{font-size:10px;color:#ffffffcc;font-weight:500;white-space:nowrap}.theme-label{margin-left:12px}.swatch{height:21px;min-width:21px;padding:0 6px;border:1px solid #ffffff99;border-radius:999px;cursor:pointer;background:linear-gradient(120deg,var(--a),var(--b));color:#fff;font-size:10px}.swatch[aria-pressed=true]{outline:2px solid #fff;outline-offset:2px}.theme-swatch{background:#ffffff22;color:#fff}.shell{max-width:1500px;margin:auto;padding:22px}.intro,.panel,.metric{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:0 4px 16px #162f4210}.intro{padding:18px 21px;margin-bottom:13px;display:flex;align-items:center;justify-content:space-between;gap:14px}.eyebrow{font-size:10px;text-transform:uppercase;letter-spacing:.15em;font-weight:800;color:var(--accent)}h2{margin:4px 0;font-size:22px}.muted{color:var(--muted)}.metrics{display:grid;grid-template-columns:repeat(6,minmax(110px,1fr));gap:10px;margin:13px 0}.metric{padding:13px}.metric b{display:block;font-size:22px;letter-spacing:-.04em}.metric span{color:var(--muted);font-size:11px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.panel{padding:15px}.panel h3{font-size:14px;margin:0 0 11px}.threshold{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-top:1px solid var(--line);gap:12px;font-size:11px}.status{display:inline-block;border-radius:999px;padding:3px 8px;font-size:9px;font-weight:800;text-transform:uppercase;white-space:nowrap}.status-passed{background:#daf4e5;color:#17653c}.status-failed{background:#fde1e2;color:#a02a34}.status-not-run{background:#edf0f3;color:#536373}.bars{display:grid;gap:9px}.bar-row{display:grid;grid-template-columns:45px minmax(80px,1fr) 94px;gap:9px;align-items:center;font-size:10px}.bar-row b{text-align:right}.track{height:9px;border-radius:9px;background:var(--raised);overflow:hidden}.track i{display:block;height:100%;background:linear-gradient(90deg,var(--accent),#41c6bc);border-radius:inherit}.profile{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.profile div{border:1px solid var(--line);border-radius:9px;padding:9px;background:var(--raised)}.profile span{display:block;color:var(--muted);font-size:10px}.profile b{font-size:12px;overflow-wrap:anywhere}.toolbar{display:flex;gap:8px;margin:0 0 11px}.toolbar input,.toolbar select{min-height:35px;border:1px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);padding:7px 10px}.toolbar input{flex:1}.table-wrap{max-height:580px;overflow:auto;border:1px solid var(--line);border-radius:10px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line)}th{position:sticky;top:0;background:var(--raised);z-index:1}.case-link{font-weight:800;color:var(--accent);text-decoration:none}.case-link:hover{text-decoration:underline}.case-link small{display:block;font-size:9px;font-weight:500}.native{white-space:pre-wrap;overflow:auto;max-height:540px;background:var(--raised);border:1px solid var(--line);border-radius:9px;padding:13px;font:11px/1.5 ui-monospace,SFMono-Regular,monospace}.button{display:inline-flex;color:white;background:var(--accent);text-decoration:none;border-radius:8px;padding:8px 11px;font-weight:700;font-size:11px}.case-dialog{width:min(850px,calc(100vw - 28px));max-height:88vh;overflow:auto;border:1px solid var(--line);border-radius:17px;background:var(--surface);color:var(--ink);padding:0;box-shadow:0 24px 80px #07192f55}.case-dialog::backdrop{background:#07192f99;backdrop-filter:blur(3px)}.dialog-head{position:sticky;top:0;z-index:2;background:var(--surface);border-bottom:1px solid var(--line);padding:15px 18px;display:flex;justify-content:space-between;gap:10px}.dialog-head h2{font-size:18px}.dialog-body{padding:16px 18px}.detail-block{border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0;background:var(--raised)}.detail-block h3{font-size:12px;margin:0 0 8px}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.detail-grid div{overflow-wrap:anywhere;font-size:11px}.detail-grid b{color:var(--muted);font-weight:500;display:block}.detail-json{white-space:pre-wrap;overflow:auto;font-size:10px}.close{border:1px solid var(--line);border-radius:8px;background:var(--raised);color:var(--ink);padding:6px 10px;cursor:pointer}.footer{text-align:center;color:var(--muted);font-size:10px;padding:18px}@media(max-width:1000px){.metrics{grid-template-columns:repeat(3,1fr)}.actions{display:none}}@media(max-width:650px){.head{flex-wrap:wrap}.logo{width:120px;height:36px}.stats{order:3;width:100%;margin:0}.shell{padding:11px}.intro{display:block}.metrics{grid-template-columns:repeat(2,1fr)}.grid{grid-template-columns:1fr}.toolbar{flex-wrap:wrap}.detail-grid{grid-template-columns:1fr}}`

const execution = report.execution || {}
const globalMetrics = `<span class="chip">${counts.total} cases</span><span class="chip">${counts.passed} passed</span><span class="chip">${counts.failed} failed</span><span class="chip">${counts.notRun} not run</span>`
const appHeader = header('PropSphere Performance Report', `k6 · 200 API cases · ${escape(new Date(report.generatedAt).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }))}`, globalMetrics)
const profile = `<div class="profile"><div><span>Scenario</span><b>${escape(execution.scenario || 'property_search_200_cases')}</b></div><div><span>Executor</span><b>${escape(execution.executor || 'shared-iterations')}</b></div><div><span>Virtual users</span><b>${escape(execution.configuredVUs || 8)}</b></div><div><span>Iterations</span><b>${counts.total}</b></div><div><span>k6 version</span><b>${escape(execution.k6Version || 'Unknown')}</b></div><div><span>API target</span><b>${escape(report.baseUrl)}</b></div><div><span>Started</span><b>${escape(execution.startedAt || '—')}</b></div><div><span>Finished</span><b>${escape(execution.finishedAt || '—')}</b></div></div>`
const caseData = jsonForHtml(caseResults)
const mainHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PropSphere · k6 Performance Report</title><style>${sharedCss}</style></head><body>${appHeader}<main class="shell"><section class="intro"><div><span class="eyebrow">PropSphere · Performance engineering</span><h2>Marketplace search performance run</h2><div class="muted">${counts.total} cases · ${report.requests} requests · ${(report.failedRequestRate * 100).toFixed(2)}% request failures</div></div><div><a class="button" href="/performance/native-k6-report.html">Open native k6 report ↗</a> <a class="button" href="/performance/native-k6-summary.json">Native JSON ↓</a></div></section>
<section class="metrics"><article class="metric"><b>${counts.total}</b><span>Cases executed</span></article><article class="metric"><b>${report.requests}</b><span>HTTP requests</span></article><article class="metric"><b>${report.throughput.toFixed(2)}/s</b><span>Throughput</span></article><article class="metric"><b>${report.latency.p95.toFixed(1)} ms</b><span>p95 latency</span></article><article class="metric"><b>${report.latency.p99.toFixed(1)} ms</b><span>p99 latency</span></article><article class="metric"><b>${(report.failedRequestRate * 100).toFixed(2)}%</b><span>Failed requests</span></article></section>
<section class="grid"><article class="panel"><h3>Response time percentiles</h3><div class="bars">${percentileRows}</div><p class="muted">Times are in milliseconds; bars are scaled to this run's p99.</p></article><article class="panel"><h3>Execution profile</h3>${profile}</article><article class="panel"><h3>k6 thresholds</h3>${thresholdRows}</article><article class="panel"><h3>Native summary preview</h3><pre class="native">${escape(nativeText)}</pre><a class="case-link" href="/performance/native-k6-report.html">Open the full native k6 report ↗</a></article></section>
<section class="panel" style="margin-top:13px"><h3>Case execution details</h3><div class="toolbar"><input type="search" id="search" placeholder="Search case, filter, or city" aria-label="Search performance cases"><select id="status"><option value="">All statuses</option><option value="passed">Passed</option><option value="failed">Failed</option><option value="not-run">Not run</option></select><span class="muted" id="shown">${counts.total} cases shown</span></div><div class="table-wrap"><table><thead><tr><th>Case ID</th><th>Scenario</th><th>Status</th><th>Latency</th><th>HTTP</th><th>Failed checks</th></tr></thead><tbody id="cases">${rows}</tbody></table></div></section><footer class="footer">PropSphere · Raja Haroon Jamal · QA Department · Full Stack QA Automation Tester · Read-only requests</footer></main>
<dialog id="case-dialog" class="case-dialog"><div class="dialog-head"><div><span class="eyebrow">Case execution record</span><h2 id="case-title"></h2></div><button class="close" id="close-case" type="button">Close ✕</button></div><div class="dialog-body" id="case-body"></div></dialog>
<script>${themeScript}const caseData=${caseData};const esc=value=>String(value??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));function openCase(id,push){const item=caseData.find(x=>x.id===id);if(!item)return;document.querySelector('#case-title').textContent=item.id+' · '+item.title;const e=item.execution||{},timing=item.timings||{},checks=item.checks||[];const fields=[['Status',item.status],['HTTP status',item.statusCode],['Scenario',e.scenario],['Executor',e.executor],['Virtual user',e.virtualUser],['VU iteration',e.vuIteration],['Suite iteration',e.iterationInTest],['Started at',e.startedAt],['Response time',item.latencyMs===null?'not recorded':item.latencyMs.toFixed(2)+' ms'],['Response size',item.responseBytes+' bytes']];const timingRows=Object.entries(timing).map(([name,value])=>'<div><b>'+esc(name.replaceAll('_',' '))+'</b>'+Number(value).toFixed(2)+' ms</div>').join('');const checkRows=checks.map(x=>'<div><span class="status status-'+(x.passed?'passed':'failed')+'">'+(x.passed?'PASS':'FAIL')+'</span> '+esc(x.name)+'</div>').join('')||'<div>No check samples were recorded for this case.</div>';document.querySelector('#case-body').innerHTML='<div class="detail-block"><h3>Request</h3><div class="detail-grid"><div><b>Method</b>GET</div><div><b>Target URL</b>'+esc(item.requestUrl)+'</div><div><b>Query filters</b>'+esc(JSON.stringify(item.query))+'</div><div><b>Response content</b>JSON · '+item.responseBytes+' bytes</div></div></div><div class="detail-block"><h3>Execution metadata</h3><div class="detail-grid">'+fields.map(x=>'<div><b>'+esc(x[0])+'</b>'+esc(x[1])+'</div>').join('')+'</div></div><div class="detail-block"><h3>Request timing breakdown</h3><div class="detail-grid">'+(timingRows||'<div>No timing samples recorded.</div>')+'</div></div><div class="detail-block"><h3>Individual checks</h3>'+checkRows+'</div><details class="detail-block"><summary>Raw case record JSON</summary><pre class="detail-json">'+esc(JSON.stringify(item,null,2))+'</pre></details>';const dialog=document.querySelector('#case-dialog');if(!dialog.open)dialog.showModal();if(push)history.pushState({caseId:id},'', '/performance/index.html?case='+encodeURIComponent(id))}document.querySelectorAll('[data-open-case]').forEach(a=>a.addEventListener('click',event=>{event.preventDefault();openCase(a.dataset.openCase,true)}));document.querySelector('#close-case').onclick=()=>{document.querySelector('#case-dialog').close();history.pushState({},'', '/performance/index.html')};document.querySelector('#case-dialog').addEventListener('click',event=>{if(event.target.id==='case-dialog')document.querySelector('#close-case').click()});function applyFilter(){let count=0;document.querySelectorAll('#cases tr').forEach(row=>{const visible=row.dataset.search.includes(document.querySelector('#search').value.toLowerCase())&&(!document.querySelector('#status').value||row.dataset.status===document.querySelector('#status').value);row.hidden=!visible;if(visible)count++});document.querySelector('#shown').textContent=count+' cases shown'}document.querySelector('#search').addEventListener('input',applyFilter);document.querySelector('#status').addEventListener('change',applyFilter);window.addEventListener('popstate',()=>{const id=new URLSearchParams(location.search).get('case');if(id)openCase(id,false);else document.querySelector('#case-dialog').close()});const directCase=new URLSearchParams(location.search).get('case');if(directCase)openCase(directCase,false)</script></body></html>`

const runJson = escape(JSON.stringify(summary, null, 2))
const nativeHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PropSphere · Native k6 Report</title><style>${sharedCss}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:11px}.raw-summary{max-height:70vh}@media(max-width:720px){.summary-grid{grid-template-columns:repeat(2,1fr)}}</style></head><body>${header('PropSphere Native k6 Report', `k6 native summary · ${escape(execution.k6Version || 'version unavailable')} · ${escape(execution.startedAt || '')}`, `<span class="chip">${counts.total} cases</span><span class="chip">${counts.passed} passed</span><span class="chip">${counts.failed} failed</span>`)}<main class="shell"><section class="intro"><div><span class="eyebrow">Native k6 output</span><h2>Execution summary and thresholds</h2><div class="muted">Source: k6 handleSummary JSON · ${escape(report.baseUrl)}</div></div><div><a class="button" href="/performance/index.html">Open main performance dashboard ↗</a> <a class="button" href="/performance/native-k6-summary.json">Download native JSON ↓</a></div></section><section class="metrics summary-grid"><article class="metric"><b>${metric('iterations', 'count')}</b><span>Iterations</span></article><article class="metric"><b>${report.requests}</b><span>Requests</span></article><article class="metric"><b>${report.throughput.toFixed(2)}/s</b><span>Requests / second</span></article><article class="metric"><b>${(report.failedRequestRate * 100).toFixed(2)}%</b><span>Request failures</span></article><article class="metric"><b>${report.latency.avg.toFixed(2)} ms</b><span>Average latency</span></article><article class="metric"><b>${report.latency.p95.toFixed(2)} ms</b><span>p95 latency</span></article><article class="metric"><b>${report.latency.p99.toFixed(2)} ms</b><span>p99 latency</span></article><article class="metric"><b>${report.latency.max.toFixed(2)} ms</b><span>Maximum latency</span></article></section><section class="grid"><article class="panel"><h3>Native k6 thresholds</h3>${thresholdRows}</article><article class="panel"><h3>Execution profile</h3>${profile}</article></section><section class="panel" style="margin-top:13px"><h3>Native k6 CLI output</h3><pre class="native raw-summary">${escape((await readFile(resolve(output, 'k6-cli-output.txt'), 'utf8').catch(() => 'No raw output recorded.')).slice(-24000))}</pre><p class="muted">The JSON download is the direct machine-readable summary generated by k6.</p></section><section class="panel" style="margin-top:13px"><h3>Native summary JSON preview</h3><pre class="native raw-summary">${runJson}</pre></section><footer class="footer">PropSphere · Raja Haroon Jamal · QA Department · Full Stack QA Automation Tester</footer></main><script>${themeScript}</script></body></html>`

await writeFile(resolve(output, 'index.html'), mainHtml)
await writeFile(resolve(output, 'native-k6-report.html'), nativeHtml)
console.log(`Performance report generated with ${counts.total} cases (${counts.passed} passed, ${counts.failed} failed, ${counts.notRun} not run).`)
