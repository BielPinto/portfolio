# Requirements, architecture, and access roles — `portifolio_backend`

**Portuguese version:** [REQUIREMENTS_AND_ARCHITECTURE.md](./REQUIREMENTS_AND_ARCHITECTURE.md)

This document is derived from the current Go HTTP service (Gin + PostgreSQL): functional and non-functional requirements, technical structure, and **how the [`portifolio_web`](../../portifolio_web/) front-end calls the API** (URLs and CORS).

---

## 1. Product overview

REST API for a portfolio site: **health checks** (including database connectivity) and **contact form submissions** persisted in PostgreSQL. An **optional admin namespace** is protected by an API key (no user accounts in the database). Interactive OpenAPI docs at `/swagger`.

---

## 2. Integration with `portifolio_web` (URLs and CORS)

The sibling repo **`portifolio_web`** (Vite + React) matches this API’s endpoints and `{ name, email, message }` JSON body. See [`portifolio_web/README.md`](../../portifolio_web/README.md), [`portifolio_web/src/config/api.ts`](../../portifolio_web/src/config/api.ts), [`portifolio_web/vite.config.ts`](../../portifolio_web/vite.config.ts).

### 2.1 Local development

| Component | Typical URL |
|-----------|-------------|
| Front (Vite) | `http://localhost:5173` (default `npm run dev` port) |
| Go API | `http://127.0.0.1:8080` (backend default `PORT`) |

- **Vite’s dev proxy** forwards to the API (`VITE_API_PROXY_TARGET`, default `http://127.0.0.1:8080`):
  - **`/api`** → backend (for paths under `/api` on the same origin as the dev server).
  - **`POST /contact`** → backend; **`GET` / `HEAD` on `/contact`** are **not** proxied (Vite serves the React page for the `/contact` route).
- With an empty **`VITE_API_BASE_URL`** (default), the contact form uses `fetch('/contact', …)` — same origin as the dev server — and Vite forwards only the **POST** to Go.
- The versioned route **`POST /api/v1/public/contact`** exists on the backend with the same contract; the front-end currently uses **`POST /contact`** (`CONTACT_SUBMIT_PATH`).

### 2.2 Production — different origins

Example: static site on Vercel, API on another domain.

1. Build the front-end with **`VITE_API_BASE_URL`** set to the public API base URL **without a trailing slash** (e.g. `https://api.example.com`).
2. On the backend, set **`CORS_ORIGINS`** to the **exact browser origin(s)** of the site (scheme + host + port if any), comma-separated for multiple values — e.g. `https://www.example.com,https://example.com`.
3. The contact `fetch` uses **`POST`**, **`Content-Type: application/json`**, and a JSON body; that matches the current Gin CORS settings (`AllowMethods`: `GET`, `POST`, `OPTIONS`; `AllowHeaders`: `Origin`, `Content-Type`, `Accept`).

If **`CORS_ORIGINS` is empty**, the server allows **any origin** (`AllowAllOrigins`), which is convenient for local work; for a public production API, prefer restricting origins to your front-end URLs.

### 2.3 Production — same origin (reverse proxy)

If the SPA and the API are served under the **same host** (e.g. nginx in front of both), **`VITE_API_BASE_URL`** can stay empty and the browser uses relative paths — **no extra CORS requirement** for that flow.

### 2.4 E2E tests against the API

Playwright specs can hit the API directly when **`PLAYWRIGHT_API_URL`** is set (e.g. `http://127.0.0.1:8080`): `GET /health`, `POST /contact`. See [`portifolio_web/e2e/api.spec.ts`](../../portifolio_web/e2e/api.spec.ts).

---

## 3. User types (actors)

The backend **does not implement end-user accounts** (no `users` table, no visitor login or JWT). Actors are:

| Actor | Description | Authentication | Typical use |
|-------|-------------|----------------|-------------|
| **Visitor / public client** | Site user submitting the contact form | None | `GET` health, `POST` contact |
| **Operator / admin integration** | Internal tools, scripts, or future dashboards | Static `ADMIN_API_KEY` (`X-Admin-Key` or `Authorization: Bearer`) | `GET /api/v1/admin/*` (today only `status`) |
| **Infrastructure** | Load balancers, orchestrators, monitoring | None (network only) | `GET` health for probes |

