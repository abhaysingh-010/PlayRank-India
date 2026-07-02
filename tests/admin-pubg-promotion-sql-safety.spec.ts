import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const migrationPath =
  'supabase/migrations/20260629133000_sprint_2_sql_safety_hardening.sql';

function readMigration() {
  return fs.readFileSync(migrationPath, 'utf8');
}

test.describe('admin PUBG promotion SQL safety contract', () => {
  test('migration preserves core duplicate-prevention indexes', async () => {
    const source = readMigration();

    expect(source).toContain(
      'create unique index if not exists player_match_stats_match_player_unique_idx',
    );
    expect(source).toContain(
      'on public.player_match_stats (match_id, player_id);',
    );

    expect(source).toContain(
      'create unique index if not exists team_match_results_match_team_unique_idx',
    );
    expect(source).toContain(
      'on public.team_match_results (match_id, team_id);',
    );

    expect(source).toContain(
      'create unique index if not exists rankings_entity_unique_idx',
    );
    expect(source).toContain(
      'on public.rankings (entity_type, entity_id);',
    );
  });

  test('migration preserves PUBG promotion audit and one-success idempotency guard', async () => {
    const source = readMigration();

    expect(source).toContain('create table if not exists public.pubg_core_promotions');
    expect(source).toContain('constraint pubg_core_promotions_status_check');
    expect(source).toContain(
      "check (status in ('started', 'blocked', 'promoted', 'failed'))",
    );

    expect(source).toContain(
      'create unique index if not exists pubg_core_promotions_one_success_idx',
    );
    expect(source).toContain(
      'on public.pubg_core_promotions (external_match_id)',
    );
    expect(source).toContain("where status = 'promoted';");

    expect(source).toContain("status = 'blocked'");
    expect(source).toContain("status = 'failed'");
    expect(source).toContain("status = 'promoted'");
  });

  test('promotion function remains match-scoped, locked, and re-runnable safely', async () => {
    const source = readMigration();

    expect(source).toContain(
      'create or replace function public.promote_pubg_api_match_to_playrank_core',
    );
    expect(source).toContain('pg_try_advisory_xact_lock');
    expect(source).toContain("hashtext('pubg_core_promotion')");
    expect(source).toContain("reason', 'promotion_already_running'");

    expect(source).toContain("core_external_id := 'pubg-api-' || target_external_match_id;");
    expect(source).toContain('on conflict (external_id)');
    expect(source).toContain('do update set');

    expect(source).toContain('delete from public.player_match_stats');
    expect(source).toContain('where match_id = core_match_id;');

    expect(source).toContain('delete from public.team_match_results');
    expect(source).toContain('where match_id = core_match_id;');

    expect(source).toContain('get diagnostics inserted_player_stats = row_count;');
    expect(source).toContain('inserted_player_stats <> readiness_row.total_participants');
    expect(source).toContain('get diagnostics inserted_team_results = row_count;');
    expect(source).toContain('inserted_team_results < 2');
  });

  test('admin promote route still does not call the write RPC directly', async () => {
    const routeSource = fs.readFileSync(
      'src/app/api/admin/pubg/promote-match/route.ts',
      'utf8',
    );

    expect(routeSource).toContain('dry_run?: unknown');
    expect(routeSource).toContain('core_promotion_disabled: true');
    expect(routeSource).not.toContain('.rpc(');
    expect(routeSource).not.toContain('promote_pubg_api_match_to_playrank_core(');
  });
});
