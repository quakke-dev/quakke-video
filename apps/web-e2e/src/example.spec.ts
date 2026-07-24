import { test, expect } from '@playwright/test';

test('shows the product shell', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Quakke Video');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Quakke Video');
});
