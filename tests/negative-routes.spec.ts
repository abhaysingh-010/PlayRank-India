import { expect, test } from '@playwright/test';

test.describe('negative route regression tests', () => {
  test('unknown public route returns 404 safely', async ({ page }) => {
    const response = await page.goto('/not-a-real-public-page');

    expect(response).not.toBeNull();
    expect(response!.status()).toBe(404);

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Internal Server Error');
    expect(bodyText).not.toContain('Unhandled Runtime Error');
  });

  test('unknown team detail route shows safe not-found state', async ({ page }) => {
    const response = await page.goto('/teams/not-a-real-team');

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);

    const bodyText = await page.locator('body').innerText();

    expect(bodyText.toLowerCase()).toContain('team not found');
    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Internal Server Error');
    expect(bodyText).not.toContain('Unhandled Runtime Error');
  });

  test('unknown player detail route shows safe not-found state', async ({ page }) => {
    const response = await page.goto('/players/not-a-real-player');

    expect(response).not.toBeNull();
    expect(response!.status()).toBeLessThan(500);

    const bodyText = await page.locator('body').innerText();

    expect(bodyText.toLowerCase()).toContain('player not found');
    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Internal Server Error');
    expect(bodyText).not.toContain('Unhandled Runtime Error');
  });

  test('invalid rankings route returns 404 safely', async ({ page }) => {
    const response = await page.goto('/rankings/not-a-real-ranking');

    expect(response).not.toBeNull();
    expect(response!.status()).toBe(404);

    const bodyText = await page.locator('body').innerText();

    expect(bodyText).not.toContain('Application error');
    expect(bodyText).not.toContain('Internal Server Error');
    expect(bodyText).not.toContain('Unhandled Runtime Error');
  });
});
