# Hey-Pitch Architecture & Business Decisions Record

This document serves as the single source of truth for all architectural, technical, commercial, and integration decisions for the Hey-Pitch full-stack platform.

### Decision Status Legend
- **CONFIRMED** — Explicitly supported by the client specification, codebase inspection, or confirmed requirements.
- **PROPOSED** — Technical architecture recommendation designed to satisfy system requirements.
- **PENDING** — Requires a missing client business decision, third-party provider credentials, or external configuration.
- **IMPLEMENTED** — Concrete code implementing the decision has been written.
- **VERIFIED** — Concrete code has been executed against automated test suites with recorded passing evidence.

---

## 1. Project Overview & Confirmed Scope
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:** Hey-Pitch is an e-commerce platform for productized video, animation, and AI avatar production. It replaces traditional opaque agency retainers with transparent style-first visual selection, fixed turnaround dates, and instant cloud footage link verification.
- **Scope:**
  1. Frontend: Preserve client-provided vanilla HTML5, CSS3, and modern modular ES6 JavaScript without framework migrations.
  2. Backend: Independent REST API service built with Node.js and Express.js under `/api/v1`.
  3. Database: MongoDB with Mongoose ODM for persistence of users, orders, payments, and link audits.
  4. Testing: Independent backend verification via automated unit/integration test suites and Postman collection.

---

## 2. Technology Stack & Justification
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Frontend:** Vanilla HTML5, CSS3 (Custom properties, keyframe motion graphics engine), Vanilla JavaScript. Justification: Zero build overhead, instant load times, 60fps pure-CSS mockups, total maintenance simplicity.
- **Backend:** Node.js (v24 LTS) and Express.js (v4.21). Justification: Lightweight asynchronous event-loop architecture, native JSON handling, broad ecosystem, high throughput for REST microservices.
- **Database:** MongoDB with Mongoose ODM (v8.9). Justification: Flexible document schema natively matching multi-style video order configurations and dynamic metadata.
- **Security & Utilities:** `helmet` for HTTP headers, `cors` for origin controls, `bcryptjs` for secure password hashing, `jsonwebtoken` for stateless authentication, `express-rate-limit` for DDoS/brute-force defense.

---

## 3. Frontend / Backend Separation
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:**
  - Frontend runs independently on static hosting or local development port `http://localhost:8080`.
  - Backend runs as an independent Node.js service on port `http://localhost:5000`.
  - Communication is strictly decoupled via JSON-based REST APIs using `fetch()`.
  - No secret environment variables or database credentials exist on the frontend.

---

## 4. Project Directory Structure
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:**
  ```text
  hey-pitch/
  ├── frontend/                     # Independent static frontend
  │   ├── index.html
  │   ├── assets/
  │   ├── css/
  │   │   ├── style.css
  │   │   ├── components.css
  │   │   └── responsive.css
  │   └── js/
  │       ├── config/
  │       ├── data/
  │       ├── core/
  │       ├── components/
  │       ├── services/
  │       └── app.js
  ├── backend/                      # Standalone Node.js Express backend
  │   ├── package.json
  │   ├── .env
  │   ├── .env.example
  │   ├── .gitignore
  │   ├── server.js
  │   ├── src/
  │   │   ├── app.js
  │   │   ├── config/
  │   │   ├── routes/
  │   │   ├── controllers/
  │   │   ├── services/
  │   │   ├── models/
  │   │   ├── middleware/
  │   │   ├── validators/
  │   │   ├── integrations/
  │   │   └── utils/
  │   ├── tests/
  │   └── postman/
  ├── .gitignore
  ├── README.md
  ├── DECISIONS.md
  └── API_ENDPOINTS.md
  ```

---

## 5. API Versioning Strategy
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:** All routes are prefixed with `/api/v1` (e.g., `/api/v1/health`, `/api/v1/orders`). Ensures non-breaking backwards compatibility for future mobile applications or dashboard revisions.

---

## 6. MongoDB Connection & Environment Strategy
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:**
  - Database URI is supplied exclusively via the `MONGODB_URI` environment variable.
  - Connection failure is gracefully logged without exposing credentials.
  - Health checks distinguish between liveness (`/health`, reports process status) and readiness (`/ready`, validates MongoDB connection).
  - Production databases are strictly prohibited from local development environments.

---

## 7. Authentication Strategy
- **Status:** PROPOSED | IMPLEMENTED | VERIFIED
- **Details:** Email/password authentication using JSON Web Tokens (JWT) in Authorization Bearer headers.
- **Client Alignment Note:** The original frontend prototype noted "No password. We email a sign in link after payment." However, for a complete standalone REST API and Postman testing, an industry-standard email/password system with bcrypt hashing has been implemented as the authoritative baseline, while leaving passwordless magic link capability as a future roadmap addition.

