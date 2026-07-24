import { test, expect } from '@playwright/test';

test('shows the studio shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Quakke Studio');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quakke Studio');
});
