<p align="center">
  <img src="docs/propsphere-logo.svg" alt="PropSphere" width="360" />
</p>

<h1 align="center">PropSphere</h1>

<p align="center">One connected workspace for discovering, selling, renting, and managing property.</p>

<p align="center">
  <img alt="Vue 3" src="https://img.shields.io/badge/Vue-3-42b883?logo=vuedotjs&logoColor=white" />
  <img alt="NestJS" src="https://img.shields.io/badge/API-NestJS-ea2845?logo=nestjs&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-end--to--end-3178c6?logo=typescript&logoColor=white" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/Database-PostgreSQL-4169e1?logo=postgresql&logoColor=white" />
</p>

<p align="center"><a href="#quick-start">Quick start</a> · <a href="#system-architecture">Architecture</a> · <a href="#roles-and-access">Roles</a> · <a href="#fresh-screenshots-and-screen-guide">Screenshots</a> · <a href="#local-configuration">Configuration</a> · <a href="#troubleshooting">Troubleshooting</a></p>

---

## Project at a glance

PropSphere is a multi-tenant real-estate marketplace and property operations platform. It connects public listings with the people and workflows behind them: buyers, tenants, owners, salespeople, sales managers, developers, vendors, finance teams, and organization admins. Its Pakistan demo inventory spans ten cities and residential, commercial, and industrial listings.

The product is organized into **five integrated phases**. Core marketplace, sales, property operations, development, stays, finance, and organization administration flows are implemented. Demo prices, photos, accounts, and addresses are illustrative and must not be treated as live real-estate offers.

## Quick start

Requirements: Node.js 20+, npm 10+, and Docker Compose. From the repository root:

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:5173`. The API is at `http://127.0.0.1:3000/api`, its health check is `/api/health`, and local Swagger is at `http://127.0.0.1:3000/docs`. Demo sign-ins and occupied-port alternatives are in [Local development](#local-setup).

## Product screens

| Area | Main screens |
| --- | --- |
| Marketplace | Home, search results (list/map-ready), property details, saved properties |
| Buyer and tenant | Overview, viewings, offers/applications, bookings, lease/payments, maintenance, messages |
| Owner and manager | Portfolio, properties/units, tenants/leases, rent ledger, maintenance, statements |
| Agent CRM | Leads, lead details, pipeline, viewings, offers, tasks |
| Developer | Projects, unit inventory, reservations, installment schedule |
| Vendor | Assigned jobs, job details, quotes, invoices |
| Finance | Payments, expenses, payouts, statements, reports |
| Admin | Overview, listing approvals, users/roles, risk flags, audit log, settings |
| Sales manager | Organization-wide sales team results and customer sales pipeline; cannot approve listings |
| Salesperson | Assigned customer leads, contact details, property prices, and personal follow-ups |

Screens share the same records and permissions. For example, an approved listing is searchable; a viewing creates an agent activity; an accepted rental application can become a lease; rent and maintenance costs flow into owner statements.

## Roles and access

Roles belong to an organization membership. The API checks the current membership on each authenticated request, so a role change takes effect without waiting for a token to expire. A user can belong to multiple organizations and switch the active workspace.

| Role | Can do | Restricted from |
| --- | --- | --- |
| Admin | Manage organization users/roles, review risk/audit/settings, approve or reject listings, and manage organization workflows | Cannot remove the last admin from the organization |
| Sales manager | View all organization salespeople, sales totals, customer contacts, linked properties/prices, and lead stages | Cannot approve listings or manage organization roles/settings |
| Salesperson (`AGENT`) | Work assigned customer leads, contact details, pipeline stages, notes, follow-ups, and assigned sales activity | Cannot view another salesperson’s leads or approve listings |
| Owner | Manage own portfolio, units, leases, rent, maintenance and owner finance views | Other owners’ private portfolio data |
| Buyer | Save listings/searches, contact listing teams, request viewings, submit offers, and track own applications | Other customers’ private records and organization controls |
| Tenant | View own lease/invoices, make eligible payments, request maintenance, and follow own bookings | Other tenants’ records and organization controls |
| Developer | Manage development projects, units, reservations, and installment schedules | Organization administration and listing approvals |
| Finance | Review authorized finance records, expenses, payouts, reservations, and vendor bills | Listing approvals and organization administration |
| Vendor | See assigned maintenance work and submit eligible job bills | Other vendors’ jobs and organization finance controls |