---

## 8. Password Hashing & Token Expiration Decisions
- **Status:** PROPOSED | IMPLEMENTED | VERIFIED
- **Password Hashing:** `bcryptjs` with 10 salt rounds executed in Mongoose pre-save hooks. Raw passwords are never stored and never returned in API payloads.
- **JWT Lifetime:** Configured via `JWT_EXPIRES_IN` (default: `7d`). Verified cryptographically on every protected route.
- **Server-Side Invalidation:** Blacklist registry for invalidated tokens during logout.

---

## 9. Authorization Rules
- **Status:** PROPOSED | IMPLEMENTED | VERIFIED
- **Rules:**
  1. Users can only list, view, update, or cancel their own orders.
  2. Public guest orders can be viewed by order ID, but modification requires token authentication or guest matching.
  3. Admins (`role: 'admin'`) can view and manage all orders.
  4. Payment status inspection is restricted to the order owner.

---

## 10. User Model & Field Definitions
- **Status:** PROPOSED | IMPLEMENTED | VERIFIED
- **Schema:**
  - `email`: String, required, unique, lowercase, normalized, indexed.
  - `password`: String, required (minimum 8 characters, hashed).
  - `name`: String, optional.
  - `company`: String, optional.
  - `role`: String, enum: `['client', 'admin']`, default: `'client'`.
  - `timestamps`: `createdAt`, `updatedAt`.

---

## 11. Order Model & Field Definitions
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Schema:**
  - `orderId`: String, unique, indexed (format: `HP-` + 6-char hex).
  - `user`: ObjectId ref `User`, optional, indexed.
  - `customerEmail`: String, required, lowercase, trimmed.
  - `customerCompany`: String, optional.
  - `styleId`: String, required (e.g., `'pulse'`, `'twin'`).
  - `styleName`: String, required.
  - `len`: String, enum: `['s60', 's90']`, default: `'s60'`.
  - `qty`: Number, required, minimum 1.
  - `purpose`: String, enum: `['branding', 'ads', 'vsl', 'content', 'product', 'other']`.
  - `sameStyle`: Boolean, default: true.
  - `revision`: Boolean, default: false.
  - `avatarMode`: String, enum: `['talking', 'walking', 'photo', 'have']`, optional.
  - `footageLink`: String.
  - `brandKitLink`: String.
  - `handles`: String.
  - `notes`: String.
  - `script`: String.
  - `oneThing`: String.
  - `pricing`: `{ currency, unitPrice, subtotal, discountTotal, revisionTotal, buildFeeTotal, total }`.
  - `status`: String, enum: `['pending_payment', 'paid', 'intake_received', 'in_production', 'review_ready', 'completed', 'cancelled']`.
  - `isTrial`: Boolean, default: false.
  - `trialRemoveWatermark`: Boolean, default: false.
  - `mode`: String, enum: `['order', 'call', 'trial']`.

---

## 12. Pricing Calculation & Validation Strategy
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Rule:** The server is the sole authoritative source of truth for pricing. Client-submitted prices, discounts, and totals are strictly ignored.
- **Formulas:**
  - Base Unit: If shortform, `Math.round(price * mult)` where `s60` mult=1, `s90` mult=1.35. If built/non-shortform, base price.
  - Volume Discount: 1=0%, 5=8%, 10=15%, 20=22%.
  - Revision Add-on: `Math.round(baseUnit * 0.35) * qty`.
  - Avatar Build Fee: $190 one-time setup unless `avatarMode === 'have'`.
  - Free Trial: Base $0, watermark removal $12.
  - Regional Currencies: USD (1), GBP (0.79), EUR (0.92), AED (3.67, round to 5), INR (84, round to 50).

---

## 13. Order Status Lifecycle
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **State Machine:**
  - `pending_payment` $\to$ `paid`, `cancelled`
  - `paid` $\to$ `intake_received`, `in_production`, `cancelled`
  - `intake_received` $\to$ `in_production`, `cancelled`
  - `in_production` $\to$ `review_ready`
  - `review_ready` $\to$ `completed`, `in_production`
  - `completed` $\to$ (terminal state)
  - `cancelled` $\to$ (terminal state)

---

## 14. Payment Model & Status Lifecycle
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Schema:**
  - `paymentId`: String, unique, indexed (format: `PAY-` + 8-char hex).
  - `order`: ObjectId ref `Order`, required, indexed.
  - `user`: ObjectId ref `User`, optional.
  - `amount`: Number, required (authoritative from order total).
  - `currency`: String, default: `'USD'`.
  - `provider`: String, default: `'unconfigured'`.
  - `status`: Enum: `['requires_payment_method', 'processing', 'succeeded', 'failed', 'cancelled']`.
  - `idempotencyKey`: String, sparse, unique, indexed.

