# End-to-end tests (Playwright)

This project uses [Playwright](https://playwright.dev/) to exercise the Vite dev app in a real browser. Specs assert **user-visible behavior** (navigation, theme, locale, contact form), not implementation details. Keep the suite small and high-value; add **unit** or **component** tests later (e.g. Vitest) for pure logic and isolated UI.

## Philosophy: E2E vs other tests

| Layer | Role here |
|-------|-----------|
| **E2E (Playwright)** | Critical flows that break on refactors: routing, shell navigation, theme/locale toggles, contact submit. Few specs, stable locators. |
| **Unit / component (future)** | Helpers, formatters, hooks, and complex components without spinning up the full app. Faster feedback for edge cases. |

E2E is slower and more brittle if overused; prefer accessibility-first selectors (`getByRole`, `getByLabel`) and only add `data-testid` where the DOM has no stable role or label.

## Prerequisites

Browsers are not bundled with `@playwright/test`. Install them once per machine (or CI image):

```bash
cd portifolio_web
npx playwright install
```

On Linux CI or headless servers you may need system dependencies:

```bash
npx playwright install --with-deps
```

## Running tests

From `portifolio_web/`:

| Command | Purpose |
|---------|---------|
| `npm run test:e2e` | Default run (HTML report locally; see `playwright-report/`). |
| `npm run test:e2e:ui` | Interactive UI mode for debugging. |
| `npm run test:e2e:headed` | Headed browser for watching interactions. |

By default, Playwright starts the dev server via `webServer` in `playwright.config.ts` (`npm run dev` on `127.0.0.1:5173`). You can reuse an already running dev server: same URL, non-CI, and `reuseExistingServer` will skip starting a second one.

## Environment variables

| Variable | Effect |
|----------|--------|
| `PLAYWRIGHT_BASE_URL` | If set, used as `baseURL` and **no** `webServer` is started — point at any reachable app (e.g. preview or staging). |
| `CI` | When truthy: `forbidOnly` enabled, **2 retries**, GitHub reporter + HTML report (no auto-open). Matches typical CI behavior. |

Example against a running server:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:5173 npm run test:e2e
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

## CI (e.g. GitLab)

There is no pipeline checked into this repo yet; when you add one, a typical job would:

1. Check out the repo and `cd portifolio_web`.
2. Run `npm ci`.
3. Run `npx playwright install --with-deps` (or cache browser binaries between runs).
4. Run `CI=true npm run test:e2e`.
5. Publish `playwright-report/` and/or JUnit output as job artifacts with `when: always` on failure so failures are debuggable.

Match `Node` to the version used locally so Playwright and Vite behave consistently.
