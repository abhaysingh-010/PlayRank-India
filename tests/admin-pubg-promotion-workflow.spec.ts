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

test.describe('admin PUBG mappings workflow coverage', () => {
  test('/admin/pubg/mappings supports match-scoped mapping review in source', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/mappings/page.tsx', 'utf8');

    expect(source).toContain('match?: string');
    expect(source).toContain('const matchQuery = (params.match || "").trim()');
    expect(source).toContain('pubg_api_participants');
    expect(source).toContain('.eq("external_match_id", matchQuery)');
    expect(source).toContain('function getParticipantMappingKeys');
    expect(source).toContain('function mappingMatchesParticipant');
    expect(source).toContain('function buildMappingFilterHref');
    expect(source).toContain('name="match"');
    expect(source).toContain('scoped to match');
    expect(source).not.toContain('bg-[#ffd21a]/10px-5');
    expect(source).not.toContain('py-3text-sm');
  });
});
