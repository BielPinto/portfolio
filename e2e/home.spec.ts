import { expect, test } from '@playwright/test';

test('home loads', async ({ page }) => {
  const response = await page.goto('/');
  expect(response).not.toBeNull();
  expect(response!.ok()).toBe(true);
});
