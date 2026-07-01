import { expect, test } from '@playwright/test';

test.describe('ranking explanation layer', () => {
  test('/rankings explains score, freshness, confidence, and methodology link', async ({ page }) => {
    await page.goto('/rankings');

    await expect(page.getByRole('heading', { name: 'How to read PlayRank rankings' })).toBeVisible();
    await expect(page.getByText('The score is a comparative strength indicator')).toBeVisible();
    await expect(page.getByText('Rankings are not betting tips, predictions, or official tournament standings.')).toBeVisible();
    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();
  });

  test('/rankings/teams explains team score and verified team layer', async ({ page }) => {
    await page.goto('/rankings/teams');

    await expect(page.getByRole('heading', { name: 'How to read team rankings' })).toBeVisible();
    await expect(page.getByText('A team score is a comparative performance signal')).toBeVisible();
    await expect(page.getByText('Official and verified team records carry stronger confidence')).toBeVisible();
    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();
  });

  test('/rankings/players explains player score and sample-size context', async ({ page }) => {
    await page.goto('/rankings/players');

    await expect(page.getByRole('heading', { name: 'How to read player rankings' })).toBeVisible();
    await expect(page.getByText('A player score is a comparative form and performance signal')).toBeVisible();
    await expect(page.getByText('Player rankings should be treated as directional')).toBeVisible();
    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();
  });
});
