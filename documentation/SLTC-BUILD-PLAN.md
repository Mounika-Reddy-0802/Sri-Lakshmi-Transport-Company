# SLTC Platform — Build Plan for Claude Code

**Goal:** take the project from its current state (frontend built, mock data) to a working,
integrated MERN app. **Today's target: Phases 0–7 (~60–70%).** The plan continues to 100%.

**Stack:** MongoDB Atlas + Mongoose · Express (TypeScript) REST API · Next.js/React frontend
· Razorpay (REST) · deploy on Vercel. Docker is deferred to the end.

---

## How to use this with Claude Code

1. Put this file in the repo root as `BUILD_PLAN.md`.
2. Do **one phase per session**. For each, prompt Claude Code:
   > "Read `BUILD_PLAN.md`. Follow the **Global Rules**. Do **Phase N** only. When the
   > **Acceptance criteria** pass, run the checks, commit, and stop."
3. **Verify the acceptance criteria yourself** before moving on. Don't let a phase "spill"
   into the next — each phase ends at a working, committed checkpoint.
4. Commit after every phase (conventional commits, e.g. `feat(api): add auth`).

**You (human) must do these first — Claude Code cannot (≈15 min):**
- Create a free **MongoDB Atlas** cluster; copy the `MONGODB_URI`; set Network Access to `0.0.0.0/0`.
- Create a **Razorpay** account; copy **test** `KEY_ID` + `KEY_SECRET`.
- Create a **Git repo** (monorepo: existing Next.js app at root, new API in `/server`).
- Create a free **Vercel** account linked to Git.
Have these five values ready: `MONGODB_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, a
random `JWT_SECRET`, and (later) your deployed URLs.

---

## Global Rules (apply to every phase — this is the "don't compromise quality" contract)

- **TypeScript strict** everywhere (`strict: true`, no implicit `any`, no `@ts-ignore` without a reason).
- **Validate every input at the boundary with Zod** (request bodies, params, query). Reject invalid input with 400.
- **One error envelope** for the API: `{ error: { code, message, details? } }`. Central Express error-handler; no raw stack traces to clients.
- **Multi-tenant scoping on every query.** Non-admin requests are always filtered by the caller's `organizationId`. A student only sees their own records. Write a helper and use it — never query a collection unscoped in a request handler.
- **Security:** hash passwords with bcrypt; JWT access (short-lived) + refresh (httpOnly cookie or secure store); `helmet`, `cors` locked to the frontend origin, and rate-limiting on `/auth` and `/payments`. **Never** log secrets or put them in code — only env vars.
- **Payments and auth get tests.** At minimum: signature-verify unit test, an auth login/refresh integration test, and a tenant-isolation test (org A cannot read org B).
- **No mock data left in shipped paths.** When a screen goes live, its data comes from the API.
- **Accessibility & performance are not optional:** semantic HTML, labelled inputs, visible focus, and keep Lighthouse (perf/a11y/best-practices/SEO) ≥ 90 on the landing page.
- **Stop at green.** If acceptance criteria aren't met, fix within the phase; don't proceed. Ask before any destructive change (deleting files, rewriting the frontend).

---

# TODAY — Phases 0–7 (target ~60–70%)

Natural stopping points if you run out of time: after **Phase 5** the app works end-to-end
on live data (~55–60%); after **Phase 6** payments work (~65–70%).

## Phase 0 — Monorepo, tooling & quality gates  (~30 min)
**Goal:** clean workspace with the quality gates wired so every later phase inherits them.
**Tasks**
1. Restructure to a monorepo: keep the Next.js app at repo root; create `/server` for the API.
2. Add root `.editorconfig`, Prettier, and a shared ESLint config (typescript-eslint). Add `.gitignore` (node_modules, .next, .env*, dist).
3. In `/server`, init a TypeScript Express project: `tsconfig.json` (strict), `zod`, `express`, `cors`, `helmet`, `express-rate-limit`, `bcryptjs`, `jsonwebtoken`, `mongoose`, `razorpay`, `dotenv`, dev: `tsx`, `vitest`, `supertest`.
4. Add npm scripts: `dev` (tsx watch), `build` (tsc), `lint`, `test`, `seed`.
5. Add `.env.example` for both apps listing every variable (no values).

**Acceptance criteria**
- `npm run lint` passes in both apps. `/server` `npm run build` compiles with zero TS errors.
- `.env.example` exists for frontend and server; no secrets committed.

**Claude Code prompt:** *"Do Phase 0 of BUILD_PLAN.md. Set up the monorepo and the /server TypeScript Express skeleton with the listed tooling and quality gates. Follow Global Rules. Stop when acceptance criteria pass."*

## Phase 1 — API foundation (Vercel-ready)  (~45 min)
**Goal:** a running Express API with DB connection, config, validation and error handling.
**Tasks**
1. `server/api/index.ts` — export the Express `app` (do **not** `app.listen` for Vercel). Local dev entry `server/src/local.ts` can listen on a port.
2. `server/vercel.json` — `{ "rewrites": [{ "source": "/(.*)", "destination": "/api" }] }`.
3. `server/src/db.ts` — **cached** Mongoose connection (reuse across serverless invocations).
4. `server/src/config.ts` — read + validate env with Zod at startup (fail fast if missing).
5. Middleware: `helmet`, `cors` (origin = `CLIENT_ORIGIN`), `express.json`, request logger, rate-limiter, central error handler, `GET /api/health`.
6. A `zodValidate(schema)` middleware and the `{ error: {...} }` envelope helper.

**Acceptance criteria**
- `GET /api/health` returns `{ ok: true }` and connects to Atlas.
- Invalid JSON / missing env fails cleanly with the standard error envelope (not a stack trace).

**Claude Code prompt:** *"Do Phase 1: API foundation, cached Mongo connection, config validation, security middleware, error envelope, health check. Follow Global Rules. Stop at acceptance criteria."*

## Phase 2 — Data models + seed  (~45 min)
**Goal:** all Mongoose models and a seed script loaded with the real SLTC data.
**Tasks**
1. Models: `User, Organization, Bus, Driver, Route, Student, Invoice, Reminder` (fields per Section 5 of the platform doc; add timestamps, indexes, and `organizationId` refs).
2. `server/src/seed.ts` — idempotent seed: the 8 real clients as organizations, sample buses/drivers/routes/students, a few invoices, and one user per role (admin/org/student) with hashed passwords. Pull the marketing content already in the frontend's `lib/mock-data.ts` so data is consistent.
3. `npm run seed` wipes + reseeds a dev DB safely (guard against running on prod).

**Acceptance criteria**
- `npm run seed` populates Atlas; counts logged. Re-running is safe (idempotent).
- Every model has appropriate indexes (e.g. `Invoice.studentId`, `Student.organizationId`).

**Claude Code prompt:** *"Do Phase 2: Mongoose models for all entities + an idempotent seed script using the real SLTC data. Follow Global Rules. Stop at acceptance criteria."*

## Phase 3 — Auth + RBAC  (~1 hr)
**Goal:** real authentication and role-based access, with tenant scoping helpers.
**Tasks**
1. `POST /auth/login` (email+password → access + refresh tokens), `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
2. bcrypt hashing; JWT access (~15 min) + refresh (~7 days, httpOnly secure cookie).
3. `requireAuth` and `requireRole(...roles)` middleware; a `scopeToTenant(req, query)` helper that injects `organizationId` for non-admins.
4. Rate-limit `/auth`. Lock down error messages (no user-enumeration).
5. **Tests:** login success/failure, refresh rotation, and a role/tenant guard test.

