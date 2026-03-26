# portifolio_backend

Go HTTP API for the portfolio project (contact submissions, health checks, and room for future admin/analytics).

## Architecture plan

Work on this service should follow the **portfolio backend API plan**: Gin, PostgreSQL, Docker, and **Clean Architecture** layering (handlers → services → repositories → database; configuration and migrations as described in that plan).

The plan defines, among other things:

- **Layout:** `cmd/api`, `internal/handlers`, `internal/services`, `internal/repositories`, `internal/models`, `internal/middleware`, optional `internal/ports`, `config`, `migrations`, `pkg`.
- **Endpoints:** `GET /health`, `POST /contact` (JSON body `name`, `email`, `message`).
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

Implementation prerequisites, `go.mod`, run commands, and `curl` examples will be documented here once the module and tooling are in place.