**Note:** “Admin” is a **shared secret** in configuration, not a multi-user role with per-identity audit.

---

## 4. Functional requirements

### 4.1 Service health

| ID | Requirement |
|----|-------------|
| RF-01 | Expose health at `GET /health` and `GET /api/v1/public/health`. |
| RF-02 | Response includes `status`, `version`, and when a DB pool exists, connectivity (`database`: `ok` or unavailable). |
| RF-03 | If PostgreSQL ping fails within the timeout, return **503** with a body indicating unavailability. |

### 4.2 Contact (form)

| ID | Requirement |
|----|-------------|
| RF-04 | Accept contact submission at `POST /contact` and `POST /api/v1/public/contact` with JSON body: `name`, `email`, `message`. |
| RF-05 | Required fields and limits: name and message max lengths aligned with the model (name up to 255 runes, email up to 320 characters, message up to 10000 runes); email must be valid and a bare address (no display name). |
| RF-06 | On success, respond **201** with `id` (UUID) and `created_at`. |
| RF-07 | On validation failure, respond **400** with structured error (`validation_error` / per-field `details` when applicable). |
| RF-08 | Persist each submission in the `contacts` table (PostgreSQL), with `id` from `pgcrypto` / `gen_random_uuid()` in the migration. |
| RF-09 | After persistence, the use case may publish `ContactCreated` via `EventPublisher` (current implementation: no-op; ready for queue/email/etc.). |

### 4.3 Administration (optional)

| ID | Requirement |
|----|-------------|
| RF-10 | If `ADMIN_API_KEY` is set, register `/api/v1/admin` with key-based middleware. |
| RF-11 | With a valid key in `X-Admin-Key` or `Authorization: Bearer <key>`, `GET /api/v1/admin/status` returns **200** with `{"status":"ok"}`. |
| RF-12 | Missing or invalid key → **401** on admin routes. |
| RF-13 | If `ADMIN_API_KEY` is empty, the admin group is **not** registered. |

### 4.4 API documentation

| ID | Requirement |
|----|-------------|
| RF-14 | Serve Swagger at `/swagger/index.html` from handler annotations. |

### 4.5 Route compatibility

| ID | Requirement |
|----|-------------|
| RF-15 | Keep root “legacy” routes (`/health`, `/contact`) alongside versioned `/api/v1/public/...` with the same behavior. |

---

## 5. Non-functional requirements

### 5.1 Reliability and data

| ID | Requirement |
|----|-------------|
| RNF-01 | PostgreSQL as source of truth; `pgxpool` connection pool. |
| RNF-02 | Apply embedded SQL migrations in lexicographic order on startup. |
| RNF-03 | Graceful HTTP shutdown on `SIGINT`/`SIGTERM` (shutdown timeout in code). |

### 5.2 Performance and protection

