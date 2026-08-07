# Sri Lakshmi Transport Company — Transport Management Platform

**Smart Transportation. Seamless Operations.**

A multi-tenant transport management system for SLTC — a Hyderabad-based operator providing
employee, school and outstation transport across Telangana. One public marketing site plus
three role-scoped portals, backed by a REST API on MongoDB Atlas.

| | |
|---|---|
| **Live app** | https://sri-lakshmi-transport-company-weld.vercel.app |
| **Live API** | https://sltc-api.vercel.app/api/health |
| **Status** | Deployed and operational — collecting real data |
| **Tests** | 78 passing |

---

## Table of contents

- [What it does](#what-it-does)
- [Current status](#current-status)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Daily operations](#daily-operations)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Roadmap](#roadmap)

---

## What it does

### Public site (`/`)
Marketing site with the real company profile — services, fleet range (5 to 44 seats),
safety commitments and the client list. Statically prerendered, no API dependency.

### Admin portal (`/admin`) — SLTC staff
Full control of the operation. Every collection has create, edit and delete.

| Screen | What it does |
|---|---|
| Overview | KPIs, billed-vs-collected trend, fleet occupancy, compliance alerts |
| Buses | Fleet register — assignment, insurance/fitness/permit/PUC expiries (imminent ones flagged) |
| Drivers | Licences and contacts; expiring or expired licences called out |
| Routes | Code, name, **distance in km** — this drives every student's fee |
| Organizations | Client register with contacts and GST |
| Students | Roster across all clients, route assignment, rate per km |
| Users | **Sign-in accounts** — how a client gets access to their portal |
| Payments | Invoices, status filter, and one-click **monthly invoice generation** |
| Taxes & EMI | Road tax, loan instalments and statutory renewals; feeds the overview alerts |
| Reports | Billed / collected / outstanding, revenue by route, ageing invoices |

### Organization portal (`/organization`) — schools & corporates
Read-only view of **their own data only**: assigned buses, routes, student roster, invoices
and reports. Writes are rejected server-side, so the UI does not offer them.

### Student / parent portal (`/student`) — families
Route, pickup and drop times, assigned bus and driver, the fee calculation
(`route distance × rate per km`), invoice history, online payment via Razorpay, and
printable receipts.

---

## Current status

### Working end to end

- ✅ **Authentication** — JWT access tokens with rotation, httpOnly refresh cookie, bcrypt hashing
- ✅ **Multi-tenant isolation** — every query scoped to the caller's organization, 20 dedicated tests
- ✅ **Role-based access** — admin / organization / student, enforced server-side
- ✅ **Full CRUD** for 7 collections through the admin portal
- ✅ **User management** — create client logins without touching the database
- ✅ **Billing** — bulk monthly invoice generation, idempotent and previewable
- ✅ **Payments** — Razorpay in test mode, HMAC signature verification, idempotent settlement
- ✅ **Receipts** — printable, browser Print → Save as PDF
- ✅ **Reports** — revenue, route attribution, outstanding invoices
- ✅ **Deployed** — two Vercel projects, live against MongoDB Atlas

### Not built yet

| Area | Blocked on | Phase |
|---|---|---|
| Document uploads (RC, insurance, permits) | file storage | 8 |
| Email / SMS reminders | notification provider + cron | 9 |
| PDF & Excel report export | export pipeline | 10 |
| Audit log, admin MFA | — | 11 |
| CI pipeline, browser end-to-end tests | — | 12 |
| Live Razorpay keys, custom domain, backups | business decision | 14 |

The sidebar marks unbuilt screens **"soon"** and each explains what it will do. Nothing in the
navigation is a dead link.

---

## Tech stack

**Frontend** — Next.js 15.5 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 3.4 ·
TanStack Query 5 · Recharts · Framer Motion · lucide-react

**Backend** — Node 20+ · Express 4.21 · TypeScript (strict) · Mongoose 8.9 · Zod 3.24 ·
jsonwebtoken · bcryptjs · helmet · express-rate-limit · Razorpay 2.9

**Infrastructure** — MongoDB Atlas (M0, AWS `ap-south-1` Mumbai) · Vercel (frontend + serverless API)

**Tooling** — ESLint 9 (flat config, shared between apps) · Prettier · Vitest · Supertest

---

## Getting started

### Prerequisites

- **Node.js 20+** and npm
- A **MongoDB Atlas** cluster with the connection string, and Network Access set to `0.0.0.0/0`
- *(Optional, for payments)* **Razorpay** test-mode API keys

### 1 · Install

```bash
git clone https://github.com/Mounika-Reddy-0802/Sri-Lakshmi-Transport-Company.git
cd Sri-Lakshmi-Transport-Company

npm install              # frontend
cd server && npm install # API
cd ..
```

### 2 · Configure

```bash
cp server/.env.example server/.env    # then fill in the values
cp .env.example .env.local
```

**`server/.env`**

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Atlas string, ending `/sltc` before the `?` |
| `JWT_ACCESS_SECRET` | yes | 32+ chars — `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | yes | 32+ chars, **different** from the access secret |
| `CLIENT_ORIGIN` | yes | Frontend origin, e.g. `http://localhost:3000` |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | no | Payments are disabled without them |
| `PORT` | no | Defaults to `4000` |

**`.env.local`** — `NEXT_PUBLIC_API_URL=http://localhost:4000/api` (note the `/api` suffix).

Config is validated with Zod at boot: a missing or malformed variable exits immediately with a
clear message rather than failing later on a request.

### 3 · Seed

```bash
cd server
npm run seed              # organizations + admin account (safe to re-run)
npm run seed -- --fresh   # also clears buses/drivers/routes/students/invoices
```

The seed creates **only** what is genuinely known: the eight real client organizations and one
administrator. It does not invent vehicles, staff or students — those are entered through the
portal. Re-running never resets a password that has already been changed.

Default sign-in: **`sltc.shyam6666@gmail.com`** / `Sltc@12345` — change it immediately from
**Admin → Users**. Override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### 4 · Run

```bash
cd server && npm run dev    # API      → http://localhost:4000/api
npm run dev                 # frontend → http://localhost:3000
```

Both are needed. The frontend must run on the port named in `CLIENT_ORIGIN` or CORS will block it.

> **If the API fails to start** with an Atlas "IP not whitelisted" error, it retries twice
> automatically — the first `mongodb+srv` DNS lookup after an idle period often exceeds the
> driver timeout. If all three attempts fail, the URI or the access list is genuinely wrong.

---

## Daily operations

Recommended order when setting up a new client, because later steps reference earlier ones:

1. **Organizations** → add the client
2. **Drivers** → licences and expiry dates
3. **Routes** → set the **distance in km**, assign the organization
4. **Buses** → registration, capacity, assign organization / route / driver
5. **Students** → class, pickup point, route, **rate per km**, parent contact
6. **Users** → create the client's login (and parent logins, linked to a student record)
7. **Payments → Generate monthly invoices** → Preview, then Generate

Monthly billing is one action: pick the period, preview how many invoices would be raised and
their total, then commit. Re-running skips anyone already invoiced for that period.

---

## Project structure

```
Sri-Lakshmi-Transport-Company/
├── app/                          Next.js App Router — 25 routes
│   ├── page.tsx                  public landing page
│   ├── login/                    sign-in
│   ├── admin/                    11 screens
│   ├── organization/             7 screens
│   └── student/                  5 screens incl. printable receipt
├── components/
│   ├── landing/                  marketing sections
│   ├── dashboard/                Shell, DataTable, FormModal, ResourcePage, Charts, Checkout
│   └── ui/                       buttons, states, theme toggle
├── lib/
│   ├── api.ts                    typed client — token refresh, error envelope
│   ├── auth.tsx                  session context + route guards
│   ├── resources.ts              React Query hooks over the resource API
│   ├── nav.ts                    per-role sidebar
│   └── content.ts                company profile copy (landing page only)
├── server/
│   ├── api/index.ts              Vercel serverless entry
│   └── src/
│       ├── app.ts                Express app
│       ├── config.ts             Zod-validated environment
│       ├── db.ts                 cached Mongoose connection
│       ├── models/               8 Mongoose schemas
│       ├── middleware/           auth, RBAC, tenant scoping, validation, errors
│       ├── routes/               auth, users, resources, dashboard, reports, billing
│       ├── payments/             Razorpay client, signature, settlement
│       └── seed.ts
└── documentation/
```

Two independent apps in one repository, each with its own `package.json`, `tsconfig` and
dependencies, sharing one ESLint rule set.

---

## API reference

Base URL `/api`. All responses use one error envelope:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [] } }
```

Lists return `{ data, page, limit, total, pages }` and accept `?page`, `?limit`, `?q`.

### Auth
| Method | Endpoint | Access |
|---|---|---|
| `POST` | `/auth/login` | public |
| `POST` | `/auth/refresh` | refresh cookie |
| `POST` | `/auth/logout` | any |
| `GET` | `/auth/me` | any |

### Resources — `organizations` · `buses` · `drivers` · `routes` · `students` · `invoices` · `reminders`
| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/{resource}` | any (tenant-scoped) |
| `GET` | `/{resource}/:id` | any (tenant-scoped) |
| `POST` `PATCH` `DELETE` | `/{resource}` · `/{resource}/:id` | **admin** |

