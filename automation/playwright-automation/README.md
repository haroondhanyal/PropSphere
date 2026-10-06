# PropSphere Playwright automation

The automation code is organized by app section, screen, and test purpose. Each of the **34 application screens** has a dedicated page object under `pages/` and a separate, paired locator module under the section-matched `locators/` tree (`public`, `auth`, `workspace`, `admin`, `system`). Admin has its own overview/review pages; the four overview panels (users/roles, risk, audit, settings) each have a separate test.

The current suite contains **900 distinct Playwright cases** across the complete UI, API, BDD, and database scope:

| Suite | Cases | What each case checks |
| --- | ---: | --- |
| DB schema and integrity | 120 | Parameterized PostgreSQL metadata query per model/check, with query and result evidence |
| API | 150 | Endpoint access, property search/filter/sort/pagination contracts, and request/response checks |
| BDD | 200 | Named Given/When/Then marketplace search journeys across location, purpose, type, budget, and sorting |
| UI smoke | 71 | Screen-specific route/header and control checks for 34 app screens |
| UI regression | 354 | Desktop, laptop, tablet, and mobile/responsive/a11y checks per screen, plus search and workflows |
| UI integration | 2 | Workspace navigation and local saved-property interaction |
| UI negative | 3 | Admin guard, buyer role restriction, and invalid sign-in |

Allure attaches a screenshot and recorded video to every BDD/UI case, plus failure traces, step details, and JSON request/DB evidence. Shared hooks attach before/after lifecycle context. Verified with `npx playwright test --workers=4`: **900/900 passed** across 47 files. The Allure report includes all 900 latest results with screenshots/videos for UI/BDD cases. Report output is generated locally and git-ignored.

## Project layout

```text
automation/
├── playwright-automation/
│   ├── config/                 # environment and Playwright settings
│   ├── data/                   # seeded accounts, properties, API route list
│   ├── pages/                  # per-section, per-screen page objects
│   ├── locators/               # paired locator modules, grouped by section
│   ├── tests/                  # DB, API, BDD, screen-wise UI suites
│   ├── utils/                  # login, Faker data, small form helpers
│   ├── report/                 # PropSphere branded Allure portal
│   └── .env                    # local values, ignored by Git
└── performance-testing/k6/     # k6 read-only load scenarios
```

## Install and configure

Install the application workspaces first so Prisma Client is generated, then install browser automation separately:

```sh
npm install
cd automation/playwright-automation
npm install
npx playwright install chromium
cp .env.example .env
cd ../..
npm run db:seed
```

`.env` is already created as a local ignored file for this checkout. It points at the local seeded admin and buyer demo accounts. Change it to disposable test credentials for another environment; never copy demo credentials into production configuration. The app/API must be running at the configured URLs. Defaults: web `http://127.0.0.1:5174`, API `http://127.0.0.1:3002/api`.

`config/env.ts` reads `.env` values, applies local defaults, and exposes one small `env` object. Change URLs/accounts there through environment values; test data belongs in `data/`, dynamic values in `utils/faker.ts`, and locators stay next to their screen page object.

## Run small, focused scripts

From the repository root:

```sh
npm run automation:test:public
npm run automation:test:auth
npm run automation:test:workspace
npm run automation:test:admin
npm run automation:test:db
npm run automation:test:api
npm run automation:test:bdd
npm run automation:test:ui
npm run automation:test
```

You can target a screen by title from the automation directory, for example:

```sh
cd automation/playwright-automation
npx playwright test --grep "Search screen"
```

Tests are read-only except browser-local shortlist interaction. API suite uses the seeded admin for protected GET routes; it does not attach the login token to Allure. Faker supplies generated contact, signup, listing and search filter values, and is seeded by `TEST_SEED` so the data stays reproducible.

## Database test safety

DB checks use `DATABASE_URL_TEST` and refuse a database whose name does not end in `_test`. Create a separate disposable database, apply migrations, and run the DB suite:

```sh
docker compose exec postgres createdb -U propsphere propsphere_test
DATABASE_URL=postgresql://propsphere:propsphere@localhost:5433/propsphere_test?schema=public npm run db:migrate
DATABASE_URL_TEST=postgresql://propsphere:propsphere@localhost:5433/propsphere_test?schema=public npm run automation:test:db
```

Each of 120 cases makes a parameterized, read-only schema request and attaches the SQL, model parameter, columns count, and primary-key data. They are schema checks, not 120 database mutation tests.

## Reports and K6

```sh
npm run automation:report
npm run automation:report:serve
```

The full Allure report opens at `automation/playwright-automation/allure-report/index.html`; the branded overview lives at `automation/playwright-automation/report/index.html`. The generator ignores a stale `JAVA_HOME` and uses Java from `PATH`. The PropSphere header shows the run totals, date, logo, and **Raja Haroon Jamal · QA Department · Full Stack QA Automation Tester**. Header colors (10 choices) and report-wide content themes (8 choices) are independent and saved in the browser. The theme is applied to both the navigation and report panels.

The report header's **UI**, **API**, **BDD**, and **Database** links open the matching Allure Packages branch. The custom **Categories** view summarizes all 900 cases across eight QA groups and includes a searchable table of saved results. **Graphs** retains the seven native Allure analytics widgets: status, severity, duration, category trend, duration trend, history trend, and retry trend. Native Allure views also include suites, behaviors, packages, timelines, step details, screenshots, videos, and traces. Header links open both the modern 200-case K6 dashboard and the separate native K6 report, which contains per-case executor, VU, iteration, response, timing, and check details. Both use the same logo, header palette, and report themes. Environment and executor metadata are written into each generated report; Allure history is carried forward for trend charts.

If the browser shows a missing report or “failed to load”, regenerate and serve it from the repository root:

```sh
npm run automation:report
npm run automation:report:serve
```

Open `http://127.0.0.1:4178/allure/index.html`. The report server safely returns 404 for absent assets instead of crashing, and disables stale browser caching. Generated reports and test evidence are git-ignored. The Allure header and report center link to both `/performance/index.html` and `/performance/native-k6-report.html`.

Install K6 separately and follow [`../performance-testing/k6/README.md`](../performance-testing/k6/README.md). The workspace load scenario requires `E2E_TOKEN`; use a short-lived token from a disposable test account.
