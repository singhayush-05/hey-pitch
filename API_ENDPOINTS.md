# Hey-Pitch Backend API Specification

**Base URL:** `http://localhost:5000/api/v1`  
**API Prefix:** `/api/v1`  
**Response Format:** JSON (`application/json`)  

---

## Environment Setup & Postman Execution Flow

### 1. Starting the Services
```bash
# Terminal 1: Backend API Service
cd backend
npm install
npm run dev

# Terminal 2: Static Frontend
cd frontend
python -m http.server 8080
```

### 2. Recommended Postman Execution Order
1. **Health Check:** `GET /health` (Verify liveness)
2. **Readiness Check:** `GET /ready` (Verify database connectivity)
3. **Register User:** `POST /auth/register` (Automatically stores `token` in Postman environment)
4. **Login User:** `POST /auth/login` (Re-authenticates and updates `token`)
5. **Get Profile:** `GET /auth/me` (Uses Bearer `token`)
6. **Validate Cloud Link:** `POST /verification/validate-url` (Tests Google Drive / Dropbox syntax)
7. **Check Resource Permissions:** `POST /verification/check` (Audits sharing permissions)
8. **Create Order:** `POST /orders` (Stores `orderId` in Postman environment)
9. **List Orders:** `GET /orders` (Paginated list of user orders)
10. **Get Order Details:** `GET /orders/:orderId`
11. **Update Order Details:** `PATCH /orders/:orderId` (Update notes, handles)
12. **Create Payment:** `POST /payments/create` (Demonstrates safe `503 PAYMENT_PROVIDER_NOT_CONFIGURED`)
13. **Cancel Order:** `POST /orders/:orderId/cancel`
14. **Security Tests:** Execute folder `6. Error & Security Tests` (SSRF block, Amount spoof rejection)

---

## Endpoints Directory

### 1. Health & Readiness

#### `GET /health`
- **Method:** `GET`
- **Full URL:** `http://localhost:5000/api/v1/health`
- **Purpose:** API liveness probe. Verifies application process is up and accepting requests.
- **Authentication:** None (Public)
- **Authorization:** None
- **Headers:** None required
- **Path / Query Parameters:** None
- **Request Body:** None
- **Status Codes:** `200 OK`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **External Dependencies:** None
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "API service is live and responsive",
  "data": {
    "status": "ok",
    "uptime": 12.45,
    "timestamp": "2026-10-17T11:00:00.000Z",
    "environment": "development",
    "version": "1.0.0"
  }
}
```

---

#### `GET /ready`
- **Method:** `GET`
- **Full URL:** `http://localhost:5000/api/v1/ready`
- **Purpose:** Readiness probe. Verifies MongoDB connectivity without leaking connection strings.
- **Authentication:** None (Public)
- **Status Codes:** `200 OK` (Ready), `503 Service Unavailable` (Database disconnected)
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Application and database are ready to accept traffic",
  "data": {
    "status": "ready",
    "database": {
      "status": "connected",
      "connected": true,
      "configured": true
    },
    "timestamp": "2026-10-17T11:00:00.000Z"
  }
}
```
- **Error Response (503 Service Unavailable):**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_NOT_READY",
    "message": "Database connection is unavailable. Application is not ready.",
    "details": {
      "status": "not_ready",
      "database": {
        "status": "disconnected",
        "connected": false,
        "configured": false
      }
    }
  }
}
```

---

### 2. Authentication

#### `POST /auth/register`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/auth/register`
- **Purpose:** Create a new user account with secure password hashing.
- **Authentication:** None (Public)
- **Rate Limit:** 15 requests / 15 mins
- **Required Headers:** `Content-Type: application/json`
- **Request Body Schema:**
```json
{
  "email": "string (valid email, required)",
  "password": "string (min 8 chars, required)",
  "name": "string (optional)",
  "company": "string (optional)"
}
```
- **Example Request:**
```json
{
  "email": "founder@heypitch.in",
  "password": "SecurePassword123!",
  "name": "Alex Founder",
  "company": "ScaleLabs"
}
```
- **Status Codes:** `201 Created`, `400 Bad Request`, `409 Conflict`, `429 Too Many Requests`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Models Affected:** `User`
- **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "6710f135b5c9c82b9c8b4111",
      "email": "founder@heypitch.in",
      "name": "Alex Founder",
      "company": "ScaleLabs",
      "role": "client",
      "createdAt": "2026-10-17T11:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `POST /auth/login`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/auth/login`