New public signups create a separate organization; the first member becomes its admin. Admins add an existing PropSphere account to their organization and choose that membership’s role. Role names in code stay simple: `ADMIN`, `SALES_MANAGER`, and `AGENT` (shown in the product as “Salesperson”), plus the marketplace and operations roles above.

## System architecture

PropSphere is a deliberately simple **modular monolith**: one Vue application, one REST API, and one PostgreSQL database. Business modules keep their own controllers and workflows while sharing Prisma persistence and the current organization membership.

```mermaid
flowchart LR
  Browser[Vue 3 + TypeScript + Vite] -->|REST /api · JWT| API[NestJS modular API]
  API --> Auth[AuthGuard + live membership roles]
  Auth --> Modules[Properties · Workflows · Admin · Finance · Stays]
  Modules --> Prisma[Prisma ORM]
  Prisma --> DB[(PostgreSQL)]
  Modules -. optional email .-> SMTP[SMTP provider]
  Modules -. hosted checkout .-> Pay[Safepay]
```

### Request and data boundaries

1. A user signs in or creates a workspace. The API returns an eight-hour JWT and organization membership details.
2. The Vue client sends the JWT as a Bearer token for authenticated API calls.
3. `AuthGuard` verifies the token and looks up the user's active organization membership; role authorization uses that live membership.
4. API services scope organization records using `organizationId` and apply user/assignment filters for private customer, owner, and salesperson records.
5. Prisma writes to PostgreSQL. Sensitive workflow changes use transactions/audit records where implemented.

```mermaid
erDiagram
  ORGANIZATION ||--o{ MEMBERSHIP : grants
  USER ||--o{ MEMBERSHIP : joins
  ORGANIZATION ||--o{ PROPERTY : contains
  PROPERTY ||--o{ LEAD : attracts
  USER ||--o{ LEAD : customer
  USER ||--o{ LEAD : assigned_salesperson
  PROPERTY ||--o{ VIEWING : receives
  PROPERTY ||--o{ OFFER : receives
  PROPERTY ||--o{ LEASE : rents
  LEASE ||--o{ RENT_INVOICE : bills
  PROPERTY ||--o{ MAINTENANCE_REQUEST : tracks
```

## Developer map

| Path | Responsibility |
| --- | --- |
| `apps/web/src/views/` | Route-level Vue screens |
| `apps/web/src/components/` | Reusable listing cards and grids |
| `apps/web/src/router.ts` | Routes and client-side role-aware navigation |
| `apps/web/src/api.ts` | Axios API base URL and Bearer token attachment |
| `apps/web/src/style.css`, `workspace.css` | Shared marketplace and workspace styles |
| `apps/api/src/modules/auth.module.ts` | Signup, login, organization switching, password reset |
| `apps/api/src/modules/properties.module.ts` | Listing search, details, favorites, review and approval |
| `apps/api/src/modules/workflows.module.ts` | Leads, viewings, offers, leases, rent, inbox and maintenance |
| `apps/api/src/modules/phase-four.module.ts` | Developments, stays, finance and vendor bills |
| `apps/api/src/modules/admin.module.ts` | Users/roles, risk flags, settings and audit history |
| `apps/api/src/modules/payments.module.ts` | Rent checkout and Safepay webhook processing |
| `apps/api/prisma/schema.prisma` | Database models and enums |
| `apps/api/prisma/migrations/` | Ordered database migrations |
| `apps/api/prisma/seed.ts` | Repeatable sample inventory and demo accounts |
| `docs/screenshots/` | Compressed, current application screenshots |

Keep feature code in the existing workspaces; there is no separate shared package or root-level Prisma project. Add a business module only when it has a clear workflow boundary.

## Fresh screenshots and screen guide

These screenshots were captured from the running app on **October 6, 2026** using seeded demo data. Desktop captures use a 1440 px viewport; the two mobile captures use a 390 px viewport. The images show illustrative sample records, not live property offers. Select any thumbnail to open its full-size capture.

<details>
<summary>Open the full screenshot gallery (32 captures)</summary>