| ID | Requirement |
|----|-------------|
| RNF-04 | In-memory per-IP rate limiting ([ulule/limiter](https://github.com/ulule/limiter) format) via `RATE_LIMIT`; disable with empty, `0`, `off`, or `false`. |
| RNF-05 | `GET` requests to paths ending in `/health` are **not** counted toward the rate limit (probe traffic). |
| RNF-06 | Default limit when unset: `100-M` (100 requests per minute per IP) per `config.Load()`. |

### 5.3 Security

| ID | Requirement |
|----|-------------|
| RNF-07 | Admin key compared with `subtle.ConstantTimeCompare` to reduce timing leakage. |
| RNF-08 | CORS: methods `GET`, `POST`, `OPTIONS`; headers `Origin`, `Content-Type`, `Accept`; `AllowCredentials: false`. Allowed origins from `CORS_ORIGINS` (comma-separated); if empty, any origin is allowed. For **`portifolio_web`** on a different domain than the API, list the exact front-end origin(s) in `CORS_ORIGINS` (see **§2.2**). |
| RNF-09 | Final Docker image **distroless**, non-root user; static binary (`CGO_ENABLED=0`). |

### 5.4 Observability

| ID | Requirement |
|----|-------------|
| RNF-10 | Structured logging with `slog`; level from `LOG_LEVEL` (debug, info, warn, error). |
| RNF-11 | Request ID middleware; one log line per request (method, path, status, duration, `request_id`). |
| RNF-12 | Panic recovery middleware with a generic internal error response. |

### 5.5 Errors and HTTP contracts

| ID | Requirement |
|----|-------------|
| RNF-13 | Validation/binding errors return JSON (`error`, `message`, optional `details`). |
| RNF-14 | Internal errors do not expose sensitive details (`internal_error` / generic message). |
| RNF-15 | Rate limit exceeded: **429**; limiter store failure: **500**. |

### 5.6 Configuration and deployment

| ID | Requirement |
|----|-------------|
| RNF-16 | Environment variables: `PORT`, `DATABASE_URL` or `DB_*`, `LOG_LEVEL`, `RATE_LIMIT`, `ADMIN_API_KEY`, `CORS_ORIGINS`. |
| RNF-17 | `docker-compose` runs PostgreSQL 16 with a healthcheck; the API waits for a healthy database. |
| RNF-18 | HTTP server read header timeout: 10s; health DB ping timeout: 2s. |

### 5.7 Quality and extensibility

| ID | Requirement |
|----|-------------|
| RNF-19 | Layered architecture (handlers → services → repositories) with dependency injection in `main`. |
| RNF-20 | `internal/ports` for events, mail, assistant, geo — no-op implementations until real adapters exist. |
| RNF-21 | Integration tests (build tag `integration`) with Postgres via Testcontainers (health, contact, admin). |

### 5.8 Stack (reference)

- **Go** 1.25+ (`go.mod`), **Gin**, **pgx/v5**, **validator/v10**, **swag**, **gin-cors**, **ulule/limiter**.

---

## 6. Architecture

### 6.1 Style and layers

The project follows **Clean Architecture** separation:

```
┌─────────────────────────────────────────────────────────────┐
│  cmd/api/main.go — composition: config, DB, migrate, DI, HTTP │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ internal/     │    │ internal/       │    │ internal/        │
│ handlers      │───▶│ services        │───▶│ repositories     │
│ (HTTP, bind)  │    │ (validation,    │    │ (SQL PostgreSQL) │
│               │    │  orchestration) │    │                  │
└───────────────┘    └────────┬────────┘    └────────┬─────────┘
        │                     │                      │
        │                     ▼                      ▼
        │            ┌─────────────────┐    ┌──────────────────┐
        │            │ internal/ports  │    │ PostgreSQL       │
        │            │ (interfaces)    │    │ (contacts)       │
        │            └─────────────────┘    └──────────────────┘
        ▼
┌───────────────┐
│ middleware    │  request id, recovery, log, CORS, rate limit, admin key
└───────────────┘
```

- **Handlers:** JSON binding, status codes, validation error mapping.
- **Services:** business rules and contact domain validation; events via interfaces.
- **Repositories:** data access only (`INSERT` into `contacts`).
- **Ports:** contracts for future integrations (queue, email, LLM, geolocation).

### 6.2 Data

- **`contacts` table**: `id` (UUID PK), `name`, `email` (VARCHAR 320), `message`, `created_at` (TIMESTAMPTZ).
- Index `idx_contacts_created_at` for time-ordered queries (descending).

### 6.3 Main flow — contact submission

1. Client sends `POST` with JSON.
2. Handler runs basic binding (Gin/validator).
3. Service trims input, validates email with `net/mail` and length limits.
4. Repository runs `INSERT ... RETURNING id, created_at`.
5. Service calls `EventPublisher.PublishContactCreated` (no-op today).
6. Response **201** with `id` and `created_at`.

### 6.4 Deployment (high level)

- **API:** multi-stage build → minimal distroless image.
- **Database:** PostgreSQL 16 (local Compose); single `DATABASE_URL` in typical production.

### 6.5 View with the front-end

In development, the **browser** only talks to the Vite origin; the **dev server** forwards `POST /contact` (and `/api`) to Go. In cross-origin production, the **browser** calls the URL in `VITE_API_BASE_URL`, subject to backend **CORS** (**§2**).

---

## 7. Future scope (implicit in code/README)

- Additional admin routes (contact listing/stats).
- Replace `NoOpEventPublisher` with a queue or webhooks.
- Real adapters for mailer, assistant, and geo in `internal/ports`.

This document reflects the **current repository state**; update it when the code changes.
