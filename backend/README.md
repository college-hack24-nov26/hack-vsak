# HackVsak Backend API

Production-ready backend API written in 100% **TypeScript**, powered by **Node.js**, **Express**, and **MongoDB (Mongoose)**, featuring complete authentication flows, user management, API Key CRUD operations, AI API key validation, rate limiting, and email dispatch services.

---

## 📋 User Data Model
The user document contains the following fields:

| Field | Type | Description |
|---|---|---|
| `user_id` | String | Unique user identifier (e.g. `usr_9a4f21b73c4d180e`), auto-generated or custom |
| `name` | String | User's full name (2–100 characters) |
| `phone_no` | String | User's contact number (7–25 characters) |
| `email` | String | Unique lowercase email address (indexed) |
| `password` | String | Encrypted using bcrypt with 12 salt rounds (hidden from queries by default) |
| `terms_accepted` | Boolean | Terms & Conditions acceptance flag (must be `true` on registration) |
| `role` | String | User role (`'user'` or `'admin'`, default: `'user'`) |
| `isVerified` | Boolean | Email verification status |
| `apiKeys` | Array | User's created API keys (subdocuments) |
| `createdAt` / `updatedAt` | Date | Timestamps |

---

## 📡 Complete Routes Reference (`/api/v1/auth`)

### 1. Authentication Routes

#### `POST /api/v1/auth/signup`
Creates a new user account, enforces Terms & Conditions acceptance, and dispatches a 6-digit OTP email.
- **Request Body**:
```json
{
  "name": "Alex Rivera",
  "phone_no": "+14155552671",
  "email": "alex@example.com",
  "password": "SecurePassword123!",
  "terms_accepted": true
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "Registration successful! A 6-digit verification code has been sent to your email.",
  "data": {
    "userId": "673f1c24e0...",
    "user_id": "usr_7b9d4e21...",
    "name": "Alex Rivera",
    "phone_no": "+14155552671",
    "email": "alex@example.com",
    "terms_accepted": true,
    "isVerified": false
  }
}
```

#### `POST /api/v1/auth/verify-otp` *(Alias: `/api/v1/auth/verify-email`)*
Verifies the 6-digit OTP code, marks account as verified, and returns JWT tokens.
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "otp": "482910"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Email successfully verified! Welcome to HackVsak.",
  "data": {
    "user": {
      "user_id": "usr_7b9d4e21...",
      "name": "Alex Rivera",
      "phone_no": "+14155552671",
      "email": "alex@example.com",
      "terms_accepted": true,
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "eyJhbGciOiJIUzI1Ni..."
    }
  }
}
```

#### `POST /api/v1/auth/resend-otp`
Dispatches a new 6-digit OTP with a refreshed 10-minute expiry.
- **Request Body**:
```json
{
  "email": "alex@example.com"
}
```

#### `POST /api/v1/auth/login`
Authenticates credentials, dispatches a "Try to login" email alert containing the IP address and device/browser details, and returns JWT tokens.
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "password": "SecurePassword123!"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "user_id": "usr_7b9d4e21...",
      "name": "Alex Rivera",
      "phone_no": "+14155552671",
      "email": "alex@example.com",
      "terms_accepted": true,
      "isVerified": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1Ni...",
      "refreshToken": "eyJhbGciOiJIUzI1Ni..."
    }
  }
}
```

#### `POST /api/v1/auth/forgot-password`
Generates a 15-minute reset code and sends the reset email template.
- **Request Body**:
```json
{
  "email": "alex@example.com"
}
```

#### `POST /api/v1/auth/reset-password`
Verifies the reset code and updates the user's password.
- **Request Body**:
```json
{
  "email": "alex@example.com",
  "otp": "772194",
  "newPassword": "NewStrongPassword456!"
}
```

