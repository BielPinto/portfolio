import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test.describe('routes and navigation', () => {
  test('deep-linked contact shows headline', async ({ page }) => {
    await page.goto('/contact');
    await expect(page).toHaveURL(/\/contact$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: "Let's build something significant.",
      }),
    ).toBeVisible();
  });

  test('each main route shows expected primary heading', async ({ page }) => {
    const cases: Array<{ path: string; name: string | RegExp }> = [
      { path: '/', name: 'Gabriel Rocha' },
      {
        path: '/projects',
        name: 'Engineering scalable systems with mathematical precision.',
      },
      { path: '/about', name: 'Gabriel Rocha' },
      {
        path: '/blog',
        name: 'Ideas on systems, tooling, and craft.',
      },
      {
        path: '/contact',
        name: "Let's build something significant.",
      },
    ];

    for (const { path, name } of cases) {
      await page.goto(path);
      await expect(page).toHaveURL(
        path === '/' ? /\/$/ : new RegExp(`${path}$`),
      );
      await expect(
        page.getByRole('heading', { level: 1, name }),
      ).toBeVisible();
    }
  });

  test('header links visit all main routes', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main navigation' });

    await nav.getByRole('link', { name: 'Projects' }).click();
    await expect(page).toHaveURL(/\/projects$/);

    await nav.getByRole('link', { name: 'About' }).click();
    await expect(page).toHaveURL(/\/about$/);

    await nav.getByRole('link', { name: 'Blog' }).click();
    await expect(page).toHaveURL(/\/blog$/);

    await nav.getByRole('link', { name: 'Contact' }).click();
    await expect(page).toHaveURL(/\/contact$/);

    await nav.getByRole('link', { name: 'Home' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('footer social links open in a new tab', async ({ page }) => {
    await page.goto('/');
    const footer = page.getByRole('contentinfo');

    for (const name of ['GitHub', 'LinkedIn', 'Source Code'] as const) {
      const link = footer.getByRole('link', { name });
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });
});
