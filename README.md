# Hey-Pitch — Full-Stack Platform

Hey-Pitch is a productized video, animation, and AI production platform that turns creative video services into a transparent e-commerce experience.

---

## 1. Project Architecture

The application is architected into two completely decoupled layers:

```text
hey-pitch/
├── frontend/                     # Independent static frontend (HTML5/CSS3/Vanilla JS)
│   ├── index.html                # Entry point
│   ├── assets/                   # Static images, icons, and video previews
│   ├── css/                      # Style tokens, components, and responsive media queries
│   └── js/                       # Modular ES6 client code (config, data, core, components, services)
│
├── backend/                      # Independent Node.js / Express.js REST API service
│   ├── server.js                 # Server startup and graceful shutdown
│   ├── package.json              # Backend dependencies
│   ├── .env.example              # Environment template
│   ├── src/
│   │   ├── app.js                # Express app setup, CORS, security, routes, error handlers
│   │   ├── config/               # Database and environment validation
│   │   ├── routes/               # API endpoint routing (/api/v1)
│   │   ├── controllers/          # HTTP request handlers
│   │   ├── services/             # Authoritative pricing, auth, orders, payments, verification
│   │   ├── models/               # Mongoose schemas (User, Order, Payment, Verification)
│   │   ├── middleware/           # Auth, rate-limiting, error handling
│   │   ├── validators/           # Request input validation
│   │   ├── integrations/         # Payment provider abstraction
│   │   └── utils/                # Logger, responses, SSRF guard
│   ├── tests/                    # Automated unit and integration test suite
│   └── postman/                  # Postman collection and environment files
│
├── DECISIONS.md                  # Single source of truth for architectural decisions
├── API_ENDPOINTS.md              # Complete REST API documentation
└── README.md                     # Project setup guide
```

---

## 2. Frontend Setup

The frontend is built using standard, framework-free web technologies:
- **HTML5:** Semantic markup, accessible drawer modals, and ARIA attributes.
- **CSS3:** Custom properties design system, 60fps keyframe CSS animations for style previews.
- **JavaScript:** Native ES6 modular components.
- **Hosting:** 100% static. Can be served via Python http.server, Nginx, Cloudflare Pages, Vercel, or AWS S3.

To run the frontend locally:
```bash
cd frontend
python -m http.server 8080
```
Visit `http://localhost:8080` in your web browser.

---

## 3. Backend Setup

The backend is a standalone Node.js Express service:
- **Node.js:** v20+ (tested on Node v24)
- **Framework:** Express.js v4.21
- **ODM:** Mongoose v8.9

To install dependencies:
```bash
cd backend
npm install
```

---

## 4. Required Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# Server
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
FRONTEND_ORIGINS=http://localhost:8080

# Database
MONGODB_URI=mongodb://localhost:27017/heypitch

# Authentication
JWT_SECRET=your_secure_jwt_secret_min_32_characters_long
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=15

# Payment Provider Integration
PAYMENT_PROVIDER=unconfigured
```

---

## 5. MongoDB Setup

1. **Local MongoDB:**
   - Install MongoDB Community Server.
   - Start MongoDB service locally on default port `27017`.
   - Set `MONGODB_URI=mongodb://localhost:27017/heypitch`.

2. **MongoDB Atlas (Cloud):**
   - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
   - Create a database user and whitelist your server's IP address.
   - Set `MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/heypitch?retryWrites=true&w=majority`.

---

## 6. How to Run Both Servers

Open two terminal windows:

### Terminal 1 — Backend:
```bash
cd backend
npm run dev
```
*API will start on `http://localhost:5000` with health check at `http://localhost:5000/api/v1/health`.*

### Terminal 2 — Frontend:
```bash
cd frontend
python -m http.server 8080
```
*Frontend will be live at `http://localhost:8080`.*

---

## 7. Available API Endpoints

All endpoints are mounted under `/api/v1`:

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/health` | API process liveness probe | No |
| `GET` | `/api/v1/ready` | Database readiness check | No |
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue JWT | No |
| `GET` | `/api/v1/auth/me` | Current user profile | Bearer Token |
| `POST` | `/api/v1/auth/logout` | Invalidate token session | Bearer Token |
| `POST` | `/api/v1/orders` | Create server-priced order | Optional |
| `GET` | `/api/v1/orders` | List user's orders (paginated) | Bearer Token |
| `GET` | `/api/v1/orders/:orderId` | Retrieve order details | Optional |
| `PATCH`| `/api/v1/orders/:orderId` | Update permitted order intake fields | Optional |
| `POST` | `/api/v1/orders/:orderId/cancel`| Cancel eligible order | Optional |
| `POST` | `/api/v1/payments/create` | Initiate order payment | Optional |
| `GET` | `/api/v1/payments/:paymentId` | Get payment status | Optional |
| `POST` | `/api/v1/payments/webhook` | Process payment provider webhook | Provider Sig |
| `POST` | `/api/v1/verification/validate-url` | Fast URL syntax check + SSRF guard | No |
| `POST` | `/api/v1/verification/check` | Comprehensive permissions & download check | No |

For full request/response schemas and validation rules, see [API_ENDPOINTS.md](file:///c:/Users/ayush/OneDrive/Desktop/hey-pitch/API_ENDPOINTS.md).

---

## 8. How to Run Tests

Execute the automated test suite (42 tests covering pricing, SSRF defense, health, auth, orders, payments, and errors):

```bash
cd backend
npm test
```

### Postman Testing:
1. Open Postman.
2. Click **Import** $\to$ select `backend/postman/Hey-Pitch-API.postman_collection.json`.
3. Click **Import** $\to$ select `backend/postman/Hey-Pitch-Local.postman_environment.json`.
4. Select environment **Hey-Pitch Local Environment** in top-right.
5. Run collection requests in folder order (Health $\to$ Auth $\to$ Orders $\to$ Payments $\to$ Verification).

---

## 9. Configuring Production Origins

In production, update `FRONTEND_ORIGINS` in your environment:
```env
FRONTEND_ORIGINS=https://heypitch.in,https://app.heypitch.in
```
Wildcard `*` is prohibited to prevent cross-origin data exposure.

---

## 10. Integrations Requiring Provider Credentials

The following integrations are intentionally architected with clear boundaries awaiting client provider decisions:

1. **Payment Gateway:**
   - Provider interface: `backend/src/integrations/payment/paymentProvider.interface.js`
   - Current status: Safely returns `503 SERVICE_UNAVAILABLE` with code `PAYMENT_PROVIDER_NOT_CONFIGURED`.
   - Requires client choice between Stripe, LemonSqueezy, or Razorpay + API keys.

2. **Deep Cloud Storage Ingestion:**
   - Format validation and public sharing heuristics are fully active.
   - Deep inspection of private drive files requires provider OAuth app credentials (Google Service Account, Dropbox App Key).

---

## 11. Known Capabilities & Status

For a complete record of architectural decisions and their current statuses (CONFIRMED, PROPOSED, PENDING, IMPLEMENTED, VERIFIED), consult [DECISIONS.md](file:///c:/Users/ayush/OneDrive/Desktop/hey-pitch/DECISIONS.md).
