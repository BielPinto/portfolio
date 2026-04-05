# Portfolio monorepo

React (Vite) frontend and Go API, with shared tooling at the repository root.

## Layout

| Path | Description |
|------|-------------|
| `apps/web` | Frontend (`@portfolio/web`) |
| `apps/api` | Backend API (`@portfolio/api`) |
| `infra/docker` | Docker Compose (Postgres + API) |

History from the former separate frontend and backend repos was merged with `git subtree` into `apps/web` and `apps/api`.

## Prerequisites

- [pnpm](https://pnpm.io/) 9.x (`packageManager` in root `package.json`; use `corepack enable` if needed)
- [Go](https://go.dev/) 1.25+ (see `apps/api/go.mod`)
- Docker (optional, for Compose)

## Install

```bash
pnpm install
```

## Development

The API needs **PostgreSQL** reachable at the URL in `apps/api/.env` (see `apps/api/.env.example`). The app loads `.env` from `apps/api` on startup.

**Typical flow (DB in Docker, API + web on the host):**

```bash
# From repo root — starts only Postgres, exposes localhost:5432
docker compose -f infra/docker/docker-compose.yml up postgres -d

# In apps/api: copy .env.example → .env and set DATABASE_URL to:
# postgres://portifolio:portifolio@localhost:5432/portifolio?sslmode=disable

pnpm dev
```

Run API and web together (Turbo starts both):

```bash
pnpm dev
```

Or individually:

```bash
pnpm --filter @portfolio/api dev
pnpm --filter @portfolio/web dev
```

The web app proxies `/api` and `POST /contact` to `http://127.0.0.1:8080` by default (see `apps/web/vite.config.ts` and `VITE_API_PROXY_TARGET`).

## Build

```bash
pnpm build
```

## Lint & test

```bash
pnpm lint
pnpm test
```

Go integration tests (`//go:build integration`) are not run by default; use `go test -tags=integration ./...` from `apps/api` when Docker is available.

## Docker (API + Postgres)

From the **repository root**:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

## Formatting & commits

- `pnpm format` — Prettier (web and repo root files; Go is excluded in `.prettierignore`)
- [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint + Husky on `commit-msg`

## Go workspace

[`go.work`](go.work) includes `./apps/api` so you can run `go` commands from the repo root when needed.
