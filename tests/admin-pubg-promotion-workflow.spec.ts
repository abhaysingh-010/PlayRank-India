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

test.describe('admin PUBG import detail workflow coverage', () => {
  test('/admin/pubg/imports/[external_match_id] exposes direct workflow actions in source', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/imports/[external_match_id]/page.tsx', 'utf8');

    expect(source).toContain('function getMatchMappingsHref');
    expect(source).toContain('/admin/pubg/mappings?match=');
    expect(source).toContain('function getPromotionReadinessHref');
    expect(source).toContain('/api/admin/pubg/promotion-readiness?status=');
    expect(source).toContain('Fix Match Mappings');
    expect(source).toContain('Readiness Status');
    expect(source).toContain('/admin/data-health/pubg-blocked-promotions');
  });

  test('/admin/pubg/imports carries match context into mapping actions in source', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/imports/page.tsx', 'utf8');

    expect(source).toContain('Open Match Mappings');
    expect(source).toContain('/admin/pubg/mappings?match=');
    expect(source).toContain('encodeURIComponent(');
    expect(source).toContain('row.external_match_id');
  });
});

test.describe('admin PUBG imports list workflow consistency', () => {
  test('/admin/pubg/imports keeps mapping and roster actions consistent in source', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/imports/page.tsx', 'utf8');

    expect(source).toContain('function getMatchMappingsHref');
    expect(source).toContain('getMatchMappingsHref(row.external_match_id)');
    expect(source).toContain('function getRosterHealthHref');
    expect(source).toContain('/admin/rosters/health?status=');
    expect(source).toContain('getRosterHealthHref("issues")');
    expect(source).toContain('Open All Mappings');
    expect(source).not.toContain('text-[#ffd21a]transition');
  });

  test('/admin/data-health/pubg-blocked-promotions has clean blocked match cell classes in source', async () => {
    const source = fs.readFileSync('src/app/admin/data-health/pubg-blocked-promotions/page.tsx', 'utf8');

    expect(source).not.toContain('text-xstext-white/60');
    expect(source).toContain('text-xs text-white/60');
  });
});


test.describe('admin PUBG promotion audit visibility', () => {
  test('/admin/pubg/promotions exposes promotion audit table and workflow links in source', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/promotions/page.tsx', 'utf8');

    expect(source).toContain('pubg_core_promotions');
    expect(source).toContain('external_match_id, core_match_id, status, result, error_message, created_at, completed_at');
    expect(source).toContain('PUBG Promotion');
    expect(source).toContain('Audit Log');
    expect(source).toContain('/admin/pubg/imports/${encodeURIComponent(');
    expect(source).toContain('/admin/pubg/mappings?match=${encodeURIComponent(');
    expect(source).toContain('No PUBG promotion audit rows found.');
  });

  test('admin PUBG hub and data health link to promotion audit', async () => {
    const pubgHub = fs.readFileSync('src/app/admin/pubg/page.tsx', 'utf8');
    const dataHealth = fs.readFileSync('src/app/admin/data-health/page.tsx', 'utf8');

    expect(pubgHub).toContain('/admin/pubg/promotions');
    expect(pubgHub).toContain('Promotion Audit');
    expect(pubgHub).not.toContain('p-4transition');
    expect(pubgHub).not.toContain('bg-[#ffd21a]/10px-5');
    expect(pubgHub).not.toContain('bg-emerald-400/10p-5');

    expect(dataHealth).toContain('/admin/pubg/promotions');
    expect(dataHealth).toContain('Promotion Audit');
  });
});

test.describe('admin PUBG promotion safety copy', () => {
  test('imports page explains dry-run only promotion safety mode', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/imports/page.tsx', 'utf8');

    expect(source).toContain('Core promotion writes are disabled');
    expect(source).toContain('Dry-run checks are allowed');
    expect(source).toContain('admin API route does not call the SQL promotion RPC yet');
    expect(source).toContain('/admin/pubg/promotions');
    expect(source).toContain('Promotion Audit');
    expect(source).toContain('Dry-run only: real PlayRank core writes are');
    expect(source).not.toContain('bg-[#ffd21a]/10px-5');
    expect(source).not.toContain('transitionhover:text-white');
    expect(source).not.toContain('bg-emerald-400/10p-5');
  });

  test('import detail page exposes promotion safety mode and audit link', async () => {
    const source = fs.readFileSync(
      'src/app/admin/pubg/imports/[external_match_id]/page.tsx',
      'utf8',
    );

    expect(source).toContain('PROMOTION_WRITE_STATUS');
    expect(source).toContain('Core promotion writes disabled');
    expect(source).toContain('Dry-run checks are allowed');
    expect(source).toContain('does not execute the SQL promotion RPC');
    expect(source).toContain('/admin/pubg/promotions');
    expect(source).toContain('Promotion Audit');
  });

  test('promotion audit page states RPC is not called by admin route yet', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/promotions/page.tsx', 'utf8');
    const routeSource = fs.readFileSync('src/app/api/admin/pubg/promote-match/route.ts', 'utf8');

    expect(source).toContain('SQL promotion function exists');
    expect(source).toContain('admin API route does not');
    expect(source).toContain('Current approved operation is dry-run readiness review');
    expect(routeSource).toContain('dry_run?: unknown');
    expect(routeSource).toContain('core_promotion_disabled: true');
    expect(routeSource).not.toContain('.rpc(');
    expect(routeSource).not.toContain('promote_pubg_api_match_to_playrank_core(');
  });
});
