import { test, expect } from '@playwright/test';

test('shows the admin shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Quakke Admin');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quakke Admin');
});
