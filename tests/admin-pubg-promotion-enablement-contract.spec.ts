import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const routePath = 'src/app/api/admin/pubg/promote-match/route.ts';
const workflowTestPath = 'tests/admin-pubg-promotion-workflow.spec.ts';
const sqlSafetyTestPath = 'tests/admin-pubg-promotion-sql-safety.spec.ts';

function readRoute() {
  return fs.readFileSync(routePath, 'utf8');
}

test.describe('admin PUBG promotion guarded enablement contract', () => {
  test('current route remains locked before guarded enablement patch', async () => {
    const source = readRoute();

    expect(source).toContain('dry_run?: unknown');
    expect(source).toContain('function normalizeDryRun');
    expect(source).toContain('core_promotion_disabled: true');
    expect(source).toContain('Promotion gate passed, but core promotion is intentionally disabled.');
    expect(source).toContain('423');

    expect(source).not.toContain('confirm_promotion?: unknown');
    expect(source).not.toContain('confirmation_text?: unknown');
    expect(source).not.toContain('PLAYRANK_ENABLE_PUBG_CORE_PROMOTION');
    expect(source).not.toContain('.rpc(');
    expect(source).not.toContain('promote_pubg_api_match_to_playrank_core');
  });

  test('future guarded enablement contract is explicitly documented in tests before implementation', async () => {
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

  test('existing workflow tests still warn that admin route does not call the SQL RPC yet', async () => {
    const workflowSource = fs.readFileSync(workflowTestPath, 'utf8');
    const sqlSafetySource = fs.readFileSync(sqlSafetyTestPath, 'utf8');

    expect(workflowSource).toContain('admin API route does not call the SQL promotion RPC yet');
    expect(workflowSource).toContain('does not execute the SQL promotion RPC');
    expect(workflowSource).toContain('expect(routeSource).not.toContain');
    expect(sqlSafetySource).toContain('admin promote route still does not call the write RPC directly');
  });
});