- **Purpose:** Authenticate user and issue signed JWT.
- **Authentication:** None (Public)
- **Rate Limit:** 15 requests / 15 mins
- **Request Body Schema:**
```json
{
  "email": "string (required)",
  "password": "string (required)"
}
```
- **Status Codes:** `200 OK`, `400 Bad Request`, `401 Unauthorized`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "6710f135b5c9c82b9c8b4111",
      "email": "founder@heypitch.in",
      "name": "Alex Founder",
      "company": "ScaleLabs",
      "role": "client"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### `GET /auth/me`
- **Method:** `GET`
- **Full URL:** `http://localhost:5000/api/v1/auth/me`
- **Purpose:** Retrieve currently authenticated user profile.
- **Authentication:** Required (`Authorization: Bearer <token>`)
- **Status Codes:** `200 OK`, `401 Unauthorized`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "6710f135b5c9c82b9c8b4111",
      "email": "founder@heypitch.in",
      "name": "Alex Founder",
      "company": "ScaleLabs",
      "role": "client"
    }
  }
}
```

---

#### `POST /auth/logout`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/auth/logout`
- **Purpose:** Invalidate session token on server.
- **Authentication:** Required (`Authorization: Bearer <token>`)
- **Status Codes:** `200 OK`, `401 Unauthorized`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": {
    "loggedOut": true
  }
}
```

---

### 3. Orders

#### `POST /orders`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/orders`
- **Purpose:** Validate and persist a new video production order. Computes price authoritatively on server.
- **Authentication:** Optional (Supports authenticated users and guest checkouts)
- **Request Body Schema:**
```json
{
  "styleId": "string (required, e.g., 'pulse', 'twin', 'plain')",
  "customerEmail": "string (required)",
  "customerCompany": "string (optional)",
  "qty": "number (integer 1-100, default 1)",
  "len": "string ('s60' | 's90', default 's60')",
  "purpose": "string ('branding' | 'ads' | 'vsl' | 'content' | 'product' | 'other')",
  "revision": "boolean (default false)",
  "avatarMode": "string ('talking' | 'walking' | 'photo' | 'have', for twin)",
  "footageLink": "string (optional)",
  "brandKitLink": "string (optional)",
  "handles": "string (optional)",
  "notes": "string (optional)",
  "script": "string (optional)",
  "oneThing": "string (optional)",
  "isTrial": "boolean (default false)",
  "trialRemoveWatermark": "boolean (default false)"
}
```
- **Example Request:**
```json
{
  "styleId": "pulse",
  "customerEmail": "founder@heypitch.in",
  "qty": 5,
  "len": "s60",
  "purpose": "branding",
  "revision": true,
  "notes": "Focus on high-energy hooks and dynamic captions"
}
```
- **Status Codes:** `201 Created`, `400 Bad Request`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Models Affected:** `Order`
- **Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "order": {
      "orderId": "HP-A1B2C3",
      "customerEmail": "founder@heypitch.in",
      "styleId": "pulse",
      "styleName": "Pulse",
      "len": "s60",
      "qty": 5,
      "purpose": "branding",
      "revision": true,
      "pricing": {
        "currency": "USD",
        "unitPrice": 36,
        "subtotal": 180,
        "discountTotal": 15,
        "revisionTotal": 70,
        "buildFeeTotal": 0,
        "total": 250
      },
      "status": "pending_payment",
      "isTrial": false,
      "createdAt": "2026-10-17T11:00:00.000Z"
    }
  }
}
```

---

#### `GET /orders`
- **Method:** `GET`
- **Full URL:** `http://localhost:5000/api/v1/orders?page=1&limit=10`
- **Purpose:** Paginated list of orders owned by the authenticated user.
- **Authentication:** Required (`Authorization: Bearer <token>`)
- **Query Parameters:** `page` (default: 1), `limit` (default: 10, max: 50)
- **Status Codes:** `200 OK`, `401 Unauthorized`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "HP-A1B2C3",
        "styleId": "pulse",
        "styleName": "Pulse",
        "qty": 5,
        "status": "pending_payment",
        "pricing": { "total": 250, "currency": "USD" },
        "createdAt": "2026-10-17T11:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

#### `GET /orders/:orderId`
- **Method:** `GET`
- **Full URL:** `http://localhost:5000/api/v1/orders/HP-A1B2C3`
- **Purpose:** Retrieve a single order by orderId or MongoDB ObjectId.
- **Authentication:** Optional (Enforces ownership check if user token is provided)
- **Status Codes:** `200 OK`, `403 Forbidden`, `404 Not Found`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)

---