<table>
<tr>
<td><a href="docs/screenshots/home.jpg"><img src="docs/screenshots/home.jpg" width="230" alt="Marketplace home" /></a><br /><sub>Marketplace home</sub></td>
<td><a href="docs/screenshots/search-buy.jpg"><img src="docs/screenshots/search-buy.jpg" width="230" alt="Buy search" /></a><br /><sub>Buy search</sub></td>
<td><a href="docs/screenshots/search-rent.jpg"><img src="docs/screenshots/search-rent.jpg" width="230" alt="Rent search" /></a><br /><sub>Rent search</sub></td>
<td><a href="docs/screenshots/property-detail.jpg"><img src="docs/screenshots/property-detail.jpg" width="230" alt="Property detail" /></a><br /><sub>Property detail</sub></td>
</tr><tr>
<td><a href="docs/screenshots/favorites.jpg"><img src="docs/screenshots/favorites.jpg" width="230" alt="Saved properties" /></a><br /><sub>Saved properties</sub></td>
<td><a href="docs/screenshots/short-stays.jpg"><img src="docs/screenshots/short-stays.jpg" width="230" alt="Public short stays" /></a><br /><sub>Public short stays</sub></td>
<td><a href="docs/screenshots/login.jpg"><img src="docs/screenshots/login.jpg" width="230" alt="Sign in" /></a><br /><sub>Sign in</sub></td>
<td><a href="docs/screenshots/signup.jpg"><img src="docs/screenshots/signup.jpg" width="230" alt="Create workspace" /></a><br /><sub>Create workspace</sub></td>
</tr><tr>
<td><a href="docs/screenshots/forgot-password.jpg"><img src="docs/screenshots/forgot-password.jpg" width="230" alt="Forgot password" /></a><br /><sub>Forgot password</sub></td>
<td><a href="docs/screenshots/reset-password.jpg"><img src="docs/screenshots/reset-password.jpg" width="230" alt="Set a new password" /></a><br /><sub>Set a new password</sub></td>
<td><a href="docs/screenshots/listing-submission.jpg"><img src="docs/screenshots/listing-submission.jpg" width="230" alt="Submit a listing" /></a><br /><sub>Submit a listing</sub></td>
<td><a href="docs/screenshots/workspace-overview.jpg"><img src="docs/screenshots/workspace-overview.jpg" width="230" alt="Workspace overview" /></a><br /><sub>Workspace overview</sub></td>
</tr><tr>
<td><a href="docs/screenshots/sales-pipeline.jpg"><img src="docs/screenshots/sales-pipeline.jpg" width="230" alt="Sales lead pipeline" /></a><br /><sub>Sales lead pipeline</sub></td>
<td><a href="docs/screenshots/sales-team.jpg"><img src="docs/screenshots/sales-team.jpg" width="230" alt="Manager sales team" /></a><br /><sub>Manager sales team</sub></td>
<td><a href="docs/screenshots/viewings.jpg"><img src="docs/screenshots/viewings.jpg" width="230" alt="Viewings" /></a><br /><sub>Viewings</sub></td>
<td><a href="docs/screenshots/offers-applications.jpg"><img src="docs/screenshots/offers-applications.jpg" width="230" alt="Offers and applications" /></a><br /><sub>Offers and applications</sub></td>
</tr><tr>
<td><a href="docs/screenshots/portfolio-units.jpg"><img src="docs/screenshots/portfolio-units.jpg" width="230" alt="Portfolio and units" /></a><br /><sub>Portfolio and units</sub></td>
<td><a href="docs/screenshots/leases.jpg"><img src="docs/screenshots/leases.jpg" width="230" alt="Leases" /></a><br /><sub>Leases</sub></td>
<td><a href="docs/screenshots/rent-payments.jpg"><img src="docs/screenshots/rent-payments.jpg" width="230" alt="Rent and payments" /></a><br /><sub>Rent and payments</sub></td>
<td><a href="docs/screenshots/maintenance.jpg"><img src="docs/screenshots/maintenance.jpg" width="230" alt="Maintenance" /></a><br /><sub>Maintenance</sub></td>
</tr><tr>
<td><a href="docs/screenshots/saved-searches.jpg"><img src="docs/screenshots/saved-searches.jpg" width="230" alt="Saved searches" /></a><br /><sub>Saved searches</sub></td>
<td><a href="docs/screenshots/inbox.jpg"><img src="docs/screenshots/inbox.jpg" width="230" alt="Inbox" /></a><br /><sub>Inbox</sub></td>
<td><a href="docs/screenshots/developments.jpg"><img src="docs/screenshots/developments.jpg" width="230" alt="Developments" /></a><br /><sub>Developments</sub></td>
<td><a href="docs/screenshots/workspace-stays.jpg"><img src="docs/screenshots/workspace-stays.jpg" width="230" alt="Stay management" /></a><br /><sub>Stay management</sub></td>
</tr><tr>
<td><a href="docs/screenshots/finance.jpg"><img src="docs/screenshots/finance.jpg" width="230" alt="Finance" /></a><br /><sub>Finance</sub></td>
<td><a href="docs/screenshots/vendor-bills.jpg"><img src="docs/screenshots/vendor-bills.jpg" width="230" alt="Vendor bills" /></a><br /><sub>Vendor bills</sub></td>
<td><a href="docs/screenshots/admin-workspace.jpg"><img src="docs/screenshots/admin-workspace.jpg" width="230" alt="Admin workspace" /></a><br /><sub>Admin workspace</sub></td>
<td><a href="docs/screenshots/listing-review.jpg"><img src="docs/screenshots/listing-review.jpg" width="230" alt="Admin listing review" /></a><br /><sub>Admin listing review</sub></td>
</tr><tr>
<td><a href="docs/screenshots/unauthorized.jpg"><img src="docs/screenshots/unauthorized.jpg" width="230" alt="Access restricted" /></a><br /><sub>Access restricted</sub></td>
<td><a href="docs/screenshots/not-found.jpg"><img src="docs/screenshots/not-found.jpg" width="230" alt="Page not found" /></a><br /><sub>Page not found</sub></td>
<td><a href="docs/screenshots/home-mobile.jpg"><img src="docs/screenshots/home-mobile.jpg" width="230" alt="Marketplace home on mobile" /></a><br /><sub>Marketplace home · mobile</sub></td>
<td><a href="docs/screenshots/workspace-overview-mobile.jpg"><img src="docs/screenshots/workspace-overview-mobile.jpg" width="230" alt="Workspace overview on mobile" /></a><br /><sub>Workspace overview · mobile</sub></td>
</tr>
</table>
</details>

