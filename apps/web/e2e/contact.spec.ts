import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test.describe('contact form', () => {
  test('submits valid fields and shows success state', async ({ page }) => {
    await page.route('**/contact', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '00000000-0000-4000-8000-000000000001',
          created_at: new Date().toISOString(),
        }),
      });
    });

    await page.goto('/contact');

    await page.getByLabel('Full Name').fill('E2E User');
    await page.getByLabel('Email Address').fill('e2e@example.com');
    await page.getByLabel('Message').fill('Playwright contact flow.');

    await page.getByRole('button', { name: 'Send Message' }).click();

    await expect(page.getByRole('heading', { name: 'Message sent' })).toBeVisible();
    await expect(page.getByRole('status')).toContainText('24');
  });

  test('submitting empty form shows validation messages', async ({ page }) => {
    await page.goto('/contact');

    await page.getByRole('button', { name: 'Send Message' }).click();

    await expect(page.getByText('Please enter your name.')).toBeVisible();
    await expect(page.getByText('Email is required.')).toBeVisible();
    await expect(page.getByText('Please add a short message.')).toBeVisible();
  });
});