**Acceptance criteria**
- Seeded users can log in for all three roles; wrong password → 401 (generic message).
- A protected route rejects missing/expired tokens; org user cannot access admin-only routes.
- Auth tests pass.

**Claude Code prompt:** *"Do Phase 3: JWT auth (login/refresh/logout/me), bcrypt, RBAC + tenant-scoping middleware, rate-limiting, and the auth/tenant tests. Follow Global Rules. Stop at acceptance criteria."*

## Phase 4 — Core REST resources  (~1.5–2 hr)
**Goal:** the CRUD + read APIs the dashboards need, all validated, scoped and paginated.
**Tasks**
1. Routers: `buses, drivers, routes, organizations, students, invoices`. Full CRUD for admin; scoped read for org/student.
2. Aggregates for dashboards: `GET /dashboard/admin`, `GET /dashboard/organization/:id`, `GET /students/:id` (profile + route + bus + driver), `GET /students/:id/invoices`.
3. `GET /reports/revenue`, `/reports/routes`, `/reports/pending` (read-only aggregations).
4. Zod schemas per endpoint; pagination (`?page&limit`); consistent list envelope `{ data, page, total }`.
5. **Test:** tenant isolation (org A cannot read org B's students/invoices).

**Acceptance criteria**
- Each endpoint validates input, enforces role + tenant scope, and paginates lists.
- Dashboard aggregate endpoints return the shapes the frontend expects (align with `lib/mock-data.ts`).
- Tenant-isolation test passes.

**Claude Code prompt:** *"Do Phase 4: CRUD + scoped read APIs for all resources, dashboard aggregate + report endpoints, Zod validation, pagination, and a tenant-isolation test. Follow Global Rules. Stop at acceptance criteria."*

## Phase 5 — Frontend integration (kill the mock data)  (~2 hr)
**Goal:** the three portals run on live API data behind real auth.
**Tasks**
1. Add **React Query** + a typed `apiClient` (base URL from `NEXT_PUBLIC_API_URL`, attaches access token, auto-refreshes on 401).
2. **Auth context**: login form on `/login` calls the API, stores tokens, redirects by role (admin → `/admin`, org → `/organization`, student → `/student`). Add route guards (redirect unauthenticated users to `/login`).
3. Replace mock reads in `/admin`, `/organization`, `/student` with React Query hooks hitting the Phase 4 endpoints. Keep the exact same components/UI — only the data source changes.
4. Add loading skeletons and error states (don't leave blank screens).
5. Keep `lib/mock-data.ts` **only** for the public landing page content (that can stay static) — or move it to a `content.ts`. No portal reads mock data.

**Acceptance criteria**
- Logging in as each seeded role lands on the right dashboard and shows **live** DB data.
- 401s transparently refresh; logout clears tokens and protects routes.
- No portal screen reads mock data; loading + error states exist.

**Claude Code prompt:** *"Do Phase 5: React Query api client, auth context + role-based redirect + route guards, and replace all portal mock-data reads with live API calls. Keep the UI identical. Follow Global Rules. Stop at acceptance criteria."*

## Phase 6 — Payments (Razorpay, test mode)  (~1 hr)
**Goal:** a real (test) payment updates a real invoice.
**Tasks**
1. API: `POST /payments/order` (creates Razorpay order for an invoice), `POST /payments/verify` (HMAC-SHA256 signature check → mark invoice `paid`, store `paymentId`, generate a receipt record).
2. Frontend: wire the existing student checkout modal — call `/payments/order`, open Razorpay Checkout with `orderId`+`keyId`, then call `/payments/verify`; show success and refresh invoice list.
3. Handle failure/cancel paths; idempotent verify (don't double-mark).
4. **Test:** signature verification (valid + tampered), and that a paid invoice flips status once.

**Acceptance criteria**
- A test payment moves an invoice from `pending` → `paid` and shows a receipt; tampered signature is rejected.
- Payment tests pass.

**Claude Code prompt:** *"Do Phase 6: Razorpay order + verify endpoints (with signature check and idempotency) and wire the student checkout to them. Add the payment tests. Follow Global Rules. Stop at acceptance criteria."*

## Phase 7 — Deploy to Vercel + smoke test  (~45 min)
**Goal:** both apps live and talking to each other.
**Tasks**
1. Deploy the **API** project (root dir `/server`) with env vars (`MONGODB_URI`, `RAZORPAY_*`, `JWT_SECRET`, `CLIENT_ORIGIN`). Verify `/api/health`.
2. Deploy the **frontend** project (root dir `/`) with `NEXT_PUBLIC_API_URL` = the API URL.
3. Set `CLIENT_ORIGIN` to the deployed frontend URL; confirm CORS.
4. Smoke test the full flow live: log in (each role) → view dashboards → run a test payment.

**Acceptance criteria**
- Public URL works; all three logins work against the live API; a live test payment succeeds.
- No CORS or mixed-content errors in the console.

**Claude Code prompt:** *"Do Phase 7: prepare both Vercel projects, document the exact env vars, and give me a smoke-test checklist. (I'll click Deploy.) Follow Global Rules."*

> **End of today.** If Phases 0–7 are green you're at roughly **65–70%**: a deployed,
> authenticated, multi-tenant app on live data with working test payments.

---

# TO 100% — Phases 8–14 (following days)

## Phase 8 — Documents & file storage  (~half day)
Upload/store vehicle, driver and org documents (RC, insurance, permit, fitness, PUC,
licence, agreements). Use **Vercel Blob** for storage (same Vercel account — no extra vendor) via signed upload URLs.
Add versioning + expiry dates. **Done when:** files upload/download, expiry is stored, and
files are tenant-scoped and access-controlled.

## Phase 9 — Notifications + reminder engine  (~half–full day)
Email/SMS/WhatsApp via providers (e.g. Resend/SES, Twilio/MSG91). A scheduled job
(**Vercel Cron**) scans for due items (fees, EMI, tax, insurance, licence, permit, fitness)
and sends reminders; log every send. **Done when:** a due reminder fires on schedule and is
recorded, with templates per channel.

## Phase 10 — Reports & analytics export  (~half day)
Financial (monthly/org/route revenue, pending) and operational (utilisation, assignments,
route performance) reports with **PDF + Excel export**. **Done when:** each report renders
from live data and exports correctly.

## Phase 11 — Audit logs, activity tracking, optional MFA  (~half day)
Record who changed what (immutable audit collection); surface an activity feed to admins;
optional TOTP MFA for admin logins. **Done when:** mutations are audited and viewable; MFA
works if enabled.

## Phase 12 — Testing & CI  (~half–full day)
Unit (Vitest) + integration (supertest) for the API; component/e2e (Playwright) for the key
frontend flows (login, dashboard load, payment). **GitHub Actions** running lint + typecheck
+ tests on every PR. **Done when:** CI is green and critical paths are covered.

## Phase 13 — Hardening & polish  (~half day)
Rate-limit tuning, input sanitisation, error monitoring (Sentry), security headers review,
accessibility pass (WCAG AA), Lighthouse ≥ 95 on landing, SEO metadata, optional PWA.
**Done when:** monitoring is live and the audits pass.

## Phase 14 — Docker + launch  (~half day)
`Dockerfile` for the API and a `docker-compose` (API + Mongo) for local parity. Then the
launch checklist: switch Razorpay to **live** keys, custom domain + DNS, DB backups,
env review, final smoke test. **Done when:** the container runs locally and the production
launch checklist is complete.

---

## Progress map

| Milestone | Cumulative |
|-----------|-----------|
| Frontend (already done) | ~40% |
| + Phases 0–4 (backend + auth + APIs) | ~55% |
| + Phase 5 (frontend on live data) | ~60% |
| + Phase 6 (payments) | ~68% |
| + Phase 7 (deployed) | **~70% (today's target)** |
| + Phases 8–10 (docs, notifications, reports) | ~85% |
| + Phases 11–13 (audit, tests, hardening) | ~95% |
| + Phase 14 (Docker + launch) | **100%** |

---

## Reality check
- 60–70% in one day is achievable **only** with focused execution and the account setups
  done first. If a phase runs long, **stop at the last green checkpoint** rather than leaving
  something half-wired — a working 60% beats a broken 75%.
- Auth (Phase 3) and payments (Phase 6) are the two places **not** to rush; their tests are
  the guardrail. Everything else can move fast.
- Build **vertical slices**: after Phase 5 you have a real, demoable product. That's the
  point to show stakeholders even if the rest waits.
