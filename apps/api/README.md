# Portfolio API (`apps/api`)

Go HTTP API for the portfolio project (contact submissions, health checks, and room for future admin/analytics).
Golang + Testcontainers

**Docs:** [Requirements & architecture (PT)](docs/REQUIREMENTS_AND_ARCHITECTURE.md) · [EN](docs/REQUIREMENTS_AND_ARCHITECTURE.en.md) · [PostgreSQL / `psql` (PT)](docs/DATABASE.md)

## Prerequisites

- **Go** 1.25+ (see `go.mod`) for local runs without Docker.
- **Docker** and **Docker Compose** (`docker compose`) for the containerized stack (API + PostgreSQL).

## Configuration

Copy `.env.example` to `.env` and adjust values, or set the same variables in your shell or Compose file.

| Variable | Description |
| --- | --- |
| `PORT` | HTTP listen port (default: `8080`). |
| `DATABASE_URL` | Full Postgres URL. If unset, the URL is built from `DB_*` (see `config/config.go`). |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSLMODE` | Used only when `DATABASE_URL` is empty. |
| `LOG_LEVEL` | `debug`, `info`, `warn`, or `error` (default: `info`). |
| `RATE_LIMIT` | [ulule/limiter](https://github.com/ulule/limiter) rate string (e.g. `100-M`); empty, `0`, or `off` disables limiting. |
| `ADMIN_API_KEY` | Optional. If set, registers `/api/v1/admin/*` with auth (`X-Admin-Key` or `Authorization: Bearer`). Currently exposes `GET /api/v1/admin/status` as a smoke check; add list/stats routes here later. |
| `CORS_ORIGINS` | Comma-separated allowed browser origins for cross-origin calls (e.g. from [`apps/web`](../web/) with `VITE_API_BASE_URL`). Empty allows any origin. |

## Run with Docker Compose

From the **monorepo root** (`portfolio/`):

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

The API is exposed on **port 8080**. PostgreSQL 16 runs in a separate service with a named volume; the app waits until Postgres is healthy before starting.

- **Stop:** `docker compose -f infra/docker/docker-compose.yml down` (add `-v` to remove the Postgres volume).
- **Rebuild after code changes:** same `up --build` command.

The **Dockerfile** is multi-stage: a Go toolchain image builds a static binary (`CGO_ENABLED=0`, `-trimpath`, `-ldflags="-s -w"`), and the final image is **distroless** (`gcr.io/distroless/static-debian12:nonroot`) with a non-root user.

## Run locally (without Docker)

You need a reachable PostgreSQL instance and a database that matches your `DATABASE_URL` or `DB_*` settings. Migrations run on startup.

```bash
go run ./cmd/api
```

## API examples (`curl`)

Health (includes DB check when a pool is configured):

```bash
curl -sS http://127.0.0.1:8080/health
```

Versioned public routes live under **`/api/v1/public`** (e.g. `GET /api/v1/public/health`, `POST /api/v1/public/contact`).

Submit a contact message:

```bash
curl -sS -X POST http://127.0.0.1:8080/contact \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","message":"Hello from curl"}'
```

Successful responses return HTTP **201** with `id` and `created_at`.

If `ADMIN_API_KEY` is set, verify the admin namespace (expects the same key in the header):

```bash
curl -sS http://127.0.0.1:8080/api/v1/admin/status -H "X-Admin-Key: $ADMIN_API_KEY"
```

## Swagger (OpenAPI)

Interactive docs are served at **`/swagger/index.html`** (e.g. `http://127.0.0.1:8080/swagger/index.html`). The spec is generated from handler comments; after changing annotations, regenerate from `cmd/api` with:

```bash
go generate ./cmd/api
```

## Architecture plan

Work on this service should follow the **portfolio backend API plan**: Gin, PostgreSQL, Docker, and **Clean Architecture** layering (handlers → services → repositories → database; configuration and migrations as described in that plan).

The plan defines, among other things:

- **Layout:** `cmd/api`, `internal/handlers`, `internal/services`, `internal/repositories`, `internal/models`, `internal/middleware`, optional `internal/ports`, `config`, `migrations`, `pkg`.
- **Endpoints:** `GET /health`, `POST /contact` (JSON body `name`, `email`, `message`); versioned duplicates under `/api/v1/public/...`; optional admin group under `/api/v1/admin` when `ADMIN_API_KEY` is set.
- **Data:** `contacts` table (UUID, timestamps, validation limits aligned with the plan).
- **Cross-cutting:** structured logging (`slog`), request IDs, recovery, in-memory rate limiting by IP; CORS optional when the web app calls this API from the browser.
- **Docker:** multi-stage image and `docker-compose` with PostgreSQL.

### Where the full plan lives

The authoritative, detailed specification (diagrams, schema notes, future features, and implementation checklist) is the Cursor plan file:

**`backend_portfolio_go_api_e2be25f3.plan.md`**

It is typically stored under the Cursor project’s **`.cursor/plans/`** directory on the machine where the plan was created. This repository may not include a copy; if yours does not, obtain the latest version from the project owner or add an exported copy under `docs/` in this repo for portability.

### Contributor guidelines

1. **Read the plan** before adding routes, tables, or new packages so layers and naming stay consistent.
2. **Respect boundaries:** HTTP handlers bind JSON and map status codes; business rules and extra validation live in services; SQL only in repositories.
3. **Dependency injection:** construct dependencies in `cmd/api` (`config` → DB → repository → service → handler → router); avoid global DB or logger state.
4. **Extensibility:** prefer interfaces in `internal/ports` (e.g. event publisher, mailer, assistants) with NoOp implementations until real adapters are added.
