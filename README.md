# Portfolio monorepo

React (Vite) frontend and Go API, with shared tooling at the repository root.

## Layout

| Path           | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| `apps/web`     | Frontend (`@portfolio/web`)                                         |
| `apps/api`     | Backend API (`@portfolio/api`)                                      |
| `infra/docker` | Docker Compose (Postgres + API + web estático)                      |
| `infra/k8s`    | Kubernetes (Kustomize): API + web + Ingress — [README](infra/k8s/README.md) |
| `docs/`        | Documentação transversal (ex.: [arquitetura](docs/ARCHITECTURE.md)) |

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

## Docker (Postgres + API + web)

From the **repository root**:

```bash
docker compose -f infra/docker/docker-compose.yml up --build
```

This starts Postgres, the API on [http://localhost:8080](http://localhost:8080), and the static frontend on [http://localhost:4173](http://localhost:4173).

**Build-time variable for the SPA:** the browser calls the API using the URL embedded at `pnpm build` time. Compose passes **`VITE_API_BASE_URL`** (default `http://localhost:8080`, matching the published API port). To change it, set the variable in your environment or copy [`infra/docker/.env.example`](infra/docker/.env.example) to `infra/docker/.env` and edit before `docker compose up --build`. If the front and API are served from the **same host** behind one reverse proxy, you can use an empty value and relative API paths instead.

With **`CORS_ORIGINS` unset**, the API allows any origin, which is enough for local cross-origin checks between `localhost:4173` and `localhost:8080`. For production, set **`CORS_ORIGINS`** on the API to your real site origin(s).

To run **only** Postgres (typical local dev with `pnpm dev`):

```bash
docker compose -f infra/docker/docker-compose.yml up postgres -d
```

## Kubernetes (local or cloud)

Base manifests live under [`infra/k8s`](infra/k8s). Use them with a local cluster (**kind**, **k3d**, minikube) and [ingress-nginx](https://kubernetes.github.io/ingress-nginx/), or adapt Ingress for **Amazon EKS** and the AWS Load Balancer Controller. Build API and web images from [`apps/api/Dockerfile`](apps/api/Dockerfile) and [`apps/web/Dockerfile`](apps/web/Dockerfile), set `DATABASE_URL` and optional `ADMIN_API_KEY` in a Secret, and apply with `kubectl apply -k infra/k8s` from the repo root.

Full steps, required variables, and an **AWS checklist** (ECR, EKS, RDS, CORS, optional S3 + CloudFront for the SPA) are in [`infra/k8s/README.md`](infra/k8s/README.md). See also [Kubernetes e deploy em cluster](docs/ARCHITECTURE.md#kubernetes-e-deploy-em-cluster) in the architecture doc.

## Formatting & commits

- `pnpm format` — Prettier (web and repo root files; Go is excluded in `.prettierignore`)
- [Conventional Commits](https://www.conventionalcommits.org/) enforced via commitlint + Husky on `commit-msg`

## Go / API module

The API module lives in [`apps/api`](apps/api). Run `go` commands from that directory (for example `cd apps/api && go test ./...`).

`apps/api/go.mod` sets `toolchain go1.25.8` so a **bootstrap** Go (for example 1.23.x) can use **`GOTOOLCHAIN=auto`** (the default since Go 1.21) to download and run the required toolchain. Dependencies such as Gin 1.12 need Go 1.25+.
