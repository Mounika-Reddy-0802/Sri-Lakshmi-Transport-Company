# Sri Lakshmi Transport Company (SLTC) — Platform Documentation

**Document version:** 2.0 (MERN + Vercel)
**Last updated:** August 2026
**Status:** Frontend built (mock data). Backend (MongoDB + Express) to be added per this doc.

---

## 1. What this project is

A web application for **Sri Lakshmi Transport Company (SLTC)** — a Hyderabad/Telangana
transport operator serving pharma companies, corporates, schools and universities.

It has two parts:

1. **A public marketing site** — an institutional, trust-first landing page aimed at
   school administrators, HR/admin and procurement teams. Its job is to look credible and
   make it easy to request a quote.
2. **Three role-based portals** — Super Admin (SLTC staff), Organization (a client), and
   Student/Parent — each with its own dashboard.

> **Current scope.** The **frontend is built and runnable** using **mock data**. The
> **backend described here (MongoDB + Express REST API) is not built yet** — this document
> is the plan and the deployment guide for it. The stack has been kept deliberately simple:
> **MERN + REST APIs**, deployed on **Vercel** (Docker is a later step).

---

## 2. Technology stack (MERN)

We are keeping this to a simple, well-understood MERN stack plus REST APIs where an
external service is needed (payments, notifications).

| Layer | Technology | Notes |
|-------|-----------|-------|
| **M — Database** | **MongoDB** (via **MongoDB Atlas**, free tier) with **Mongoose** ODM | Cloud-hosted, no server to manage |
| **E — API** | **Express** (Node) REST API | Auth, buses, routes, students, invoices, payments |
| **R — Frontend** | **React**, delivered via **Next.js 15** (App Router) | Already built; deploys natively on Vercel |
| **N — Runtime** | **Node.js 20/22** | Runs both the API and the Next.js build |
| Styling | Tailwind CSS 3.4 | Custom navy/blue/green/amber palette |
| Charts / animation / icons | Recharts, Framer Motion, lucide-react | Frontend only |
| **Payments (REST)** | **Razorpay** REST API + Node SDK | Called from the Express API |
| Notifications (REST, later) | Email / SMS / WhatsApp providers | Called from the Express API |

**A note on "React vs Next.js":** the frontend I built uses **Next.js**, which is a React
framework — so it is the "R" in MERN and is the best possible fit for Vercel (zero-config
deploys). You do **not** need to convert it to plain React. If you ever specifically want
vanilla React (e.g. Vite + React Router), that is a separate rebuild; for now, keeping
Next.js is simpler and loses nothing.

**What we intentionally dropped** to keep it simple: NestJS, PostgreSQL/Prisma, and (for
now) Docker. Docker can be added later for local parity or non-Vercel hosting.

---

## 3. Architecture

```
                         +-------------------------------+
                         |   Browser (schools, staff,    |
                         |   parents, SLTC admins)       |
                         +---------------+---------------+
                                         |  HTTPS
             +---------------------------+---------------------------+
             |                                                       |
   +---------v----------+                             +--------------v-------------+
   | FRONTEND (Vercel)  |     REST (JSON) over HTTPS  |   API (Vercel serverless)  |
   | Next.js / React    | -------------------------->  |   Express + Node           |
   | sltc.vercel.app    | <--------------------------  |   sltc-api.vercel.app       |
   +--------------------+                             +-------+-------------+-------+
                                                              |             |
                                                    +---------v--+    +-----v---------+
                                                    | MongoDB     |   |  Razorpay      |
                                                    | Atlas (DB)  |   |  (REST API)    |
                                                    +-------------+   +----------------+
```

- The **frontend** (this repo) is deployed as its own Vercel project.
- The **Express API** is deployed as a **second Vercel project** (Vercel turns the exported
  Express app into serverless functions).
- The API talks to **MongoDB Atlas** for data and **Razorpay** for payments.
- The frontend calls the API over REST using a single base URL from an env variable.

> Alternative host for the API: if you prefer an always-on server (useful for webhooks and
> long tasks), the same Express app runs unchanged on **Render** or **Railway**. Vercel
> serverless is the simplest for now; nothing in the code needs to change to switch later.

---

## 4. REST API design