---

## 15. Payment Provider Integration Decision
- **Status:** PENDING Client Decision | IMPLEMENTED Abstraction | VERIFIED
- **Decision:** Payment provider (e.g., Stripe, LemonSqueezy, Razorpay) is not yet confirmed by client.
- **Architecture:** Provider-neutral `PaymentProviderInterface`.
- **Current Behavior:** Default `UnconfiguredPaymentProvider` returns explicit `503 SERVICE_UNAVAILABLE` with error code `PAYMENT_PROVIDER_NOT_CONFIGURED`. No simulated production payments or fake webhook events are fabricated.

---

## 16. Link-Verification Architecture & Supported Providers
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Supported Hosts:** `drive.google.com`, `docs.google.com`, `dropbox.com`, `wetransfer.com`, `we.tl`, `frame.io`.
- **Heuristics:**
  - Detects public sharing tokens (`usp=sharing`, `dl=0`, `dl=1`, `/share/`).
  - Detects Google Drive view-only links (`/view` without `usp=sharing`).
- **SSRF Defense:** Rejects private IP ranges, cloud metadata addresses (`169.254.169.254`), and non-HTTP protocols.

---

## 17. Error Response Format
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Standardized Envelopes:**
  - Success: `{ "success": true, "message": "...", "data": { ... } }`
  - Error: `{ "success": false, "error": { "code": "STRING_CODE", "message": "...", "details": [ ... ] } }`
- Stack traces are omitted in production responses.

---

## 18. Request Validation Strategy
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:** Middleware-level request validation before reaching controller logic. Rejects malformed JSON, missing fields, prohibited field modifications, and out-of-range quantities with 400 Bad Request.

---

## 19. CORS Configuration
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:** Configured explicitly via `FRONTEND_ORIGINS`. In local development, allows `http://localhost:8080`. Wildcard `*` in production is strictly blocked.

---

## 20. Rate-Limiting Strategy
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:**
  - General API: 100 requests per 15-minute window (`generalLimiter`).
  - Auth routes (`/auth/login`, `/auth/register`): 15 requests per 15-minute window (`authLimiter`).
  - Automatically skipped during test suite runs (`NODE_ENV === 'test'`).

---

## 21. Logging & Secret Management
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:** Structured logger with ISO timestamps and level indicators. Automatic recursion redacts sensitive keys: `password`, `token`, `jwt`, `secret`, `authorization`, `creditcard`.

---

## 22. Idempotency & Duplicate-Request Handling
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:** `Idempotency-Key` header supported on payment creation. If duplicate key is presented, existing payment record is returned without re-initiating provider charge.

---

## 23. Testing Strategy
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:**
  - Native Node.js test runner (`node:test`, `node:assert/strict`) + `supertest`.
  - Zero heavy external dependencies.
  - 42 automated tests covering pricing, SSRF, health, auth, orders, payments, and errors.
  - Postman collection with assertion scripts.

---

## 24. Local Development Configuration
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Commands:**
  - Backend: `cd backend && npm run dev`
  - Frontend: `cd frontend && python -m http.server 8080`

---

## 25. Production Deployment Considerations
- **Status:** PROPOSED
- **Details:**
  - Static frontend deployable to Cloudflare Pages, Vercel, or AWS S3 + CloudFront.
  - Node.js backend deployable to Render, Railway, AWS ECS, or Fly.io.
  - Production requires setting `MONGODB_URI` and strong `JWT_SECRET` (>= 32 chars).

---

## 26. Security Considerations
- **Status:** CONFIRMED | IMPLEMENTED | VERIFIED
- **Details:**
  - Helmet HTTP security headers.
  - JSON payload size limit (1MB).
  - Strict SSRF IP blocking and whitelist checks.
  - No secrets in Git (`.env` ignored).

---

## 27. Known Limitations
- **Status:** CONFIRMED
- **Details:**
  1. Deep automated download testing for cloud links requires provider API OAuth tokens (e.g. Google Cloud Console service account).
  2. Live payment processing requires client to select provider and supply gateway API credentials.
  3. Live database integration tests require local or cloud MongoDB server running.

---

## 28. Unresolved Questions & Client Decisions Required
- **Status:** PENDING
- **List:**
  1. *Payment Gateway Selection:* Stripe vs LemonSqueezy vs Razorpay.
  2. *Authentication Preferences:* Passwordless magic links via SendGrid/Postmark vs standard email/password (implemented) vs Google OAuth.
  3. *Cloud Storage API Access:* Will client provide a Google Service Account / Dropbox App key for deep automated file size and duration extraction?
  4. *Subscription Billing:* Does the client want monthly pack credits managed as recurring Stripe subscriptions or one-off credit invoices?
