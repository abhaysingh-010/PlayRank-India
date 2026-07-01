import { expect, test } from '@playwright/test';

test.describe('data freshness labels', () => {
  test('/rankings shows freshness labels for team and player ranking data', async ({ page }) => {
    await page.goto('/rankings');

    await expect(page.getByText(/Team Freshness:/i).first()).toBeVisible();
    await expect(page.getByText(/Player Freshness:/i).first()).toBeVisible();
  });

  test('/rankings/teams shows team freshness label', async ({ page }) => {
    await page.goto('/rankings/teams');

    await expect(page.getByText(/Team Freshness:/i).first()).toBeVisible();
  });

  test('/rankings/players shows player freshness label', async ({ page }) => {
    await page.goto('/rankings/players');

    await expect(page.getByText(/Player Freshness:/i).first()).toBeVisible();
  });
});
