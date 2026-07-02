import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const migrationPath =
  'supabase/migrations/20260629133000_sprint_2_sql_safety_hardening.sql';
const routePath = 'src/app/api/admin/pubg/promote-match/route.ts';

function readMigration() {
  return fs.readFileSync(migrationPath, 'utf8');
}

function readRoute() {
  return fs.readFileSync(routePath, 'utf8');
}

test.describe('admin PUBG promotion rollback and audit contract', () => {
  test('promotion audit table stores lifecycle status, result, error, and completion metadata', async () => {
    const source = readMigration();

    expect(source).toContain('create table if not exists public.pubg_core_promotions');
    expect(source).toContain('external_match_id text not null');
    expect(source).toContain('core_match_id uuid null references public.matches(id) on delete set null');
    expect(source).toContain('status text not null');
    expect(source).toContain('result jsonb null');
    expect(source).toContain('error_message text null');
    expect(source).toContain('completed_at timestamp with time zone null');
    expect(source).toContain("check (status in ('started', 'blocked', 'promoted', 'failed'))");
  });

  test('promotion function creates an audit row before write work and closes every non-success path', async () => {
    const source = readMigration();

    expect(source).toContain('insert into public.pubg_core_promotions');
    expect(source).toContain("'started'");
    expect(source).toContain('returning id into audit_id');

    expect(source).toContain("status = 'blocked'");
    expect(source).toContain('completed_at = now()');
    expect(source).toContain('where id = audit_id');

    expect(source).toContain("status = 'failed'");
    expect(source).toContain('error_message = sqlerrm');
    expect(source).toContain("'reason', 'promotion_failed'");
  });

  test('promotion function is re-runnable by replacing match-scoped derived rows only', async () => {
    const source = readMigration();

    expect(source).toContain("core_external_id := 'pubg-api-' || target_external_match_id;");
    expect(source).toContain('on conflict (external_id)');
    expect(source).toContain('do update set');

    expect(source).toContain('delete from public.player_match_stats');
    expect(source).toContain('where match_id = core_match_id;');

    expect(source).toContain('delete from public.team_match_results');
    expect(source).toContain('where match_id = core_match_id;');

    expect(source).not.toContain('delete from public.player_match_stats;');
    expect(source).not.toContain('delete from public.team_match_results;');
  });

  test('promotion success is idempotent and records core match linkage', async () => {
    const source = readMigration();

    expect(source).toContain('create unique index if not exists pubg_core_promotions_one_success_idx');
    expect(source).toContain('on public.pubg_core_promotions (external_match_id)');
    expect(source).toContain("where status = 'promoted';");

    expect(source).toContain("status = 'promoted'");
    expect(source).toContain('core_match_id = (result_payload->>\'match_id\')::uuid');
    expect(source).toContain("'inserted_player_stats', inserted_player_stats");
    expect(source).toContain("'inserted_team_results', inserted_team_results");
  });

  test('admin route remains guarded and still does not execute promotion RPC in Phase 2B', async () => {
    const source = readRoute();

    expect(source).toContain('confirm_promotion?: unknown');
    expect(source).toContain('confirmation_text?: unknown');
    expect(source).toContain('PLAYRANK_ENABLE_PUBG_CORE_PROMOTION');
    expect(source).toContain('PROMOTE_TO_PLAYRANK_CORE');
    expect(source).toContain('SQL RPC call is still disabled in this phase');

    expect(source).not.toContain('.rpc(');
    expect(source).not.toContain('promote_pubg_api_match_to_playrank_core(');
  });
});