### Users, billing, payments, reporting
| Method | Endpoint | Access |
|---|---|---|
| `GET` `POST` `PATCH` `DELETE` | `/users` · `/users/:id` | **admin** |
| `POST` | `/invoices/generate` | **admin** |
| `GET` | `/invoices/:id/receipt` | any (tenant-scoped, paid only) |
| `GET` | `/students/:id` · `/students/:id/invoices` | any (tenant-scoped) |
| `GET` | `/dashboard/admin` | **admin** |
| `GET` | `/dashboard/organization/:id` | admin, or that org |
| `GET` | `/reports/revenue` · `/reports/routes` · `/reports/pending` | admin, org |
| `GET` | `/payments/config` | any |
| `POST` | `/payments/order` · `/payments/verify` | any (own invoice) |
| `GET` | `/health` | public |

---

## Data model

Eight collections. Every tenant-owned document carries `organizationId`, which is what tenant
scoping filters on.

| Collection | Key fields |
|---|---|
| `users` | email, passwordHash, role, organizationId, studentId, tokenVersion |
| `organizations` | name, type, location, contacts, GST |
| `buses` | regNumber, type, capacity, status, insurance/permit/fitness/PUC expiries |
| `drivers` | name, phone, licenceNumber, licenceExpiry |
| `routes` | code, name, **distanceKm**, pickupPoints, bus, driver |
| `students` | studentCode, class, pickupPoint, route, **ratePerKm**, parent |
| `invoices` | invoiceNumber, period, amount, status, dueDate, Razorpay ids |
| `reminders` | type, dueDate, amount, status |