#### `POST /api/v1/auth/refresh-token`
Generates a fresh access token using a valid refresh token.
- **Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1Ni..."
}
```

#### `GET /api/v1/auth/me`
Retrieves authenticated user's profile.
- **Headers**: `Authorization: Bearer <accessToken>`

#### `POST /api/v1/auth/logout`
Revokes session and clears authentication cookies.
- **Headers**: `Authorization: Bearer <accessToken>`

---

### 2. API Key CRUD & AI Validation Routes

#### `POST /api/v1/auth/create-api-key` *(or `POST /api/v1/auth/api-keys`)*
Creates a new API key (`sk_live_...`), hashes it in MongoDB, dispatches the `apiKeyCreated` email template to the user, and returns the raw secret key.
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "name": "Production AI Agent Key",
  "expiresInDays": 90
}
```
- **Success Response (201 Created)**:
```json
{
  "success": true,
  "message": "API key successfully created. Make sure to copy your secret key now; it cannot be shown again!",
  "data": {
    "apiKey": "sk_live_9fa82b4c107e3d81b849204a11c8a14b09c2d3e4f5a6b7c8",
    "keyId": "673f2a1b9c...",
    "keyPrefix": "sk_live_9fa8...b7c8",
    "name": "Production AI Agent Key",
    "isActive": true,
    "expiresAt": "2027-02-01T14:48:30.000Z",
    "user_id": "usr_7b9d4e21...",
    "email": "alex@example.com",
    "createdAt": "2026-11-03T14:48:30.000Z"
  }
}
```

#### `GET /api/v1/auth/api-keys`
Lists all API keys for the authenticated user (includes IDs, masked prefixes, active state, expiration, and usage timestamps).
- **Headers**: `Authorization: Bearer <accessToken>`
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "user_id": "usr_7b9d4e21...",
    "email": "alex@example.com",
    "apiKeys": [
      {
        "_id": "673f2a1b9c...",
        "name": "Production AI Agent Key",
        "keyPrefix": "sk_live_9fa8...b7c8",
        "isActive": true,
        "createdAt": "2026-11-03T14:48:30.000Z",
        "lastUsedAt": "2026-11-03T14:49:12.000Z"
      }
    ]
  }
}
```

#### `GET /api/v1/auth/api-keys/:keyId`
Fetches a single API key document by its key ID.
- **Headers**: `Authorization: Bearer <accessToken>`

#### `PATCH /api/v1/auth/api-keys/:keyId`
Updates an API key's name or toggles its `isActive` status (e.g. enable or temporarily disable).
- **Headers**: `Authorization: Bearer <accessToken>`
- **Request Body**:
```json
{
  "name": "Updated Agent Key Name",
  "isActive": false
}
```

#### `DELETE /api/v1/auth/api-keys/:keyId`
Permanently revokes and deletes the API key.
- **Headers**: `Authorization: Bearer <accessToken>`

#### `POST /api/v1/auth/api-keys/validate` *(AI API Key Validation)*
Allows AI agents, microservices, or gateways to validate an API key together with the user's `userId` (or `user_id`) and `email`.
- **Request Body**:
```json
{
  "apiKey": "sk_live_9fa82b4c107e3d81b849204a11c8a14b09c2d3e4f5a6b7c8",
  "userId": "usr_7b9d4e2182a94f10",
  "email": "alex@example.com"
}
```
- **Success Response (200 OK)**:
```json
{
  "success": true,
  "valid": true,
  "message": "API key is valid and authorized.",
  "data": {
    "user_id": "usr_7b9d4e2182a94f10",
    "name": "Alex Rivera",
    "email": "alex@example.com",
    "phone_no": "+14155552671",
    "keyId": "673f2a1b9c...",
    "keyName": "Production AI Agent Key",
    "keyPrefix": "sk_live_9fa8...b7c8",
    "status": "ACTIVE"
  }
}
```
- **Error Responses**:
  - `400`: Missing `apiKey`, `email`, or `userId` / `user_id`.
  - `401`: `USER_MISMATCH` (User ID and email do not match).
  - `401`: `INVALID_API_KEY` (Key hash does not match user's keys).
  - `403`: `API_KEY_DEACTIVATED` (Key has been disabled).
  - `403`: `API_KEY_EXPIRED` (Key has passed its expiration date).

---

### 3. AI Middleware (`validateApiKey`)
For internal Express route protection, use the [apiKey.middleware.ts](file:///d:/hackthon/hack-vsak/backend/src/middleware/apiKey.middleware.ts) middleware:
```ts
import { validateApiKey } from './middleware/apiKey.middleware.js';

app.post('/api/v1/ai/generate', validateApiKey, (req, res) => {
  // Access validated user: req.apiKeyUser
  // Access validated key: req.apiKeyData
  res.json({ message: "Authorized by AI API Key validation" });
});
```
Callers supply:
- Header: `x-api-key: sk_live_...`
- Header: `x-user-id: usr_...`
- Header: `x-user-email: alex@example.com`

---

## 🛠️ Testing & Development
```bash
# Run unit & integration tests
pnpm test

# Run TypeScript compilation check
pnpm typecheck

# Start local dev server with hot reload
pnpm dev
```