Base URL example: `https://sltc-api.vercel.app/api`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Authenticate; returns a JWT |
| POST | `/auth/refresh` | Refresh the access token |
| GET | `/buses`, `/buses/:id` | List / read vehicles |
| POST/PATCH/DELETE | `/buses/...` | Manage vehicles (admin) |
| GET/POST | `/drivers`, `/routes`, `/organizations`, `/students` | Core resources |
| GET | `/organizations/:id/students` | Org-scoped data |
| GET | `/students/:id/invoices` | A student's invoices |
| POST | `/payments/order` | Create a Razorpay order -> returns `orderId` |
| POST | `/payments/verify` | Verify signature, mark invoice paid, issue receipt |
| POST | `/payments/webhook` | (Optional) async payment confirmation from Razorpay |
| GET | `/reports/...` | Financial / operational reports |

Access is role-based (Super Admin / Organization / Student) using the JWT claims. Each
organization only ever receives its own data (multi-tenant scoping in every query).

---

## 5. Data model (MongoDB collections)

Mongoose schemas replace the earlier Prisma/PostgreSQL tables. Core collections:

- **users** — email, passwordHash, role (`admin` | `org` | `student`), organizationId
- **organizations** — name, type, contact, GST, documents[]
- **buses** — regNumber, type, capacity, insurance/permit/fitness/puc (with expiry dates),
  organizationId, routeId, driverId, status
- **drivers** — name, phone, licenceNumber, licenceExpiry, aadhaar, documents[]
- **routes** — name, code, pickupPoints[], distanceKm, organizationId, busId, driverId
- **students** — name, class, parent, pickupPoint, routeId, organizationId, ratePerKm
- **invoices** — studentId, period, amount, status (`paid` | `pending` | `overdue`),
  razorpayOrderId, razorpayPaymentId, receiptUrl
- **reminders** — type (EMI / tax / insurance / licence / fitness), dueDate, amount, status

Monthly fee is computed as **distance x rate per km** (already implemented in the UI).

---

## 6. Backend scaffold (copy-paste starter)

Create a **separate** project/folder, e.g. `sltc-api/`, structured for Vercel:

```
sltc-api/
  api/
    index.js          # Express app exported for Vercel serverless
  src/
    db.js             # cached Mongoose connection
    models/           # Mongoose schemas
    routes/           # auth, buses, students, payments, ...
  package.json        # "engines": { "node": "22.x" }
  vercel.json         # routes all requests to api/index.js
  .env                # local only (never commit)
```

**`api/index.js`**

```js
const express = require("express");
const cors = require("cors");
const { connectDB } = require("../src/db");

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
app.use(express.json());

// Ensure the DB connection is ready (reused across invocations)
app.use(async (_req, _res, next) => { await connectDB(); next(); });

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", require("../src/routes/auth"));
app.use("/api/payments", require("../src/routes/payments"));
// ...mount the rest of your routers

// IMPORTANT: export the app (do NOT app.listen on Vercel)
module.exports = app;
```

**`src/db.js`** — cache the connection so serverless functions don't reconnect every call:

```js
const mongoose = require("mongoose");
let cached = global._mongo;
if (!cached) cached = global._mongo = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI, { dbName: "sltc" })
      .then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
module.exports = { connectDB };
```

**`src/routes/payments.js`** — Razorpay via REST:

```js
const router = require("express").Router();
const crypto = require("crypto");
const Razorpay = require("razorpay");

const rzp = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 1) Create an order
router.post("/order", async (req, res) => {
  const { amount } = req.body;                 // amount in rupees
  const order = await rzp.orders.create({
    amount: Math.round(amount * 100),          // Razorpay uses paise
    currency: "INR",
  });
  res.json({ orderId: order.id, keyId: process.env.RAZORPAY_KEY_ID });
});

// 2) Verify the signature after checkout
router.post("/verify", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");
  if (expected !== razorpay_signature) return res.status(400).json({ ok: false });
  // TODO: mark the invoice paid + generate receipt
  res.json({ ok: true });
});

module.exports = router;
```

**`vercel.json`** — send every request into the Express app:

```json
{
  "version": 2,
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

**`package.json`** (key bits)

```json
{
  "main": "api/index.js",
  "engines": { "node": "22.x" },
  "dependencies": {
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "mongoose": "^8.7.0",
    "razorpay": "^2.9.4",
    "jsonwebtoken": "^9.0.2"
  }
}
```

Frontend payment flow (student portal): call `POST /payments/order` -> open Razorpay
Checkout with the returned `orderId` + `keyId` -> on success call `POST /payments/verify`.
The current UI already has the checkout modal; it just needs these two fetch calls wired in
place of the demo button.

---

## 7. Deployment on Vercel

You will create **two Vercel projects**: one for the frontend, one for the API. Both deploy
straight from Git, and both redeploy automatically on every push.

### 7.1 Prerequisites
- A **GitHub/GitLab/Bitbucket** account with two repos (or one repo, two folders).
- A free **Vercel** account (sign in with Git).
- A free **MongoDB Atlas** cluster -> get the connection string (`MONGODB_URI`).
- A **Razorpay** account -> get `KEY_ID` and `KEY_SECRET` (test keys first).

### 7.2 Deploy the frontend (this Next.js app)
1. Push this project to a Git repo.
2. In Vercel: **Add New -> Project -> Import** the repo.
3. Framework preset is auto-detected as **Next.js** — leave build settings default
   (`next build`; no output-dir override needed).
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL = https://sltc-api.vercel.app/api` (your API URL from step 7.3;
     you can set a placeholder now and update it later).
