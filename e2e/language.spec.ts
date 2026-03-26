import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('language switch updates document lang and visible nav copy', async ({
  page,
}) => {
  await page.goto('/');

  await expect
    .poll(() => page.evaluate(() => document.documentElement.lang))
    .toBe('en');

  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', {
      name: 'Home',
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Language: EN' }).click();
  await page.getByRole('listbox', { name: 'Choose language' }).getByRole('option', { name: 'Português' }).click();

  await expect
    .poll(() => page.evaluate(() => document.documentElement.lang))
    .toBe('pt-BR');

  await expect(
    page
      .getByRole('navigation', { name: 'Navegação principal' })
      .getByRole('link', { name: 'Início' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Idioma: PT' }).click();
  await page.getByRole('listbox', { name: 'Escolher idioma' }).getByRole('option', { name: 'English' }).click();

  await expect
    .poll(() => page.evaluate(() => document.documentElement.lang))
    .toBe('en');

  await expect(
    page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', {
      name: 'Home',
    }),
  ).toBeVisible();
});