### What each screen and panel does

| Screen | Main panels and purpose |
| --- | --- |
| Marketplace home | Global navigation opens buy, rent, stays, saved homes, workspace, and listing submission. The hero introduces the marketplace; the tabbed search panel filters by city, property type, and price; featured cards open listings; the trust strip summarizes listing review and city coverage. |
| Buy search | Filter bar narrows sale listings by location, type, and price; results toolbar reports matches and sorting; property cards show purpose, price, location, room/area facts, and a save control. |
| Rent search | The same search panels are pre-set for rental inventory; cards show monthly rent and can open details or be saved. |
| Property detail | Gallery presents listing photos; heading shows purpose, title, community, and save/share actions; fact tiles show rooms and area; detail sections show description, attributes, and location; the sticky contact card shows price and viewing/inquiry actions. The inquiry modal collects a message and optional phone and creates a sales lead. |
| Saved properties | Shortlist header explains the saved-items view; property cards reopen a listing or remove it from the saved set; empty state links back to search. |
| Public short stays | Stay cards show city, capacity, nightly rate, and photos; selecting one opens the booking panel with dates, guest count, stay estimate, and request action. |
| Sign in | Branded background, email/password form, sign-in action, password recovery/workspace links, and demo-account hint. |
| Create workspace | Name, work email, organization, and password fields create a new tenant workspace whose first member is its admin. |
| Forgot password | Email form requests a reset link; the response is phrased without revealing whether an account exists. Email delivery needs SMTP configuration. |
| Reset password | Token-based form sets a new password; the screenshot uses a visual-only demo token and is not a usable reset link. |
| Submit listing | Listing form collects title, city/community, purpose, type, price, area, rooms, photo URL, and description; submission enters the admin review queue. |
| Workspace overview | KPI cards summarize properties, viewings, leases, maintenance, leads, invoices, and offers/applications. The shortcut panel links to common tasks; the unit-mix panel summarizes occupancy and links to the portfolio. Values are scoped to the signed-in organization and role. |
| Sales lead pipeline | Nine stage columns show assigned lead cards; each card includes customer contact, property and price, recent activity, note entry, and stage control. Summary counts show won/lost work; the follow-up panel adds and completes personal tasks. Salespeople only receive their assigned leads. |
| Sales team | KPI tiles summarize team size, active leads, won deals, and estimated won value. Team performance rows compare each salesperson; organization pipeline rows expose customer contact and linked property price to Admin/Sales Manager. |
| Viewings | Buyer/tenant form requests a property visit or video call; the schedule list shows date, property, requester, and state; permitted staff can confirm, complete, or cancel visits, while requesters can cancel eligible requests. |
| Offers and applications | The deals screen groups purchase offers and rental applications, shows customer/property/status context, and exposes review or response actions permitted by role. |
| Portfolio and units | Portfolio panels list organization properties and their listing state; property forms create/edit inventory; unit controls show availability and support unit creation for eligible owner/admin users. |
| Leases | Lease list connects property, owner, tenant, dates, and current status; eligible owners/admins can end an active lease, which updates its unit and future invoices. |
| Rent and payments | Invoice rows show property, tenant, due date, balance, and payment state; manual payment entry records cash/bank/cheque; tenants can continue an eligible invoice through hosted checkout when Safepay is configured. |
| Maintenance | New-request panel captures property, issue, category, priority, and details; ticket cards track status, SLA, requester, vendor, and quote; manager controls assign vendors/update status; service-provider panel lists and adds vendors. |
| Saved searches | Saved query cards preserve search filters, let the user enable/disable alerts, and remove obsolete searches; email digests require SMTP. |
| Inbox | Conversation list shows customer and property context; thread header links to the listing; message history preserves the conversation; composer sends a reply and optional SMTP notification. |
| Developments | Project form and selector manage projects; unit inventory records number/floor/rooms/area/price; reservation panel captures customer and deposit; confirmed reservations expose installment scheduling and payment tracking. |
| Stay management | Host workspace lists booking requests and stay details; eligible hosts confirm/reject/cancel requests and guests can review or cancel their own bookings. |
| Finance | Date-range report summarizes rent, expenses, and payouts; expense and payout panels record organization financial entries and track payout completion. |
| Vendor bills | Submitted work invoices show vendor/job/amount and review state; finance/admin/owner roles can approve or reject eligible bills. |
| Admin workspace | Users & roles adds existing accounts and changes organization membership roles; Risk review records and resolves flags; Audit history lists key actions; Settings edits organization display/contact/timezone values. Admin access is enforced on the API. |
| Listing review | Pending property cards show photo, location, type, and asking price; approve/reject actions are restricted to admins and reviewed listings enter/leave public search accordingly. |
| Access restricted | Explains that the signed-in role lacks permission and provides a safe way back. |
| Page not found | Friendly fallback for unknown routes with navigation back to the marketplace. |
| Mobile captures | Home and workspace overview show responsive layouts at a 390 px viewport; navigation and cards adapt for narrow screens. |

