# End-to-end tests (Playwright)

This project uses [Playwright](https://playwright.dev/) to exercise the Vite dev app in a real browser. Specs assert **user-visible behavior** (navigation, theme, locale, contact form), not implementation details. **Unit and component tests** run separately with [Vitest](https://vitest.dev/) (see below).

## Unit and component tests (Vitest)

| Command                                   | Where         | Purpose                                                              |
| ----------------------------------------- | ------------- | -------------------------------------------------------------------- |
| `pnpm test`                               | Monorepo root | Runs `turbo test`: Vitest in `apps/web` and `go test` in `apps/api`. |
| `pnpm --filter @portfolio/web test`       | `apps/web`    | `vitest run` only.                                                   |
| `pnpm --filter @portfolio/web test:watch` | `apps/web`    | Watch mode while developing.                                         |

Tests live under `apps/web/src/**/*.test.ts(x)` with `jsdom` and [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/). Setup: `src/test/setup.ts` (jest-dom matchers).

## Philosophy: E2E vs other tests

| Layer                         | Role here                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **E2E (Playwright)**          | Critical flows that break on refactors: routing, shell navigation, theme/locale toggles, contact submit. Few specs, stable locators. |
| **Unit / component (Vitest)** | Helpers, API client helpers, hooks, and isolated UI. Faster feedback for edge cases.                                                 |

E2E is slower and more brittle if overused; prefer accessibility-first selectors (`getByRole`, `getByLabel`) and only add `data-testid` where the DOM has no stable role or label.

## Prerequisites

Browsers are not bundled with `@playwright/test`. Install them once per machine (or CI image):

```bash
cd apps/web
npx playwright install
```

On Linux CI or headless servers you may need system dependencies:

```bash
npx playwright install --with-deps
```

## Running E2E tests

From `apps/web/` (or use `pnpm --filter @portfolio/web` from the monorepo root):

| Command                    | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `pnpm run test:e2e`        | Default run (HTML report locally; see `playwright-report/`). |
| `pnpm run test:e2e:ui`     | Interactive UI mode for debugging.                           |
| `pnpm run test:e2e:headed` | Headed browser for watching interactions.                    |

From the **monorepo root**, `pnpm test:e2e` runs Playwright for `@portfolio/web` only (via Turbo).

By default, Playwright starts the dev server via `webServer` in `playwright.config.ts` (`pnpm run dev` on `127.0.0.1:5173`). You can reuse an already running dev server: same URL, non-CI, and `reuseExistingServer` will skip starting a second one.

## Environment variables

| Variable              | Effect                                                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `PLAYWRIGHT_BASE_URL` | If set, used as `baseURL` and **no** `webServer` is started — point at any reachable app (e.g. preview or staging).          |
| `CI`                  | When truthy: `forbidOnly` enabled, **2 retries**, GitHub reporter + HTML report (no auto-open). Matches typical CI behavior. |

Example against a running server:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 pnpm run test:e2e
```

## Configuration summary (`playwright.config.ts`)

- **Test directory**: `e2e/`.
- **Default origin**: `http://127.0.0.1:5173` (Vite default).
- **Timeouts**: test 30s; expect 10s.
- **Artifacts**: trace on first retry; screenshot on failure; video retained on failure.
- **Projects**: Chromium (Desktop Chrome) for now; more browsers or viewports can be added later.

## What is covered

Specs include smoke navigation, deep links, theme toggle, language switch (EN/PT), and the contact form (happy path and validation). See files under `e2e/*.spec.ts` for the current matrix.

## Production and deep links

The dev server serves the SPA without extra static server config. In **production**, the host must serve `index.html` for client-side routes (history API fallback) so direct loads and refreshes on `/contact`, etc. work. E2E against Vite does not replace verifying that server configuration.

## CI (GitHub Actions)

The workflow at `.github/workflows/ci.yml` runs **lint**, **Vitest** (`turbo` `test` for `@portfolio/web`), and **build** for the web app. **Playwright** is not run in CI by default (install browsers with `pnpm exec playwright install --with-deps` and add a job if you want E2E on every push).

For the API, the same workflow runs `go vet`, `go test ./...`, and `go build`, plus a separate **`api-integration`** job that runs `go test -tags=integration ./...` (requires Docker on the runner for Testcontainers). See [`apps/api/README.md`](../../api/README.md#tests).
