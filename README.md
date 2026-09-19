# Finance Dashboard

A full-stack web app to view, filter, sort, and export financial transactions. You log in, see your balance/revenue/expenses/savings on a dashboard, and can search through a transaction table and download the results as a CSV.

## What it's made of (Tech Stack)

**Frontend (what the user sees):**
- React + TypeScript — builds the UI
- Vite — runs/builds the frontend fast
- MUI (Material UI) — used for dropdowns, dialogs, and some form fields
- Recharts — draws the income/expense chart
- Axios — sends requests to the backend

**Backend (the server / API):**
- Node.js + Express — handles requests, has all the API routes
- MongoDB (with Mongoose) — the database that stores users and transactions
- JWT (JSON Web Tokens) — used for login sessions (auth)
- bcryptjs — encrypts passwords before saving them

**Why this matters if someone asks:** the frontend never talks to the database directly. It always calls the backend API, and the backend is the only thing that talks to MongoDB. Login works by the backend giving the frontend a signed token (JWT) after a correct login, and the frontend sends that token back on every future request to prove who it is.

## Live Demo

- Frontend: https://ruchita-finance-dashboard.onrender.com
- Backend API: https://ruchita-finance-api.onrender.com/api
- Postman collection (Postman → Import → Link): https://raw.githubusercontent.com/ande-ruchita/finance-dashboard/main/postman/Finance-Dashboard-API.postman_collection.json
- Demo login: `test@test.com` / `test1234`

Note: the backend is on Render's free tier and sleeps when idle. The first request can take up to ~50 seconds.

## Project Structure

```
finance-dashboard/
├── client/    -> the React frontend app
└── server/    -> the Express backend/API
```

They are two separate apps that run independently and talk to each other over HTTP.

## Prerequisites

Before running this locally, you need:
- Node.js 20.19+ or 22+ installed
- A MongoDB database — either a free MongoDB Atlas cloud database, or MongoDB installed on your own machine

## How to Run It Locally

### Step 1 — Backend setup

```bash
cd server
npm install
```

Create a file called `.env` inside the `server` folder with this content:

```
PORT=5000
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<any random long text, this is used to sign login tokens>
CLIENT_URL=http://localhost:5173
```

Start the backend in development mode:

```bash
npm run dev
```

The backend will now be running at `http://localhost:5000`.

### Step 2 — Load sample data (optional but recommended)

This fills the database with 300 sample transactions so the dashboard isn't empty:

```bash
npm run seed
```

Run this from inside the `server` folder. It only adds transaction records — it does not create a login account (see next section for that).

### Step 3 — Frontend setup

Open a new terminal:

```bash
cd client
npm install
```

Create a file called `.env` inside the `client` folder:

```
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The frontend will now be running at `http://localhost:5173`.

## How to Log In

On the live site, use the demo login above. For a local setup there's no pre-made account, so create one:

1. Send a request to `POST http://localhost:5000/api/auth/register` with a body like:
   ```json
   { "email": "test@test.com", "password": "test1234" }
   ```
   (You can do this using Postman.)
2. Go to the login page at `http://localhost:5173` and log in with that same email and password.

## Features

- Login with email + password (JWT-based session)
- Dashboard showing Balance, Revenue, Expenses, and Savings
- A chart showing income vs expenses, switchable between Monthly / Weekly / Yearly
- A transaction table you can:
  - Search
  - Filter by category, status, user ID, amount range, and date range
  - Sort by column
  - Page through (pagination)
- Export the filtered transaction list as a CSV file, choosing which columns to include

## Known Limitations

Being upfront about what's intentionally not fully built:

- Sidebar links other than "Dashboard" (Wallet, Analytics, Personal, etc.) are there visually but don't lead anywhere yet — out of scope for this version.
- "Savings" on the dashboard currently just repeats the Balance number (Revenue − Expenses). There's no separate savings tracking built yet.
- Only transactions marked "Paid" count toward Balance, Revenue, Expenses, and the chart. "Pending" transactions are intentionally excluded, since they're not settled money yet — this is standard practice, not a bug.
- The header search bar (top right, next to the notification bell) is just visual for now, not wired up.
- Native filter dropdowns have been converted to MUI-styled versions to match the theme.

## If Someone Asks "How does login/auth work?"

Simple version: when you log in, the backend checks your email/password against the database, and if correct, it creates a signed token (JWT) and sends it back. The frontend stores that token and attaches it to every future request in a header (`Authorization: Bearer <token>`). The backend checks that token on every protected route before doing anything. No token or an invalid/expired token = rejected with a 401 error.

## If Someone Asks "How does CSV export work?"

The frontend sends the backend a list of column names you picked, plus whatever filters are currently active on the table (same filters as the ones used for searching). The backend runs the same filter logic, builds a CSV string with proper headers and escaping (so commas/quotes inside values don't break the file), and sends it back as a downloadable file.