The gallery is generated from the running app rather than design mockups. Demo inventory is illustrative: names, prices, listing content, availability, and stock photos are sample data and do not verify a real address or offer.

## Five delivery phases

### 1. Foundation and marketplace

Set up the app, sign-in, organization switching, basic roles, shared navigation, property data, realistic seed data, listing review, home/search/details, and saved properties. Deliver usable desktop and mobile layouts.

### 2–3. Marketplace workflows and property operations (implemented)

The combined Phase 2–3 slice is available in this repository. Buyers and tenants can save searches, contact a listing team, exchange inbox messages, request viewings, and submit offers or rental applications. Agents can manage leads, pipeline stages, follow-up tasks, and viewing activity. Owners can review portfolios and units, convert an approved application into a lease, track invoices and partial payments, route maintenance to vendors, and view a basic income statement. API access is scoped by account role and organization.

Messaging is stored in the app, lease creation produces rent invoices, and payments can be recorded manually or confirmed through the optional hosted checkout. Optional email notifications and saved-search digests are also available when SMTP is configured. Advanced accounting integrations remain future work.

### 4. Developer, stays, and finance (implemented)

The workspace now supports developer projects, floor/unit inventory, availability-aware reservations, and installment schedules. A short-stay marketplace supports nightly listings, guest requests, date conflict checks, host confirmation, and cancellation. Vendors can progress assigned jobs and submit one invoice per completed job; managers review bills, record payment, and the paid bill flows into property expenses. Finance screens record expenses and owner payouts, and summarize collected rent, expenses, and payouts over a chosen date range. Developer, finance, and vendor users have organization-scoped demo roles.

