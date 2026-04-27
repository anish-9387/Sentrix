# Sentrix

Sentrix is a full-stack RBAC and security monitoring platform built with a TypeScript backend (Express + MySQL) and a React frontend (Vite + Tailwind + React Query).

It is designed for security-focused administration workflows: user and role management, authentication monitoring, audit trails, alerts, IP blocking, and operational dashboards.

## Key Features

- JWT authentication with refresh token flow and active session tracking
- Role-based access control (RBAC) with granular permission checks
- User management: create, update, block/unblock, delete, role assignment
- Security monitoring: login logs, audit logs, security alerts, blocked IPs
- Admin dashboard with live security and activity metrics
- Per-user login history export to Excel (`.xlsx`) for reporting

## Tech Stack

### Backend

- Node.js + TypeScript
- Express
- MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Password hashing (`bcrypt`)
- Security middleware (`helmet`, rate limiting)
- Excel export (`xlsx`)

### Frontend

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router
- Zustand
- Axios
- Framer Motion

## Project Structure

```text
Sentrix/
	backend/      # Express API, RBAC, DB models, auth/security logic
	frontend/     # React admin panel and monitoring UI
	README.md
```

## Prerequisites

- Node.js 18+
- pnpm 8+
- MySQL 8+

## Quick Start (Development)

### 1. Backend setup

```bash
cd backend
pnpm install
```

Create an environment file from the template:

- Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

- macOS/Linux:

```bash
cp .env.example .env
```

Edit `.env` values for your local MySQL instance, then initialize DB schema:

```bash
pnpm run db:setup
```

Optional: seed additional dummy data for testing:

```bash
pnpm run db:seed
```

Run backend in development mode:

```bash
pnpm run dev
```

Backend default URL: `http://localhost:5000`

### 2. Frontend setup

```bash
cd frontend
pnpm install
pnpm run dev
```

Frontend default URL: `http://localhost:5173`

The Vite dev server proxies `/api` to `http://localhost:5000`.

## Environment Variables

### Backend (`backend/.env`)

Copy from `backend/.env.example` and configure at least:

- `NODE_ENV`
- `PORT`
- `API_PREFIX`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `CORS_ORIGIN`

Security-related knobs also available:

- `MAX_LOGIN_ATTEMPTS`
- `LOCK_TIME_MINUTES`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`
- `ENABLE_REQUEST_LOGGING`

### Frontend (optional)

If needed, set:

- `VITE_API_URL` (defaults to `/api/v1`)

## API Overview

Base prefix: `/api/v1`

### Health

- `GET /health`

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth/my-activity`

### Users

- `GET /users`
- `GET /users/search?q=<term>`
- `GET /users/:id`
- `POST /users`
- `PUT /users/:id`
- `PATCH /users/:id/status`
- `DELETE /users/:id`
- `POST /users/:id/roles`
- `DELETE /users/:id/roles`
- `GET /users/:id/login-history/export` (Excel export)

### Roles and Permissions

- `GET /roles`
- `GET /roles/permissions`
- `GET /roles/:id`
- `POST /roles`
- `PUT /roles/:id`
- `DELETE /roles/:id`
- `POST /roles/:id/permissions`
- `DELETE /roles/:id/permissions`

### Security

- `GET /security/dashboard/stats`
- `GET /security/logs/login`
	- optional filter: `status=success|failed|blocked`
- `GET /security/logs/audit`
- `GET /security/alerts`
- `GET /security/alerts/unresolved`
- `PUT /security/alerts/:id/resolve`
- `GET /security/ips/blocked`
- `POST /security/ips/block`
- `POST /security/ips/unblock`
- `GET /security/sessions/active`

Most routes require authentication and proper RBAC permissions.

## Frontend Pages

- `/login`
- `/dashboard`
- `/users`
- `/roles`
- `/alerts`
- `/login-logs`
- `/audit-logs`
- `/security`

## Reporting Workflow (Per-user Excel Export)

From the Users page, each user row includes an `Export Excel` action.

This downloads an `.xlsx` file containing that user's login history, including status, IP, location, browser/OS, and timestamp fields.


### MySQL connection issues

- Verify `.env` DB values (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
- Ensure MySQL service is running before backend startup.


## License
MIT