#### `PATCH /orders/:orderId`
- **Method:** `PATCH`
- **Full URL:** `http://localhost:5000/api/v1/orders/HP-A1B2C3`
- **Purpose:** Update client-editable intake fields while order is in `pending_payment` or `intake_received`.
- **Authentication:** Optional (Enforces ownership if authenticated)
- **Permitted Fields:** `notes`, `brandKitLink`, `handles`, `footageLink`, `script`, `oneThing`
- **Prohibited Fields:** `status`, `pricing`, `qty`, `styleId`, `orderId`
- **Status Codes:** `200 OK`, `400 Bad Request`, `404 Not Found`, `422 Unprocessable Entity`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)

---

#### `POST /orders/:orderId/cancel`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/orders/HP-A1B2C3/cancel`
- **Purpose:** Cancel an order if it is in an eligible status (`pending_payment` or `intake_received`).
- **Status Codes:** `200 OK`, `404 Not Found`, `422 Unprocessable Entity`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)

---

### 4. Payments

#### `POST /payments/create`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/payments/create`
- **Purpose:** Initiate payment against a server-validated order total.
- **Authentication:** Optional (Enforces order ownership if authenticated)
- **Headers:** `Idempotency-Key` (Optional string for duplicate charge prevention)
- **Request Body Schema:**
```json
{
  "orderId": "string (required)"
}
```
- **Security Check:** If request contains `amount` or `status`, it is rejected with `400 Bad Request`.
- **Provider Status:** Returns `503 Service Unavailable` with `PAYMENT_PROVIDER_NOT_CONFIGURED` while payment gateway credentials are not yet selected.
- **Status Codes:** `201 Created`, `400 Bad Request`, `404 Not Found`, `503 Service Unavailable`
- **Implemented:** Yes (Interface, abstraction, security validation)
- **Tested:** Yes (Verified via automated test suite)
- **Response when Unconfigured (503 Service Unavailable):**
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_PROVIDER_NOT_CONFIGURED",
    "message": "Payment provider is not yet configured. Please select and configure a payment gateway (e.g., Stripe) in backend environment.",
    "details": {
      "provider": "unconfigured",
      "actionRequired": "Set PAYMENT_PROVIDER and relevant API keys in backend/.env"
    }
  }
}
```

---

#### `GET /payments/:paymentId`
- **Method:** `GET`
- **Full URL:** `http://localhost:5000/api/v1/payments/PAY-ABC12345`
- **Purpose:** Retrieve payment record and status.
- **Authentication:** Optional (Enforces ownership)
- **Status Codes:** `200 OK`, `403 Forbidden`, `404 Not Found`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)

---

#### `POST /payments/webhook`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/payments/webhook`
- **Purpose:** Receive and verify incoming webhook events from payment gateway.
- **Headers:** Provider signature header (e.g., `Stripe-Signature`)
- **Status Codes:** `200 OK`, `400 Bad Request`, `503 Service Unavailable`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)

---

### 5. File & Link Verification

#### `POST /verification/validate-url`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/verification/validate-url`
- **Purpose:** Fast URL syntax validation and provider identification with SSRF protection.
- **Authentication:** None (Public)
- **Request Body Schema:**
```json
{
  "url": "string (required)"
}
```
- **Example Request:**
```json
{
  "url": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms/view?usp=sharing"
}
```
- **Status Codes:** `200 OK`, `400 Bad Request`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "isValidFormat": true,
    "isSupportedProvider": true,
    "url": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OGvE2upms/view?usp=sharing",
    "hostname": "drive.google.com",
    "provider": "google_drive",
    "message": "Valid google drive link format"
  }
}
```

---

#### `POST /verification/check`
- **Method:** `POST`
- **Full URL:** `http://localhost:5000/api/v1/verification/check`
- **Purpose:** Comprehensive link audit checking public sharing parameters and download permissions.
- **Authentication:** None (Public)
- **Request Body Schema:**
```json
{
  "url": "string (required)"
}
```
- **Status Codes:** `200 OK`, `400 Bad Request`
- **Implemented:** Yes
- **Tested:** Yes (Verified via automated test suite)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "isValidFormat": true,
    "isDownloadable": true,
    "provider": "google_drive",
    "status": "download_accessible",
    "message": "Link structure and sharing permissions verified. Ready for video ingestion.",
    "sourceMetadata": {
      "provider": "google_drive",
      "verifiedAt": "2026-10-17T11:00:00.000Z"
    }
  }
}
```
- **View-Only Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "verified": false,
    "isValidFormat": true,
    "provider": "google_drive",
    "status": "view_only",
    "message": "This Google Drive link is view-only, which blocks team download. Set access to \"Anyone with the link\" and allow download."
  }
}
```