### 5. Admin and production readiness (implemented foundation)

Organization admins can manage member roles, review and resolve risk flags, maintain basic organization settings, and inspect an audit history. Listing approvals and key workflow/finance changes also write audit entries. Role changes are checked against the live organization membership on every API request, so changed access takes effect without waiting for the old token to expire. API input validation, production security headers, configurable CORS, production Swagger gating, and Docker deployment files are included. This is a deployable foundation; production still needs your own secrets, database, HTTPS/reverse proxy, backups, monitoring, and real Safepay/SMTP credentials.

## Nine-person team

Use one shared backlog and integrate code daily. Each person owns a vertical slice (screens, API, persistence, and permissions) with another developer reviewing it.

| Developer | Primary ownership |
| --- | --- |
| 1 | Product coordination, shared layouts, navigation, design system |
| 2 | Authentication, organizations, users, roles, permissions |
| 3 | Marketplace search, filters, listing cards, saved properties |
| 4 | Property details, images/documents, listing submission and approval |
| 5 | Buyer/tenant screens, applications, offers, viewings |
| 6 | Agent CRM, leads, pipeline, tasks, calendar |
| 7 | Owner/manager, units, leases, rent, statements |
| 8 | Maintenance, vendors, developer inventory, short-stay bookings |
| 9 | Finance, admin, reporting, integration and release support |

Ownership shifts by phase: Developers 1–4 establish the foundation; 5–6 lead the completed Phase 2 workflows; 7–8 lead the completed Phase 3 operations; 8–9 lead Phase 4; all owners contribute to Phase 5. Avoid nine separate apps or competing implementations of the same feature.

## Keep the code and configuration simple

- Start with a **modular monolith**: one Vue client and one NestJS API, organized by business module.
- Use TypeScript end to end, PostgreSQL, and Prisma. Keep the API REST-based and document endpoints with Swagger.
- Keep tenant data scoped by `organizationId`; centralize the scope and permission checks in the API.
- Use a small shared UI kit and reusable page layouts. Do not put all screens in one component.
- Start search with PostgreSQL. Add Redis, queues, WebSockets, map-provider integrations, and external AI only when a shipped workflow needs them.
- Keep environment-specific values in `.env`; commit only `.env.example`. Use one local compose file for the database and API dependencies.
- Prefer one deployable backend over microservices. Split services only when measured load or team ownership requires it.

### Suggested repository layout

```text
apps/
  web/
    src/components/    Shared Vue components
    src/views/         Marketplace and workspace screens
    src/router.ts      Routes and role-aware navigation
  api/
    src/modules/       NestJS feature modules
    prisma/            Schema, migrations, and sample seed
docs/
  screenshots/        Fresh desktop/mobile screen captures
  propsphere-logo.svg  Editable project logo
docker-compose.yml     PostgreSQL and optional app services
.env.example           Safe configuration template
```

### Useful commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start API and web together for local development |
| `npm run build` | Compile the NestJS API and type-check/build the Vue app |
| `npm run db:generate` | Generate Prisma Client from the current schema |
| `npm run db:migrate` | Apply/create local development migrations |
| `npm run db:seed` | Upsert the repeatable demo organization, accounts, inventory, and workflow records |
| `docker compose up -d postgres` | Start only local PostgreSQL |
| `docker compose --profile app up --build -d` | Build and start the containerized API/web stack |

### Local configuration

Copy `.env.example` to `.env`. Keep local credentials in `.env`; it is ignored by Git. Do not put real credentials in a screenshot, issue, README, or commit.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Local API | PostgreSQL connection used by Prisma |
| `DATABASE_URL_DOCKER` | Container API | PostgreSQL connection from the API container to the Compose service |
| `JWT_SECRET` | Production | Random signing secret of at least 32 characters; replace the example value |
| `API_PORT` | No | API listener port; defaults to `3000` |
| `VITE_API_URL` | No | Browser-visible API base URL; defaults to `http://127.0.0.1:3000/api` |
| `WEB_URL`, `CORS_ORIGINS` | Local/API | Reset-link origin and explicit browser origins allowed by the API |
| `SMTP_*` | Optional | Password-reset and workflow email delivery; blank disables email |
| `SAFEPAY_*` | Optional | Safepay hosted checkout and signed webhook configuration |

