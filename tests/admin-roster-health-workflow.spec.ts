import { expect, test } from '@playwright/test';
import fs from 'node:fs';

test.describe('admin roster health workflow coverage', () => {
  test('/admin/rosters/health exposes detailed roster issue filters in source', async () => {
    const source = fs.readFileSync('src/app/admin/rosters/health/page.tsx', 'utf8');

    expect(source).toContain('value: "no_team_no_active_roster"');
    expect(source).toContain('value: "player_has_team_but_no_active_roster"');
    expect(source).toContain('value: "active_roster_but_player_team_missing"');
    expect(source).toContain('value: "player_team_roster_mismatch"');
    expect(source).toContain('value: "multiple_active_rosters"');

    expect(source).toContain('return row.health_status === selectedStatus');
    expect(source).not.toContain('bg-[#ffd21a]/10px-5');
  });

  test('/api/admin/rosters/health supports detailed roster issue filters', async ({ request }) => {
    const response = await request.get('/api/admin/rosters/health?status=player_team_roster_mismatch&limit=500');

    expect(response.status()).toBe(401);
  });
});

test.describe('admin roster issue action coverage', () => {
  test('/admin/data-health/roster-issues provides direct issue action links in source', async () => {
    const source = fs.readFileSync('src/app/admin/data-health/roster-issues/page.tsx', 'utf8');

    expect(source).toContain('function getRosterHealthHref');
    expect(source).toContain('/admin/rosters/health?status=issues');
    expect(source).toContain('encodeURIComponent(status)');
    expect(source).toContain('function getPlayerReviewHref');
    expect(source).toContain('/admin/players?search=');
    expect(source).toContain('getRosterHealthHref(issue.health.health_status)');
    expect(source).toContain('getPlayerReviewHref(issue.player)');
  });
});
