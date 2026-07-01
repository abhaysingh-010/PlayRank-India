import { expect, test } from '@playwright/test';

test.describe('methodology public trust page', () => {
  test('explains ranking methodology, data freshness, and limitations', async ({ page }) => {
    const response = await page.goto('/methodology');

    expect(response, '/methodology should return a response').not.toBeNull();
    expect(response!.status(), '/methodology should return 200').toBe(200);

    await expect(
      page.getByRole('heading', {
        name: /How PlayRank India evaluates esports performance/i,
      })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'What the PlayRank score means' })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Ranking signals' })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Data sources used' })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Data freshness' })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Important limitations' })
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: 'Safety rule for imported data' })
    ).toBeVisible();

    await expect(
      page.getByText('PlayRank rankings are analytical indicators')
    ).toBeVisible();

    await expect(
      page.getByText(
        'Imported match data is not automatically treated as trusted PlayRank core data'
      )
    ).toBeVisible();
  });

  test('methodology page is discoverable from public navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/');

    await expect(page.locator('a[href="/methodology"]').first()).toBeVisible();

    await page.locator('a[href="/methodology"]').first().click();

    await expect(page).toHaveURL(/\/methodology$/);
    await expect(page.getByText('PlayRank methodology')).toBeVisible();
  });
});
