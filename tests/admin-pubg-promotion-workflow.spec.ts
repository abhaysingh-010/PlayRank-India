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

    expect(source).toContain('Core promotion writes are guarded');
    expect(source).toContain('Dry-run checks are allowed');
    expect(source).toContain('admin API route only calls the SQL promotion RPC after readiness, confirmation, and feature flag checks pass');
    expect(source).toContain('/admin/pubg/promotions');
    expect(source).toContain('Promotion Audit');
    expect(source).toContain('Guarded promotion: real PlayRank core writes are');
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
    expect(source).toContain('Core promotion writes are guarded');
    expect(source).toContain('Dry-run checks are allowed');
    expect(source).toContain('Real writes execute only after the guarded server flag is enabled.');
    expect(source).toContain('/admin/pubg/promotions');
    expect(source).toContain('Promotion Audit');
  });

  test('promotion audit page explains guarded SQL RPC execution', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/promotions/page.tsx', 'utf8');
    const routeSource = fs.readFileSync('src/app/api/admin/pubg/promote-match/route.ts', 'utf8');

    expect(source).toContain('SQL promotion function exists');
    expect(source).toContain('admin API route calls it only after readiness');
    expect(source).toContain('readiness, exact confirmation, and the server-side feature flag pass');
    expect(routeSource).toContain('dry_run?: unknown');
    expect(routeSource).toContain('core_promotion_disabled: true');
    expect(routeSource).toContain('core_promotion_disabled: false');
    expect(routeSource).toContain('core_promotion_disabled: false');
    expect(routeSource).toContain('.rpc(');
    expect(routeSource).toContain('promote_pubg_api_match_to_playrank_core');
  });
});

test.describe('admin PUBG promotion confirmation workflow UI', () => {
  test('imports page explains the two-step promotion workflow before writes are enabled', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/imports/page.tsx', 'utf8');

    expect(source).toContain('Two-step promotion workflow');
    expect(source).toContain('Run dry-run readiness check');
    expect(source).toContain('Promotion Audit');
    expect(source).toContain('confirm_promotion');
    expect(source).toContain('PROMOTE_TO_PLAYRANK_CORE');
    expect(source).toContain('PLAYRANK_ENABLE_PUBG_CORE_PROMOTION');
    expect(source).toContain('Open Confirmation Workflow');
  });

  test('import detail page shows dry-run and confirmed promotion request bodies', async () => {
    const source = fs.readFileSync(
      'src/app/admin/pubg/imports/[external_match_id]/page.tsx',
      'utf8',
    );

    expect(source).toContain('Dry-run vs confirmed promotion workflow');
    expect(source).toContain('Step 1: Run dry-run readiness check');
    expect(source).toContain('Step 2: Confirm promotion intent');
    expect(source).toContain('dryRunRequestBody');
    expect(source).toContain('confirmedPromotionRequestBody');
    expect(source).toContain('confirm_promotion');
    expect(source).toContain('confirmation_text');
    expect(source).toContain('PROMOTE_TO_PLAYRANK_CORE');
    expect(source).toContain('PLAYRANK_ENABLE_PUBG_CORE_PROMOTION');
    expect(source).toContain('Real writes execute only after the guarded server flag is enabled.');
  });

  test('confirmation workflow UI documents guarded SQL RPC execution', async () => {
    const routeSource = fs.readFileSync('src/app/api/admin/pubg/promote-match/route.ts', 'utf8');

    expect(routeSource).toContain('promote_pubg_api_match_to_playrank_core');
    expect(routeSource).toContain('.rpc(');
    expect(routeSource).toContain('promote_pubg_api_match_to_playrank_core');
  });
});

test.describe('admin PUBG promotion audit and failure-state copy', () => {
  test('promotion audit page explains operator actions for failed, blocked, started, and promoted states', async () => {
    const source = fs.readFileSync('src/app/admin/pubg/promotions/page.tsx', 'utf8');

    expect(source).toContain('Failure-state operator guide');
    expect(source).toContain('Promotion failed: operator action required');
    expect(source).toContain('Promotion blocked by readiness guard');
    expect(source).toContain('Started without completion');
    expect(source).toContain('Promotion completed');
    expect(source).toContain('error_message');
    expect(source).toContain('completed_at');
    expect(source).toContain('core_match_id');
    expect(source).toContain('rerun dry-run before retry');
  });

  test('import detail page points operators back to audit after confirmed attempts', async () => {
    const source = fs.readFileSync(
      'src/app/admin/pubg/imports/[external_match_id]/page.tsx',
      'utf8',
    );

    expect(source).toContain('Audit and failure follow-up');
    expect(source).toContain('Promotion Audit');
    expect(source).toContain('failed, blocked, started, and promoted states');
    expect(source).toContain('error_message');
    expect(source).toContain('completed_at');
    expect(source).toContain('core_match_id');
  });

  test('failure-state copy preserves guarded SQL RPC execution', async () => {
    const routeSource = fs.readFileSync('src/app/api/admin/pubg/promote-match/route.ts', 'utf8');

    expect(routeSource).toContain('promote_pubg_api_match_to_playrank_core');
    expect(routeSource).toContain('.rpc(');
    expect(routeSource).toContain('promote_pubg_api_match_to_playrank_core');
  });
});

test.describe('admin PUBG promotion Phase 4A guarded SQL RPC execution', () => {
  test('route keeps every guard before the SQL RPC call', async () => {
    const source = fs.readFileSync('src/app/api/admin/pubg/promote-match/route.ts', 'utf8');

    expect(source).toContain('promotionClient.rpc("promote_pubg_api_match_to_playrank_core"');
    expect(source).toContain('target_external_match_id: validated.externalMatchId');
    expect(source).toContain('core_promotion_disabled: false');
    expect(source).toContain('promotion_result: promotionResult');

    expect(source.indexOf('readinessRow.promotion_allowed !== true')).toBeLessThan(source.indexOf('promotionClient.rpc'));
    expect(source.indexOf('if (dryRun)')).toBeLessThan(source.indexOf('promotionClient.rpc'));
    expect(source.indexOf('if (!confirmPromotion)')).toBeLessThan(source.indexOf('promotionClient.rpc'));
    expect(source.indexOf('confirmationText !== PROMOTION_CONFIRMATION_TEXT')).toBeLessThan(source.indexOf('promotionClient.rpc'));
    expect(source.indexOf('if (!isCorePromotionEnabled())')).toBeLessThan(source.indexOf('promotionClient.rpc'));
  });

  test('operator copy reflects guarded enablement rather than unconditional writes', async () => {
    const importsSource = fs.readFileSync('src/app/admin/pubg/imports/page.tsx', 'utf8');
    const detailSource = fs.readFileSync(
      'src/app/admin/pubg/imports/[external_match_id]/page.tsx',
      'utf8',
    );
    const auditSource = fs.readFileSync('src/app/admin/pubg/promotions/page.tsx', 'utf8');

    expect(importsSource).toContain('Core promotion writes are guarded');
    expect(importsSource).toContain('readiness, confirmation, and feature flag checks pass');
    expect(detailSource).toContain('Core promotion writes are guarded');
    expect(detailSource).toContain('PLAYRANK_ENABLE_PUBG_CORE_PROMOTION=true');
    expect(auditSource).toContain('admin API route calls it only after readiness');
  });
});
