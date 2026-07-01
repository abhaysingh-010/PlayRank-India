import { expect, test } from '@playwright/test';

test.describe('public API regression tests', () => {
  test('/api/teams returns active ranked teams', async ({ request }) => {
    const response = await request.get('/api/teams');

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const firstTeam = data[0];

    expect(firstTeam.entity_type).toBe('team');
    expect(firstTeam.rank).toBeGreaterThan(0);
    expect(firstTeam.score).toBeGreaterThanOrEqual(0);
    expect(firstTeam.team).toBeTruthy();
    expect(firstTeam.team.active).toBe(true);
    expect(firstTeam.team.slug).toBeTruthy();
  });

  test('/api/players returns active ranked players', async ({ request }) => {
    const response = await request.get('/api/players');

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const firstPlayer = data[0];

    expect(firstPlayer.entity_type).toBe('player');
    expect(firstPlayer.rank).toBeGreaterThan(0);
    expect(firstPlayer.score).toBeGreaterThanOrEqual(0);
    expect(firstPlayer.player).toBeTruthy();
    expect(firstPlayer.player.active).toBe(true);
    expect(firstPlayer.player.slug).toBeTruthy();
  });

  test('/api/search returns safe team result for soul query', async ({ request }) => {
    const response = await request.get('/api/search?q=soul');

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const teamSoul = data.find((item: { type?: string; slug?: string }) => {
      return item.type === 'team' && item.slug === 'team-soul';
    });

    expect(teamSoul).toBeTruthy();
  });

  test('/api/search returns empty array for symbol-only query', async ({ request }) => {
    const response = await request.get('/api/search?q=%25%5F');

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  test('/api/search caps unsafe high limit safely', async ({ request }) => {
    const response = await request.get('/api/search?q=soul&limit=999');

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeLessThanOrEqual(10);
  });

  test('/api/rank-history rejects invalid team id safely', async ({ request }) => {
    const response = await request.get('/api/rank-history/team/not-a-uuid');

    expect(response.status()).toBe(400);

    const data = await response.json();

    expect(data).toEqual({
      ok: false,
      error: 'Invalid entity id',
    });
  });

  test('/api/rank-history rejects invalid player id safely', async ({ request }) => {
    const response = await request.get('/api/rank-history/player/not-a-uuid');

    expect(response.status()).toBe(400);

    const data = await response.json();

    expect(data).toEqual({
      ok: false,
      error: 'Invalid entity id',
    });
  });
});
