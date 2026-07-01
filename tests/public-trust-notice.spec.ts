import { expect, test } from '@playwright/test';

test.describe('public database trust notices', () => {
  test('/teams explains team data trust limits', async ({ page }) => {
    await page.goto('/teams');

    await expect(page.getByRole('heading', { name: 'Team records are source-attributed intelligence' })).toBeVisible();
    await expect(page.getByText('Team records are not official tournament standings')).toBeVisible();
    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();
    await expect(page.locator('a[href="/data"]').first()).toBeVisible();
  });

  test('/players explains player data trust limits', async ({ page }) => {
    await page.goto('/players');

    await expect(page.getByRole('heading', { name: 'Player records are analytical and sample-size aware' })).toBeVisible();
    await expect(page.getByText('Player records are not predictions')).toBeVisible();
    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();
    await expect(page.locator('a[href="/data"]').first()).toBeVisible();
  });

  test('/matches explains match data trust limits', async ({ page }) => {
    await page.goto('/matches');

    await expect(page.getByRole('heading', { name: 'Match records separate source data from PlayRank analysis' })).toBeVisible();
    await expect(page.getByText('A match record is only as complete as its source')).toBeVisible();
    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();
    await expect(page.locator('a[href="/data"]').first()).toBeVisible();
  });

  test('/tournaments explains tournament data trust limits', async ({ page }) => {
    await page.goto('/tournaments');

    await expect(page.getByRole('heading', { name: 'Tournament records track coverage, not authority' })).toBeVisible();
    await expect(page.getByText('Tournament records are not official rulebooks')).toBeVisible();
    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();
    await expect(page.locator('a[href="/data"]').first()).toBeVisible();
  });
});
