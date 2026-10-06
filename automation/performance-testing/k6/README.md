# PropSphere performance checks (k6)

Install [k6](https://k6.io/docs/get-started/installation/) and start the API. Run the 200-case marketplace workload from the repository root:

```sh
npm run performance:test
```

The workload contains 200 separately named cases: 20 listing search/filter patterns across Islamabad, Rawalpindi, Lahore, Karachi, Peshawar, Faisalabad, Multan, Quetta, Hyderabad, and Sialkot. It sends read-only `GET /properties` requests with 8 virtual users by default and checks HTTP status, JSON shape, and response time. Thresholds cover request errors and p95/p99 latency. Override `API_BASE_URL`, `K6_VUS`, or `K6_MAX_DURATION` for a test environment.

The run saves k6 JSON metrics, its native JSON summary, CLI output, a text rendering of native metric values, and two HTML reports in the ignored `report-output/` folder. `npm run performance:report` rebuilds reports from saved k6 data without running k6 again. Start the combined QA report server with `npm run automation:report:serve`, then visit:

- `/performance/index.html` — modern dashboard with percentile charts, thresholds, executor profile, searchable cases, and direct per-case detail links.
- `/performance/native-k6-report.html` — separate native run report with k6 metrics, execution profile, CLI output, and native summary JSON.
- `/performance/native-k6-summary.json` — unmodified machine-readable summary emitted by k6 `handleSummary()`.
- `/performance/native-k6-summary.txt` — readable summary of the native k6 metrics.

Each case opens a shareable detail view with its request URL and query, status, response bytes, timestamps, scenario/executor, VU and iteration, phase timings, and individual assertion results. The two HTML reports use the PropSphere logo, the same 10 header colors and 8 themes as Allure, and the QA identity. The Allure header and QA report center link to both k6 views. The older endpoint scripts remain available; `authenticated-workspace.js` requires `E2E_TOKEN`.
