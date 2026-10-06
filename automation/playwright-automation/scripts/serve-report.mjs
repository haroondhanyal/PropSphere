import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const workspace = resolve(fileURLToPath(new URL('../', import.meta.url)))
const reportRoot = resolve(workspace, 'report')
const allureRoot = resolve(workspace, 'allure-report')
const performanceRoot = resolve(workspace, '../performance-testing/k6/report-output')
const port = Number(process.env.REPORT_PORT || 4178)
const types = {
  '.html': 'text/html; charset=utf-8', '.svg': 'image/svg+xml', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.ico': 'image/x-icon', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webm': 'video/webm', '.txt': 'text/plain; charset=utf-8', '.properties': 'text/plain; charset=utf-8',
}

const server = createServer(async (request, response) => {
  let pathname
  try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname) }
  catch { response.writeHead(400).end('Bad request'); return }

  if (pathname === '/allure' || pathname === '/allure/') {
    response.writeHead(302, { Location: '/allure/index.html', 'Cache-Control': 'no-store' }).end()
    return
  }
  if (pathname === '/performance' || pathname === '/performance/') {
    response.writeHead(302, { Location: '/performance/index.html', 'Cache-Control': 'no-store' }).end()
    return
  }

  const isAllure = pathname.startsWith('/allure/')
  const isPerformance = pathname.startsWith('/performance/')
  const root = isAllure ? allureRoot : isPerformance ? performanceRoot : reportRoot
  const relative = isAllure ? pathname.slice('/allure/'.length) : isPerformance ? pathname.slice('/performance/'.length) : pathname === '/' ? 'index.html' : pathname.slice(1)
  let target = resolve(root, relative || 'index.html')
  if (target !== root && !target.startsWith(`${root}${sep}`)) { response.writeHead(403).end('Forbidden'); return }

  try {
    if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html')
    const body = request.method === 'HEAD' ? null : await readFile(target)
    response.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' })
    response.end(body)
  } catch (error) {
    const status = error?.code === 'ENOENT' || error?.code === 'ENOTDIR' ? 404 : 500
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
    response.end(status === 404 ? 'Report file not found' : 'Could not read report file')
  }
})

server.on('error', (error) => { console.error('PropSphere report server failed:', error.message); process.exitCode = 1 })
server.listen(port, '127.0.0.1', () => console.log(`PropSphere QA report: http://127.0.0.1:${port}`))