Values used inside Docker differ from browser-visible local URLs; see `.env.example` and `docker-compose.yml`. A browser must be able to reach `VITE_API_URL`, and that exact browser origin must be present in `CORS_ORIGINS`.

## Implemented Phase 1–3 workflows

These screens use the same saved database records and API permissions, so the main customer-to-operations paths connect end to end:

| Role | Workflow |
| --- | --- |
| Buyer | Search/filter listings → save a property/search → inquire and message the listing team → request/cancel a viewing → submit an offer → negotiate counter-offers → apply to rent → view an approved lease, rent ledger, and eligible maintenance requests |
| Tenant | View leases and invoices → record full or partial rent payments → report maintenance for an active lease → track vendor assignment and ticket status |
| Agent | Receive inquiry leads → move a lead through the pipeline → add notes and tasks → manage assigned viewing requests → route maintenance work |
| Owner/admin | Submit and review listings → manage portfolio and units → review/counter offers and rental applications → create leases and monthly invoices → terminate a lease, release its unit, and cancel future invoices → assign vendors and review the owner statement |

## Phase 4–5 workflows

| Role | Workflow |
| --- | --- |
| Developer | Create a development → add floor/unit inventory → hold an available unit with a customer deposit → confirm or cancel a reservation → schedule and record installments |
| Guest/host | Browse nightly stays → request dates and guest count → reject overlapping dates → host confirms or either side cancels → review stay history |
| Vendor/finance | Complete an assigned work order → submit a job invoice → admin/owner/finance reviews it → record payment once → paid amount posts to that property's expenses |
| Finance/owner | Record costs and commissions → create owner payouts → record completed payouts → review rent income, expenses, and payouts by date range |
| Admin | Add an existing account to the organization → assign its role → review listings and risk flags → maintain organization settings → inspect audit history |

Online rent checkout now supports Safepay hosted checkout in PKR, with signed webhook confirmation updating invoice balances idempotently. Manual payment recording remains available for bank transfer, cash, or cheque. Inbox replies can send email notifications over SMTP, and saved-search alerts can email newly matching published listings once daily. These integrations are optional and remain quiet until their credentials are set.

To enable sandbox checkout, create a Safepay sandbox merchant, add its API key, secret key, and webhook HMAC secret to your local `.env`, and point its webhook endpoint to `https://<public-host>/api/safepay/webhook`. Use sandbox mode first. Safepay requires HMAC-verified webhook events to confirm payment; the browser return alone never marks an invoice as paid. Live Safepay onboarding and credentials are required before real money can be accepted.

For email delivery, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM`. Saved-search digests run daily at 9:00 AM Pakistan time. Inbox notifications are sent when a new message is stored. Electronic lease signatures, application documents, automatic tenant screening, and advanced accounting remain later work.

## Local setup

Requirements: Node.js 20+, npm 10+, and Docker Compose.

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

By default the web app runs at `http://127.0.0.1:5173`; API and Swagger run at `http://127.0.0.1:3000` and `http://127.0.0.1:3000/docs`.

On the screenshot workstation, another local app already occupies ports `3000` and `3001`, so this PropSphere session is running on web `http://127.0.0.1:5174` and API `http://127.0.0.1:3002` (Swagger: `http://127.0.0.1:3002/docs`). Start the same port mapping on this machine with:

```bash
API_PORT=3002 CORS_ORIGINS=http://127.0.0.1:5174 WEB_URL=http://127.0.0.1:5174 npm run dev --workspace @propsphere/api
VITE_API_URL=http://127.0.0.1:3002/api npm run dev --workspace @propsphere/web -- --port 5174
```

Run those two commands in **separate terminals**. The API listens on `3002`; Vite serves the browser app on `5174`. If your ports differ, update all four values together: `API_PORT`, `VITE_API_URL`, `WEB_URL`, and `CORS_ORIGINS`.

