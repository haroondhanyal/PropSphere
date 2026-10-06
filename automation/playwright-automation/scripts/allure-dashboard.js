(() => {
  const cfg = window.__PROPSPHERE_ALLURE__
  if (!cfg || !document.body) return

  const summary = cfg.summary || {}
  const propertyData = summary.properties || { total: 0, byType: [], byPurpose: [], byCity: [], listings: [] }
  const colors = ['#fa3e59', '#ff7b2f', '#3189ee', '#9360ef', '#33b978', '#e7ad20', '#8a99aa', '#20b9ad']
  const element = (tag, className, text) => {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined && text !== null) node.textContent = String(text)
    return node
  }
  const format = (value) => new Intl.NumberFormat('en-US').format(Number(value) || 0)
  const price = (value) => `PKR ${format(value)}`
  const metric = (value, label, detail = '', icon = '•', tone = 'primary') => {
    const node = element('article', `ps-dash-metric ps-metric-${tone}`)
    const header = element('div', 'ps-metric-header')
    header.append(element('span', 'ps-metric-icon', icon), element('span', 'ps-metric-label', label))
    node.append(header, element('b', '', format(value)))
    if (detail) node.append(element('small', '', detail))
    return node
  }
  const panel = (title, subtitle) => {
    const node = element('section', 'ps-dash-panel')
    node.append(element('h3', '', title))
    if (subtitle) node.append(element('p', 'ps-dash-muted', subtitle))
    return node
  }
  const bar = (name, count, total, color) => {
    const row = element('div', 'ps-dash-bar-row')
    const track = element('span', 'ps-dash-track')
    const fill = element('i')
    fill.style.width = `${total ? Math.max(count ? 1 : 0, Math.round(count / total * 100)) : 0}%`
    if (color) fill.style.background = color
    track.append(fill)
    row.append(element('span', '', name), track, element('b', '', format(count)))
    return row
  }
  const pie = (items, total) => {
    const wrap = element('div', 'ps-dash-pie-wrap')
    const slices = []
    let position = 0
    items.forEach((item, index) => {
      const end = position + (total ? item.count / total * 100 : 0)
      slices.push(`${colors[index % colors.length]} ${position}% ${end}%`)
      position = end
    })
    const circle = element('div', 'ps-dash-pie')
    circle.dataset.total = `${format(total)}\nitems`
    circle.style.background = total ? `conic-gradient(${slices.join(',')})` : 'var(--color-bg-secondary)'
    const legend = element('div', 'ps-dash-legend')
    items.forEach((item, index) => {
      const line = element('span')
      const dot = element('i', 'ps-dash-dot')
      dot.style.background = colors[index % colors.length]
      line.append(dot, document.createTextNode(`${item.name} · ${format(item.count)}`))
      legend.append(line)
    })
    wrap.append(circle, legend)
    return wrap
  }

  const caseExplorer = () => {
    const cases = summary.testCases || []
    const section = panel('All test cases', 'Browse every saved result and open the native Allure Suites view for step-level details and attachments.')
    section.id = 'propsphere-case-explorer'
    const filters = element('div', 'ps-dash-filter')
    const search = element('input')
    search.type = 'search'
    search.placeholder = 'Search case name or screen'
    search.setAttribute('aria-label', 'Search test cases')
    const suite = element('select')
    suite.id = 'ps-case-suite-filter'
    suite.setAttribute('aria-label', 'Filter test cases by suite')
    ;['All suites', ...(summary.suites || []).map((item) => item.name)].forEach((name) => {
      const option = element('option', '', name)
      option.value = name === 'All suites' ? '' : name
      suite.append(option)
    })
    filters.append(search, suite, element('span', 'ps-dash-muted', `${format(cases.length)} case records`))
    section.append(filters)

    const scroll = element('div', 'ps-dash-table-wrap')
    const table = element('table', 'ps-dash-table')
    const head = element('thead')
    const headRow = element('tr')
    ;['Suite', 'Test case', 'Result', 'Duration', 'Evidence'].forEach((label) => headRow.append(element('th', '', label)))
    head.append(headRow)
    const body = element('tbody')
    cases.forEach((item) => {
      const row = element('tr', 'ps-case-row')
      const status = element('span', `ps-case-status ps-case-${String(item.status).toLowerCase()}`, item.status)
      ;[element('td', '', item.suite), element('td', '', item.title), (() => { const cell = element('td'); cell.append(status); return cell })(),
        element('td', '', `${format((item.durationMs || 0) / 1000)} s`), element('td', '', (item.evidence || []).join(' · ') || '—')].forEach((cell) => row.append(cell))
      row.dataset.suite = item.suite || ''
      row.dataset.search = `${item.title || ''} ${item.fullName || ''} ${item.suite || ''} ${item.status || ''}`.toLowerCase()
      body.append(row)
    })
    table.append(head, body)
    scroll.append(table)
    section.append(scroll)
    const visible = element('p', 'ps-dash-muted', `${cases.length} cases loaded`)
    section.append(visible)
    const apply = () => {
      const term = search.value.toLowerCase()
      let count = 0
      Array.from(body.rows).forEach((row) => {
        row.hidden = !row.dataset.search.includes(term) || (Boolean(suite.value) && row.dataset.suite !== suite.value)
        if (!row.hidden) count += 1
      })
      visible.textContent = `${format(count)} of ${format(cases.length)} cases shown`
      document.querySelectorAll('[data-ps-suite-link]').forEach((link) => link.setAttribute('aria-current', String(link.dataset.psSuiteLink === suite.value && Boolean(suite.value))))
    }
    search.addEventListener('input', apply)
    suite.addEventListener('change', apply)
    if (['UI', 'API', 'BDD', 'Database'].includes(window.__PROPSPHERE_CASE_FILTER__)) suite.value = window.__PROPSPHERE_CASE_FILTER__
    apply()
    return section
  }

  const categoryDashboard = () => {
    const root = element('section', 'ps-report-dashboard')
    root.id = 'propsphere-categories-dashboard'
    const heading = element('div', 'ps-dash-heading')
    const copy = element('div')
    copy.append(element('span', 'ps-dash-kicker', 'PropSphere · QA coverage'), element('h2', '', 'Categories'))
    copy.append(element('p', '', 'Suite-wise coverage, every test result, and failure triage. Use the header links to jump straight to UI, API, BDD, or Database cases.'))
    heading.append(copy, element('span', 'ps-dash-total', `${format(summary.total)} total test cases`))
    root.append(heading)

    const stats = element('div', 'ps-dash-metrics')
    const completed = (summary.passed || 0) + (summary.failed || 0) + (summary.broken || 0) + (summary.skipped || 0)
    const passRate = completed ? Math.round(summary.passed / completed * 100) : 0
    stats.append(
      metric(summary.total, 'Total cases', 'Across UI, API, BDD and database', '▦', 'total'),
      metric(summary.passed, 'Passed', `${passRate}% pass rate`, '✓', 'passed'),
      metric((summary.failed || 0) + (summary.broken || 0), 'Failed / broken', summary.failed || summary.broken ? 'Needs review' : 'No issues found', '!', 'failed'),
      metric(summary.skipped, 'Skipped', summary.skipped ? 'Pending execution' : 'All cases executed', 'Ⅱ', 'skipped'),
    )
    root.append(stats)

    const suiteStrip = element('div', 'ps-dash-suites')
    ;(summary.suites || []).forEach((suite, index) => {
      const card = element('article', `ps-dash-suite ps-suite-${String(suite.name).toLowerCase()}`)
      const top = element('div', 'ps-suite-top')
      top.append(element('span', 'ps-suite-icon', ['◫', '⇄', '◇', '▤'][index % 4]), element('span', '', suite.name))
      card.append(top, element('b', '', format(suite.cases)), element('small', '', 'test cases'))
      const track = element('span', 'ps-suite-track')
      const fill = element('i')
      fill.style.width = `${summary.total ? Math.round(suite.cases / summary.total * 100) : 0}%`
      track.append(fill)
      card.append(track, element('small', 'ps-suite-share', `${summary.total ? Math.round(suite.cases / summary.total * 100) : 0}% of suite`))
      suiteStrip.append(card)
    })
    if (suiteStrip.childElementCount) root.append(suiteStrip)

    const grid = element('div', 'ps-dash-grid')
    const coverage = panel('Test coverage by category', 'Counts are grouped from the API, database, BDD and UI suites in this run.')
    ;(summary.categories || []).forEach((item, index) => {
      const card = element('article', 'ps-dash-card')
      const row = element('div', 'ps-dash-heading')
      const title = element('div', 'ps-category-title')
      const icon = element('span', 'ps-category-icon', ['✦', '⌘', '⇄', '⌁', '▧', '◷', '△', 'Ⅱ'][index % 8])
      const name = element('div')
      name.append(element('h3', '', item.name), element('span', 'ps-dash-muted', item.description))
      title.append(icon, name)
      const total = element('div', 'ps-category-total')
      total.append(element('b', '', format(item.total)), element('small', '', `${item.total ? Math.round(item.passed / item.total * 100) : 0}% passed`))
      row.append(title, total)
      card.append(row, bar('Passed', item.passed, item.total, colors[index % colors.length]))
      card.append(bar('Failed / broken', item.failed, item.total, '#ed5361'), bar('Skipped', item.skipped, item.total, '#8a99aa'))
      coverage.append(card)
    })
    const chart = panel('Case distribution', 'All current test cases are counted, including areas with zero issues.')
    chart.append(pie((summary.categories || []).map((item) => ({ name: item.name, count: item.total })), summary.total))
    grid.append(coverage, chart)
    root.append(grid)
    root.append(caseExplorer())
    const clear = (summary.failed || 0) + (summary.broken || 0) === 0
    const note = element('div', `ps-dash-note${clear ? ' ps-dash-note-good' : ''}`)
    note.textContent = clear
      ? 'No failed or broken tests in this run. Screenshots and videos are attached to the UI and BDD cases.'
      : 'Failed tests and their screenshots, videos, and traces are available in the native Allure failure list below.'
    root.append(note)
    return root
  }

  const graphsDashboard = () => {
    const root = element('section', 'ps-report-dashboard')
    root.id = 'propsphere-graphs-dashboard'
    const heading = element('div', 'ps-dash-heading')
    const copy = element('div')
    copy.append(element('span', 'ps-dash-kicker', 'PropSphere · Marketplace inventory'), element('h2', '', 'Graphs & property details'))
    copy.append(element('p', '', 'The original Allure graphs are shown first, including status, severity, duration, category trend, duration trend, history trend, and retry trend. Property inventory details follow below.'))
    heading.append(copy, element('span', 'ps-dash-total', `${format(propertyData.total)} properties`))
    root.append(heading)

    const representedTypes = (propertyData.byType || []).filter((item) => item.count > 0).length
    const stats = element('div', 'ps-dash-metrics')
    stats.append(metric(propertyData.total, 'Listings'), metric(representedTypes, 'Property types'), metric((propertyData.byCity || []).length, 'Cities'), metric(propertyData.averageAreaSqft || 0, 'Average area · sq ft'))
    const average = element('article', 'ps-dash-metric')
    average.append(element('b', '', price(propertyData.averagePrice || 0)), element('span', '', 'Average price'))
    stats.append(average)
    root.append(stats)

    const grid = element('div', 'ps-dash-grid')
    const types = panel('Listings by property type', 'All supported types are shown, including types with no listings.')
    ;(propertyData.byType || []).forEach((item, index) => types.append(bar(item.name, item.count, propertyData.total, colors[index % colors.length])))
    const purposes = panel('Sale and rent mix', 'Listing purpose for the inventory in this run.')
    purposes.append(pie(propertyData.byPurpose || [], propertyData.total))
    const cities = panel('Inventory by city', 'Listings across all seeded marketplace cities.')
    ;(propertyData.byCity || []).forEach((item) => cities.append(bar(item.name, item.count, propertyData.total)))

    const priceBands = [
      { name: 'Under PKR 1M', match: (value) => value < 1_000_000 },
      { name: 'PKR 1M–5M', match: (value) => value >= 1_000_000 && value < 5_000_000 },
      { name: 'PKR 5M–15M', match: (value) => value >= 5_000_000 && value < 15_000_000 },
      { name: 'PKR 15M–50M', match: (value) => value >= 15_000_000 && value < 50_000_000 },
      { name: 'PKR 50M+', match: (value) => value >= 50_000_000 },
    ]
    const prices = panel('Price distribution', 'Published sale and rental listings grouped by listed price.')
    priceBands.forEach((band, index) => prices.append(bar(band.name, propertyData.listings.filter((item) => item.price != null && Number.isFinite(Number(item.price)) && band.match(Number(item.price))).length, propertyData.total, colors[index % colors.length])))

    const areaBands = [
      { name: 'Under 1,000 sq ft', match: (value) => value < 1_000 },
      { name: '1,000–2,000 sq ft', match: (value) => value >= 1_000 && value < 2_000 },
      { name: '2,000–5,000 sq ft', match: (value) => value >= 2_000 && value < 5_000 },
      { name: '5,000–10,000 sq ft', match: (value) => value >= 5_000 && value < 10_000 },
      { name: '10,000+ sq ft', match: (value) => value >= 10_000 },
    ]
    const areas = panel('Area distribution', 'Property floor area grouped into square-foot bands.')
    areaBands.forEach((band, index) => areas.append(bar(band.name, propertyData.listings.filter((item) => item.areaSqft != null && Number.isFinite(Number(item.areaSqft)) && band.match(Number(item.areaSqft))).length, propertyData.total, colors[(index + 2) % colors.length])))

    const bedroomBands = [
      { name: 'Studio / 0 bedrooms', match: (value, item) => item.bedrooms != null && value === 0 },
      { name: '1–2 bedrooms', match: (value, item) => item.bedrooms != null && value >= 1 && value <= 2 },
      { name: '3–4 bedrooms', match: (value, item) => item.bedrooms != null && value >= 3 && value <= 4 },
      { name: '5+ bedrooms', match: (value, item) => item.bedrooms != null && value >= 5 },
      { name: 'Not specified', match: (_value, item) => item.bedrooms == null },
    ]
    const bedrooms = panel('Bedroom mix', 'Residential inventory grouped by bedroom count; non-residential listings are included as not specified.')
    bedroomBands.forEach((band, index) => bedrooms.append(bar(band.name, propertyData.listings.filter((item) => band.match(Number(item.bedrooms), item)).length, propertyData.total, colors[(index + 4) % colors.length])))

    grid.append(types, purposes, cities, prices, areas, bedrooms)
    root.append(grid)

    const tablePanel = panel('Property-by-property detail', 'Search the captured inventory and review type, purpose, location, price, area, rooms, floors, and media count.')
    const filters = element('div', 'ps-dash-filter')
    const search = element('input')
    search.type = 'search'
    search.placeholder = 'Search name, city, or community'
    search.setAttribute('aria-label', 'Filter property details')
    const typeSelect = element('select')
    typeSelect.setAttribute('aria-label', 'Filter property type')
    ;['All property types', ...(propertyData.byType || []).map((item) => item.name)].forEach((name) => {
      const option = element('option', '', name)
      option.value = name === 'All property types' ? '' : name
      typeSelect.append(option)
    })
    filters.append(search, typeSelect)
    tablePanel.append(filters)

    const scroll = element('div', 'ps-dash-table-wrap')
    const table = element('table', 'ps-dash-table')
    const head = element('thead')
    const headerRow = element('tr')
    ;['Property', 'Type / purpose', 'City / community', 'Price (PKR)', 'Area (sq ft)', 'Beds / baths / floors', 'Photos / videos', 'Status'].forEach((name) => headerRow.append(element('th', '', name)))
    head.append(headerRow)
    const body = element('tbody')
    ;(propertyData.listings || []).forEach((property) => {
      const row = element('tr')
      const title = element('td')
      title.append(element('b', '', property.title || property.slug || 'Listing'), element('small', '', property.slug || ''))
      const type = element('td')
      type.append(element('span', 'ps-dash-pill', property.type || '—'), element('small', '', property.purpose || ''))
      const city = element('td')
      city.append(element('b', '', property.city || '—'), element('small', '', property.community || ''))
      ;[title, type, city, element('td', '', price(property.price)), element('td', '', format(property.areaSqft)),
        element('td', '', [property.bedrooms ?? '—', property.bathrooms ?? '—', property.floors ?? '—'].join(' / ')),
        element('td', '', format(property.mediaCount)), element('td', '', property.status || '—')].forEach((cell) => row.append(cell))
      row.dataset.search = [property.title, property.slug, property.city, property.community, property.type, property.purpose].join(' ').toLowerCase()
      row.dataset.type = property.type || ''
      body.append(row)
    })
    table.append(head, body)
    scroll.append(table)
    tablePanel.append(scroll)
    root.append(tablePanel)

    const note = element('div', 'ps-dash-note', 'The original Allure Graphs page follows this inventory overview and retains all seven test analytics: status, severity, duration, category trend, duration trend, history trend, and retry trend.')
    root.append(note)
    const filterRows = () => {
      const term = search.value.toLowerCase()
      Array.from(body.rows).forEach((row) => { row.hidden = !row.dataset.search.includes(term) || (Boolean(typeSelect.value) && row.dataset.type !== typeSelect.value) })
    }
    search.addEventListener('input', filterRows)
    typeSelect.addEventListener('change', filterRows)
    return root
  }

  const syncDashboard = () => {
    const selected = document.querySelector('.side-nav__link_active')?.dataset.tab
    // Leave Graphs to Allure itself: its seven native widgets include the
    // status, severity, duration, categories, duration/history/retry trends.
    const tab = selected === 'categories' ? 'categories' : ''
    const host = document.querySelector('.app__content')
    if (!host) return
    document.querySelectorAll('#propsphere-categories-dashboard,#propsphere-graphs-dashboard').forEach((node) => {
      if (!tab || node.id !== `propsphere-${tab}-dashboard`) node.remove()
    })
    if (!tab) { delete host.dataset.psCategoriesEmpty; return }
    const id = `propsphere-${tab}-dashboard`
    if (!document.getElementById(id)) {
      host.prepend(categoryDashboard())
    }
    host.dataset.psCategoriesEmpty = tab === 'categories' && (summary.failed || 0) + (summary.broken || 0) === 0 ? 'true' : 'false'
  }

  // The branded header is installed by brand-allure.mjs; observe Allure's client-side route changes here.
  const start = () => {
    if (!document.body) return
    document.addEventListener('click', (event) => {
      const link = event.target.closest('[data-ps-suite-link]')
      if (!link) {
        if (event.target.closest('.side-nav__link[data-tab="categories"]') && !window.__PROPSPHERE_OPENING_SUITE__) {
          delete window.__PROPSPHERE_CASE_FILTER__
          const resetFilter = (attempt = 0) => {
            syncDashboard()
            const filter = document.querySelector('#ps-case-suite-filter')
            if (filter) { filter.value = ''; filter.dispatchEvent(new Event('change', { bubbles: true })) }
            else if (attempt < 20) window.setTimeout(() => resetFilter(attempt + 1), 50)
          }
          window.setTimeout(() => resetFilter(), 0)
        }
        return
      }
      event.preventDefault()
      window.__PROPSPHERE_SELECTED_PACKAGE__ = ({ UI: 'ui-testing', API: 'api-testing', BDD: 'bdd', Database: 'db-testing' })[link.dataset.psSuiteLink]
      document.querySelectorAll('[data-ps-suite-link]').forEach((item) => item.setAttribute('aria-current', String(item === link)))
      window.__PROPSPHERE_OPENING_SUITE__ = true
      document.querySelector('.side-nav__link[data-tab="packages"]')?.click()
      window.__PROPSPHERE_OPENING_SUITE__ = false
      // Packages is Allure's native hierarchical test-case browser. Let its
      // router own the URL, then expand the matching package to expose cases.
      const packageName = window.__PROPSPHERE_SELECTED_PACKAGE__
      const packageNode = packageName === 'db-testing' ? 'db-testing.database-contract.spec.ts' : packageName
      const revealPackage = (attempt = 0) => {
        const groups = Array.from(document.querySelectorAll('.node[data-node-kind="group"]'))
        const target = groups.find((node) => node.querySelector(':scope > .node__title')?.textContent.toLowerCase().includes(packageNode))
        if (target) {
          if (!target.classList.contains('node__expanded')) target.querySelector(':scope > .node__title')?.click()
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
          return
        }
        const collapsed = groups.find((node) => !node.classList.contains('node__expanded'))
        if (collapsed) collapsed.querySelector(':scope > .node__title')?.click()
        if (attempt < 30) window.setTimeout(() => revealPackage(attempt + 1), 100)
      }
      window.setTimeout(() => revealPackage(), 120)
    })
    const observer = new MutationObserver(syncDashboard)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] })
    syncDashboard()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true })
  else start()
})()
