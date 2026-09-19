# API Documentation

Base URL (local): `http://localhost:5000/api`
Base URL (production): `https://ruchita-finance-api.onrender.com/api`

The curl examples below use the local URL. To try the live API, replace `http://localhost:5000/api` with the production base URL.

## Authentication

Two endpoints (`/auth/register`, `/auth/login`) are public. Every other endpoint requires a JWT.

Send the token on every protected request as a header:

```
Authorization: Bearer <token>
```

Tokens are issued on login and expire after **1 day**.

---

## 1. Register

Creates a new user account.

- **Method:** `POST`
- **Path:** `/auth/register`
- **Auth required:** No

**Request body:**
```json
{
  "email": "test@test.com",
  "password": "test1234"
}
```

**Success response — `201 Created`:**
```json
{
  "message": "User created",
  "userId": "665f1c2e8a1b2c3d4e5f6789"
}
```

**Error responses:**

| Status | Body | When it happens |
|---|---|---|
| 400 | `{ "message": "User already exists" }` | Email is already registered |
| 500 | `{ "message": "Server error", "error": "<details>" }` | Unexpected server/database error |

**curl example:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'
```

---

## 2. Login

Logs a user in and returns a JWT.

- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth required:** No

**Request body:**
```json
{
  "email": "test@test.com",
  "password": "test1234"
}
```

**Success response — `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "665f1c2e8a1b2c3d4e5f6789",
    "email": "test@test.com"
  }
}
```

**Error responses:**

| Status | Body | When it happens |
|---|---|---|
| 400 | `{ "message": "Invalid credentials" }` | Email not found, OR password doesn't match (same message for both, on purpose — doesn't reveal which one was wrong) |
| 500 | `{ "message": "Server error", "error": "<details>" }` | Unexpected server/database error |

**curl example:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234"}'
```

---

## 3. Get Transactions

Returns a filtered, sorted, paginated list of transactions.

- **Method:** `GET`
- **Path:** `/transactions`
- **Auth required:** Yes

**Query parameters (all optional):**

| Param | Type | Description |
|---|---|---|
| `search` | string | Matches against user_id, category, status, id, amount, or date |
| `category` | string | `Revenue` or `Expense` |
| `status` | string | `Paid` or `Pending` |
| `user_id` | string | Partial match, case-insensitive |
| `minAmount` | number | Minimum transaction amount |
| `maxAmount` | number | Maximum transaction amount |
| `startDate` | date (`YYYY-MM-DD`) | Only transactions on/after this date |
| `endDate` | date (`YYYY-MM-DD`) | Only transactions on/before this date |
| `sortBy` | string | Field to sort by (e.g. `date`, `amount`). Default: `date` |
| `order` | string | `asc` or `desc`. Default: `desc` |
| `page` | number | Page number. Default: `1` |
| `limit` | number | Results per page. Default: `10` |

**Success response — `200 OK`:**
```json
{
  "data": [
    {
      "id": 1,
      "date": "2024-01-15T08:34:12.000Z",
      "amount": 1500,
      "category": "Revenue",
      "status": "Paid",
      "user_id": "user_001",
      "user_profile": "https://..."
    }
  ],
  "total": 300,
  "page": 1,
  "totalPages": 30
}
```

**Error responses:**

| Status | Body | When it happens |
|---|---|---|
| 401 | `{ "message": "No token provided" }` | Missing/malformed Authorization header |
| 401 | `{ "message": "Invalid or expired token" }` | Bad or expired JWT |
| 500 | `{ "message": "Server error", "error": "<details>" }` | Unexpected server/database error |

**curl example:**
```bash
curl "http://localhost:5000/api/transactions?category=Revenue&status=Paid&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

---

## 4. Get Summary

Returns aggregated totals for the dashboard stat cards. Only counts transactions with `status: "Paid"` — Pending transactions are excluded since they aren't settled money yet.

- **Method:** `GET`
- **Path:** `/transactions/summary`
- **Auth required:** Yes

**Query parameters:** None

**Success response — `200 OK`:**
```json
{
  "balance": 133198,
  "revenue": 339803,
  "expenses": 206605,
  "savings": 133198
}
```

Note: `savings` currently equals `balance` (Revenue − Expenses). There's no separate savings-tracking logic yet — documented as a known limitation.

**Error responses:**

| Status | Body | When it happens |
|---|---|---|
| 401 | `{ "message": "No token provided" }` | Missing/malformed Authorization header |
| 401 | `{ "message": "Invalid or expired token" }` | Bad or expired JWT |
| 500 | `{ "message": "Server error", "error": "<details>" }` | Unexpected server/database error |

**curl example:**
```bash
curl http://localhost:5000/api/transactions/summary \
  -H "Authorization: Bearer <token>"
```

---

## 5. Export Transactions (CSV)

Generates a CSV file of transactions, using the same filters as Get Transactions, with a configurable set of columns.

- **Method:** `POST`
- **Path:** `/transactions/export`
- **Auth required:** Yes

**Request body:**
```json
{
  "columns": ["id", "date", "amount", "category", "status", "user_id"],
  "filters": {
    "category": "Revenue",
    "status": "Paid"
  },
  "sortBy": "date",
  "order": "desc"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `columns` | string[] | Yes | Which fields to include as CSV columns, in order |
| `filters` | object | No | Same filter fields as Get Transactions (category, status, user_id, minAmount, maxAmount, startDate, endDate, search) |
| `sortBy` | string | No | Default: `date` |
| `order` | string | No | Default: `desc` |

**Success response — `200 OK`:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="transactions.csv"`
- Body is raw CSV text, e.g.:
```
"id","date","amount","category","status","user_id"
"1","2024-01-15T08:34:12.000Z","1500","Revenue","Paid","user_001"
```

**Error responses:**

| Status | Body | When it happens |
|---|---|---|
| 400 | `{ "message": "Columns required for export" }` | `columns` missing, not an array, or empty |
| 401 | `{ "message": "No token provided" }` | Missing/malformed Authorization header |
| 401 | `{ "message": "Invalid or expired token" }` | Bad or expired JWT |
| 500 | `{ "message": "Server error", "error": "<details>" }` | Unexpected server/database error |

**curl example:**
```bash
curl -X POST http://localhost:5000/api/transactions/export \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"columns":["id","date","amount","category","status","user_id"]}' \
  -o transactions.csv
```