5. **Deploy.** You get a URL like `https://sltc.vercel.app`.

> When wiring the UI to the API, read the base URL from `process.env.NEXT_PUBLIC_API_URL`
> in your fetch calls. Anything the browser must read has to be prefixed `NEXT_PUBLIC_`.

### 7.3 Deploy the Express API
1. Push the `sltc-api/` project (Section 6) to its own Git repo.
2. In Vercel: **Add New -> Project -> Import** that repo.
3. Framework preset: **Other**. The `vercel.json` + `api/index.js` handle the rest.
4. Add environment variables (Project -> Settings -> Environment Variables):
   - `MONGODB_URI` = your Atlas connection string
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
   - `JWT_SECRET` = a long random string
   - `CLIENT_ORIGIN` = `https://sltc.vercel.app` (for CORS)
5. **Deploy.** You get a URL like `https://sltc-api.vercel.app`; test `.../api/health`.
6. Go back to the **frontend** project, set `NEXT_PUBLIC_API_URL` to this URL, and redeploy.

### 7.4 MongoDB Atlas network access
In Atlas -> **Network Access**, allow connections from anywhere (`0.0.0.0/0`) so Vercel's
serverless functions can connect (their IPs aren't fixed on the free tier). Use a strong DB
user password and keep the URI only in Vercel env vars.

### 7.5 Custom domain (optional)
In the frontend Vercel project -> **Settings -> Domains**, add e.g. `www.sltc.co.in` and point
your DNS as Vercel instructs.

### 7.6 Razorpay webhook (optional but recommended)
In the Razorpay dashboard, add a webhook pointing to
`https://sltc-api.vercel.app/api/payments/webhook` for reliable, asynchronous payment
confirmation (in addition to the client-side verify call).

---

## 8. Environment variables summary

| Where | Variable | Example / notes |
|-------|----------|-----------------|
| Frontend | `NEXT_PUBLIC_API_URL` | `https://sltc-api.vercel.app/api` |
| API | `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net` |
| API | `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | test keys first, then live |
| API | `JWT_SECRET` | long random string |
| API | `CLIENT_ORIGIN` | `https://sltc.vercel.app` (CORS) |

Never commit real values — set them in each project's Vercel **Environment Variables**.

---

## 9. Local development

```bash
# Frontend (this repo)
npm install
npm run dev            # http://localhost:3000

# API (sltc-api repo)
npm install
vercel dev             # runs the serverless API locally
```

For local, put values in a `.env` file (git-ignored). During development, point the
frontend's `NEXT_PUBLIC_API_URL` at the local API URL.

---

## 10. Build status — what's done vs. next

### Done
- Full institutional landing page with real SLTC content and branding
- Three responsive, role-based dashboards (mock data)
- Light/dark mode, distance-based fee logic, demo payment modal
- Clean Next.js production build; deploys to Vercel as-is

### Next (in order)
1. **MongoDB Atlas** cluster + Mongoose models (Section 5)
2. **Express REST API** on Vercel (Sections 6–7)
3. **Auth**: JWT login/refresh + role checks; org-scoped queries
4. **Razorpay**: wire the student checkout to `/payments/order` + `/payments/verify`
5. Replace `lib/mock-data.ts` reads with `fetch` calls to `NEXT_PUBLIC_API_URL`
6. Notifications (email/SMS/WhatsApp) via REST
7. **Docker** (later) — only if you move off Vercel or want local container parity

The frontend's `lib/mock-data.ts` is the single seam: once the API is live, swap those
exports for `fetch` calls and the UI does not change.

---

## 11. Company reference

- **Company:** Sri Lakshmi Transport Company (SLTC)
- **Incorporated:** 29 December 2020 (built on ~20 years of travel-industry experience)
- **Base:** Hyderabad & Telangana · **Fleet:** 5–44 seaters, AC & Non-AC · **Availability:** 24/7
- **Contact:** +91 81793 14684 · +91 70757 14684 · sltc.shyam6666@gmail.com

*Operational figures shown inside the dashboards are illustrative demo data.*