**Monthly fee = `route.distanceKm × student.ratePerKm`** — computed, never stored twice.

Unique indexes on email, registration number, licence number, route code, student code, and
`(studentId, period)` — the last one is what makes invoice generation safe to re-run.

---

## Security

- **Passwords** — bcrypt, cost 12. `passwordHash` has `select: false` and never leaves the server.
- **Tokens** — short-lived access token held **in memory only** (never `localStorage`, so XSS
  cannot read it); refresh token in an httpOnly cookie, rotated on every use with a unique `jti`.
- **Revocation** — logout and password changes bump `tokenVersion`, invalidating every
  outstanding refresh token on every device.
- **No user enumeration** — unknown email and wrong password return an identical response, and
  bcrypt runs on both paths so the timing matches.
- **Tenant scoping** — written once in `scopeToTenant()`; the id is ANDed into the query, so a
  document outside your tenant returns **404**, indistinguishable from one that does not exist.
  A forged `organizationId` parameter is overridden, not trusted.
- **Payments** — only the HMAC-SHA256 signature decides that an invoice is paid; the browser
  callback is never trusted. Orders are bound to invoices to prevent replay.
- **Boundary validation** — every body, param and query parsed by Zod before a handler sees it.
- **Headers and limits** — helmet, CORS locked to `CLIENT_ORIGIN`, rate limiting with a tighter
  ceiling on `/auth` and `/payments`.

---

## Testing

```bash
cd server
npm test          # 78 tests
npm run typecheck
npm run lint
```

| Suite | Tests | Covers |
|---|---|---|
| `tenant.test.ts` | 20 | **Cross-tenant isolation** — list, by id, nested, dashboard, report, forged params |
| `middleware/auth.test.ts` | 17 | Scoping helpers and role guards |
| `users.test.ts` | 16 | Account creation, scope invariants, lock-out guards |
| `auth.test.ts` | 14 | Login, refresh rotation, logout revocation, enumeration |
| `payments.test.ts` | 11 | Signature verification, tampering, idempotent settlement |

Tests run against a real Atlas database and build their own fixtures, so they never depend on
seed data. Files run sequentially against the shared database.

---

## Deployment

Two Vercel projects from this one repository:

| Project | Root directory | Preset | Environment |
|---|---|---|---|
| `sltc-api` | `server` | Other | `MONGODB_URI`, `JWT_*`, `CLIENT_ORIGIN`, `RAZORPAY_*` |
| frontend | `./` | Next.js | `NEXT_PUBLIC_API_URL` |

Deploy the API first — the frontend inlines `NEXT_PUBLIC_API_URL` at build time. Then set
`CLIENT_ORIGIN` to the frontend URL and **redeploy the API**; environment variables are only
read at boot.

Atlas Network Access must allow `0.0.0.0/0`, because serverless functions have no fixed IP.

---

## Roadmap

| Phase | Scope | Status |
|---|---|---|
| 0–4 | Monorepo, API, auth, RBAC, CRUD, dashboards | ✅ |
| 5 | Portals on live data | ✅ |
| 6 | Razorpay payments (test mode) | ✅ |
| 7 | Vercel deployment | ✅ |
| — | User management, invoice generation, receipts | ✅ |
| 8 | Document storage | ⬜ |
| 9 | Notification and reminder engine | ⬜ |
| 10 | PDF / Excel export | ⬜ |
| 11 | Audit log, MFA | ⬜ |
| 12 | CI, browser end-to-end tests | ⬜ |
| 13 | Monitoring, accessibility, performance | ⬜ |
| 14 | Docker, live payments, custom domain | ⬜ |

Full phase detail in [`documentation/SLTC-BUILD-PLAN.md`](documentation/SLTC-BUILD-PLAN.md).

---

## Documentation

- [Platform documentation](documentation/SLTC-Platform-Documentation.md) — architecture, data model, deployment
- [Build plan](documentation/SLTC-BUILD-PLAN.md) — phased delivery plan
- [Git rules](GIT_RULES.md) — commit and push conventions

---

## Contact

**Sri Lakshmi Transport Company** · Hyderabad & Telangana
📞 +91 81793 14684 · +91 70757 14684 · ✉️ sltc.shyam6666@gmail.com

---

## License

MIT
