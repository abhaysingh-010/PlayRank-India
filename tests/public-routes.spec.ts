import { expect, test } from '@playwright/test';

const publicRoutes = [
  '/',
  '/rankings',
  '/rankings/teams',
  '/rankings/players',
  '/teams',
  '/players',
  '/matches',
  '/tournaments',
  '/search?q=soul',
  '/compare',
  '/teams/compare',
  '/players/compare',
];

test.describe('public route smoke tests', () => {
  for (const route of publicRoutes) {
    test(`${route} loads successfully without a server error page`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response, `${route} should return a response`).not.toBeNull();
      expect(response!.status(), `${route} should return 200`).toBe(200);

      await expect(page.locator('body')).toBeVisible();

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('Application error');
      expect(bodyText).not.toContain('Internal Server Error');
      expect(bodyText).not.toContain('Unhandled Runtime Error');
      expect(bodyText).not.toContain('Player comparison unavailable');
    });
  }
});
