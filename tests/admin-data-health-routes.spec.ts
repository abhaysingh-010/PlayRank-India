import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const adminDataHealthRoutes = [
  '/admin/data-health',
  '/admin/data-health/missing-logos',
  '/admin/data-health/missing-slugs',
  '/admin/data-health/orphan-rankings',
  '/admin/data-health/players-without-team',
  '/admin/data-health/pubg-blocked-promotions',
  '/admin/data-health/roster-issues',
];

test.describe('admin data-health route coverage', () => {
  for (const route of adminDataHealthRoutes) {
    test(`${route} is protected without auth`, async ({ page }) => {
      const response = await page.goto(route);

      expect(response, `${route} should return a response`).not.toBeNull();
      expect(response!.status(), `${route} should reject missing auth`).toBe(401);
    });
  }

  test('data-health missing slugs issue links to the admin route', async () => {
    const source = fs.readFileSync('src/app/admin/data-health/page.tsx', 'utf8');

    expect(source).toContain('href: "/admin/data-health/missing-slugs"');
    expect(source).not.toContain('href: "/teams/admin/data-health/missing-slugs"');
  });
});