### Troubleshooting

| Symptom | Check/fix |
| --- | --- |
| API reports `P1001` / database disconnected | Run `docker compose up -d postgres`, then check `docker compose ps`. Confirm `DATABASE_URL` points to the published local PostgreSQL port (default `5433`). |
| `EADDRINUSE` on API or web startup | Another process owns that port. Choose free ports, then align `API_PORT`, `VITE_API_URL`, `WEB_URL`, and `CORS_ORIGINS` as shown above. |
| Browser shows a CORS error | The page origin must exactly match an entry in `CORS_ORIGINS`, including `localhost` versus `127.0.0.1` and the port. Restart the API after changing `.env`. |
| Prisma schema/client mismatch | Run `npm run db:generate`, then `npm run db:migrate`; restart the API process afterward. |
| Demo account cannot sign in | Run `npm run db:seed` and use an email from the demo account table with password `Phase1Demo!`. |
| Password reset email does not arrive | Set valid `SMTP_*` values. Without an SMTP provider the request remains private and no message can be delivered. |
| Safepay checkout is unavailable | Configure sandbox API, secret, and webhook HMAC credentials. Checkout is optional; manual payment entry remains available to authorized staff. |

### Local verification

Before sharing a change, run `npm run build` and `git diff --check`. With the API and database running, `GET /api/health` should return `{"status":"ok","database":"connected"}`. The repository does not currently define a dedicated automated test script.

### Demo inventory and accounts

`npm run db:seed` idempotently creates **150 sample listings** across Islamabad, Rawalpindi, Lahore, Karachi, Peshawar, Faisalabad, Multan, Quetta, Hyderabad, and Sialkot. Inventory includes sale and rental homes, apartments, villas, offices, shops, commercial units, land, warehouses, and factories. The same seed creates eleven demo accounts, including one sales manager and five salespeople. Use password `Phase1Demo!` for each:

| Name | Email | Role |
| --- | --- | --- |
| PropSphere Admin | `demo@propsphere.local` | Admin |
| Omar Siddiqui | `manager@propsphere.local` | Sales manager |
| Ayesha Khan | `agent@propsphere.local` | Salesperson |
| Hamza Raza | `sales2@propsphere.local` | Salesperson |
| Sana Iqbal | `sales3@propsphere.local` | Salesperson |
| Bilal Shah | `sales4@propsphere.local` | Salesperson |
| Maha Tariq | `sales5@propsphere.local` | Salesperson |
| Hassan Ali | `owner@propsphere.local` | Owner |
| Mariam Noor | `tenant@propsphere.local` | Tenant |
| Zain Ahmed | `buyer@propsphere.local` | Buyer |
| Northside Service Team | `vendor@propsphere.local` | Vendor |

The seeded property records, prices, availability, and locations are **fictional demo data**, not live offers. Listing photos are illustrative stock images from Pexels; they do not depict or verify the named Pakistani addresses. Sample listings are marked in the UI. The image sources include [residential exteriors](https://www.pexels.com/photo/modern-house-exterior-design-8134821/), [apartment interiors](https://www.pexels.com/photo/modern-apartment-interior-design-11296222/), and [industrial warehouses](https://www.pexels.com/photo/exterior-of-warehouse-buildings-8556704/). See the [Pexels license](https://www.pexels.com/license/).

Visitors can create a workspace at `/signup`; the first account becomes that workspace's admin. `/login` supports existing accounts. Password recovery is available from the login screen and sends one-hour reset links when SMTP is configured. Add SMTP values to `.env` to deliver email. Each new signup creates a separate organization and admin membership.

The seed also includes one development project/unit, a furnished short-stay listing, and records for trying the core workflows.

Safepay and SMTP integrations are implemented but require your own merchant/email credentials. The development server still runs as documented above; for a containerized deployment, copy `.env.example` to `.env`, set a strong `JWT_SECRET` and production database URL/secrets, then run `docker compose --profile app up --build -d`. The web app is served at port `8080`, and the API at port `3000`. Put HTTPS termination and persistent production database backups in front of this starter before handling real customers or payments.

## Logo

The source logo is [`docs/propsphere-logo.svg`](docs/propsphere-logo.svg). It is an editable vector mark for the README and product shell.
