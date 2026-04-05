# Portfolio monorepo

Monorepo for the portfolio project: React (Vite) web app and Go API.

## Layout

- `apps/web` — frontend
- `apps/api` — backend API

See each app’s README for app-specific setup.

## Development

From the repository root (after tooling is configured):

- `pnpm install` — install Node dependencies
- `pnpm dev` — run dev tasks (see root `package.json`)

API and database: see `infra/docker` or `apps/api` documentation.
