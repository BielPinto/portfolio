import { expect, test } from '@playwright/test';

/** Match app default copy (LanguageProvider respects navigator; empty storage in a fresh context). */
test.use({ locale: 'en-US' });

test('home loads and navigates to projects', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Gabriel Rocha/,
    }),
  ).toBeVisible();

  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('link', { name: 'Projects' })
    .click();

  await expect(page).toHaveURL(/\/projects$/);
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Engineering scalable systems with mathematical precision.',
    }),
  ).toBeVisible();
});
