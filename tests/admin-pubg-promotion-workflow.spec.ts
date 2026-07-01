import { expect, test } from '@playwright/test';
import fs from 'node:fs';

test.describe('admin PUBG promotion workflow coverage', () => {
  test('/admin/data-health/pubg-blocked-promotions exposes readiness filter actions in source', async () => {
    const source = fs.readFileSync('src/app/admin/data-health/pubg-blocked-promotions/page.tsx', 'utf8');

    expect(source).toContain('function getPromotionReadinessHref');
    expect(source).toContain('/api/admin/pubg/promotion-readiness?status=blocked');
    expect(source).toContain('encodeURIComponent(status)');
    expect(source).toContain('getPromotionReadinessHref(row.promotion_status)');
    expect(source).toContain('Readiness filter');
  });

  test('/api/admin/pubg/promotion-readiness protects detailed readiness filters without auth', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/promotion-readiness?status=not_ready_unmapped_players&limit=500');

    expect(response.status()).toBe(401);
  });
});
