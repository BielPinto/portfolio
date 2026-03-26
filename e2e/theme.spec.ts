import { expect, test } from '@playwright/test';

test.use({ locale: 'en-US' });

test('theme toggle adds and removes dark class on html', async ({ page }) => {
  await page.goto('/');

  const toggle = page.getByRole('button', {
    name: /Switch to (dark|light) mode/,
  });

  const isDark = () =>
    page.evaluate(() => document.documentElement.classList.contains('dark'));

  const before = await isDark();
  await toggle.click();
  await expect.poll(isDark).toBe(!before);
  await toggle.click();
  await expect.poll(isDark).toBe(before);
});
