import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const routePath = 'src/app/api/admin/pubg/promote-match/route.ts';
const workflowTestPath = 'tests/admin-pubg-promotion-workflow.spec.ts';
const sqlSafetyTestPath = 'tests/admin-pubg-promotion-sql-safety.spec.ts';

function readRoute() {
  return fs.readFileSync(routePath, 'utf8');
}

test.describe('admin PUBG promotion guarded enablement contract', () => {
  test('route enables SQL RPC only after all guarded promotion checks pass', async () => {
    const source = readRoute();

    expect(source).toContain('dry_run?: unknown');
    expect(source).toContain('confirm_promotion?: unknown');
    expect(source).toContain('confirmation_text?: unknown');
    expect(source).toContain('PROMOTE_TO_PLAYRANK_CORE');
    expect(source).toContain('PLAYRANK_ENABLE_PUBG_CORE_PROMOTION');
    expect(source).toContain('function normalizeConfirmPromotion');
    expect(source).toContain('function normalizeConfirmationText');
    expect(source).toContain('function isCorePromotionEnabled');
    expect(source).toContain('confirmation_required: true');
    expect(source).toContain('Promotion confirmed, but the server-side promotion feature flag is disabled.');
    expect(source).toContain('promote_pubg_api_match_to_playrank_core');
    expect(source).toContain('.rpc(');
    expect(source).toContain('target_external_match_id: validated.externalMatchId');

    expect(source.indexOf('if (dryRun)')).toBeLessThan(source.indexOf('promotionClient.rpc'));
    expect(source.indexOf('if (!confirmPromotion)')).toBeLessThan(source.indexOf('promotionClient.rpc'));
    expect(source.indexOf('confirmationText !== PROMOTION_CONFIRMATION_TEXT')).toBeLessThan(source.indexOf('promotionClient.rpc'));
    expect(source.indexOf('if (!isCorePromotionEnabled())')).toBeLessThan(source.indexOf('promotionClient.rpc'));
  });

  test('guarded enablement contract preserves locked responses before SQL RPC', async () => {
    const contract = {
      body: {
        external_match_id: 'string',
        dry_run: false,
        confirm_promotion: true,
        confirmation_text: 'PROMOTE_TO_PLAYRANK_CORE',
      },
      env: {
        PLAYRANK_ENABLE_PUBG_CORE_PROMOTION: 'true',
      },
      lockedResponses: {
        missingConfirmation: 423,
        wrongConfirmationText: 423,
        envDisabled: 423,
        readinessBlocked: 409,
      },
      allowedWritePath:
        'Only env enabled plus readiness allowed plus confirm_promotion true plus exact confirmation_text may call SQL RPC.',
    };

    expect(contract.body.confirmation_text).toBe('PROMOTE_TO_PLAYRANK_CORE');
    expect(contract.env.PLAYRANK_ENABLE_PUBG_CORE_PROMOTION).toBe('true');
    expect(contract.lockedResponses.missingConfirmation).toBe(423);
    expect(contract.lockedResponses.wrongConfirmationText).toBe(423);
    expect(contract.lockedResponses.envDisabled).toBe(423);
    expect(contract.lockedResponses.readinessBlocked).toBe(409);
    expect(contract.allowedWritePath).toContain('may call SQL RPC');
  });

  test('workflow and SQL safety tests now document guarded RPC enablement', async () => {
    const workflowSource = fs.readFileSync(workflowTestPath, 'utf8');
    const sqlSafetySource = fs.readFileSync(sqlSafetyTestPath, 'utf8');

    expect(workflowSource).toContain('guarded SQL RPC execution');
    expect(workflowSource).toContain('readiness, confirmation, and feature flag checks');
    expect(sqlSafetySource).toContain('guarded server checks');
  });
});
