import { expect, test } from '@playwright/test';

/**
 * Optional cross-stack checks against the Go API. Set PLAYWRIGHT_API_URL (e.g. http://127.0.0.1:8080)
 * with the API running (e.g. docker compose) so these run; otherwise they skip.
 */
const apiBase = process.env.PLAYWRIGHT_API_URL?.replace(/\/$/, '') ?? '';

test.describe('portfolio API (optional)', () => {
  test('GET /health returns ok', async ({ request }) => {
    test.skip(!apiBase, 'Set PLAYWRIGHT_API_URL to run API E2E (e.g. http://127.0.0.1:8080)');

    const res = await request.get(`${apiBase}/health`);
    expect(res.ok(), await res.text()).toBeTruthy();

    const body = (await res.json()) as { status?: string; database?: string };
    expect(body.status).toBe('ok');
    expect(body.database).toBe('ok');
  });

  test('POST /contact creates a contact', async ({ request }) => {
    test.skip(!apiBase, 'Set PLAYWRIGHT_API_URL to run API E2E');

    const email = `e2e-api-${Date.now()}@example.com`;
    const res = await request.post(`${apiBase}/contact`, {
      data: {
        name: 'Playwright API',
        email,
        message: 'E2E contact from Playwright.',
      },
    });
    expect(res.status(), await res.text()).toBe(201);

    const body = (await res.json()) as { id?: string; created_at?: string };
    expect(body.id).toBeTruthy();
    expect(body.created_at).toBeTruthy();
  });
});
