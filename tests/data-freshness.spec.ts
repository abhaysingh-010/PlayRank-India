import { expect, test } from '@playwright/test';

test.describe('data freshness labels', () => {
  test('/rankings shows freshness labels for ranking, team, and player data', async ({ page }) => {
    await page.goto('/rankings');

    await expect(page.getByText(/Ranking Freshness:/i).first()).toBeVisible();
    await expect(page.getByText(/Team Freshness:/i).first()).toBeVisible();
    await expect(page.getByText(/Player Freshness:/i).first()).toBeVisible();
  });

  test('/rankings/teams shows ranking and team freshness labels', async ({ page }) => {
    await page.goto('/rankings/teams');

    await expect(page.getByText(/Ranking Freshness:/i).first()).toBeVisible();
    await expect(page.getByText(/Team Freshness:/i).first()).toBeVisible();
  });

  test('/rankings/players shows ranking and player freshness labels', async ({ page }) => {
    await page.goto('/rankings/players');

    await expect(page.getByText(/Ranking Freshness:/i).first()).toBeVisible();
    await expect(page.getByText(/Player Freshness:/i).first()).toBeVisible();
  });
});
