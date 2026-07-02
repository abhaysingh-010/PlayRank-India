import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

function parseEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const entries: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, '');

    entries[key] = value;
  }

  return entries;
}

function getAdminCredentials() {
  const envLocal = parseEnvFile(path.resolve(process.cwd(), '.env.local'));
  const env = parseEnvFile(path.resolve(process.cwd(), '.env'));

  return {
    username:
      process.env.ADMIN_USERNAME ?? envLocal.ADMIN_USERNAME ?? env.ADMIN_USERNAME,
    password:
      process.env.ADMIN_PASSWORD ?? envLocal.ADMIN_PASSWORD ?? env.ADMIN_PASSWORD,
  };
}

function basicAuth(username: string, password: string) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

function getAuthHeaders() {
  const credentials = getAdminCredentials();

  if (!credentials.username || !credentials.password) {
    return null;
  }

  return {
    Authorization: basicAuth(credentials.username, credentials.password),
  };
}

test.describe('admin API safety regression tests', () => {
  test.beforeEach(() => {
    const authHeaders = getAuthHeaders();

    test.skip(
      !authHeaders,
      'ADMIN_USERNAME and ADMIN_PASSWORD are not available to the Playwright test runner',
    );
  });

  test('GET /api/admin/pubg/import-match is method-safe', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/import-match', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(405);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(data).toEqual({
      ok: false,
      error: 'Method not allowed',
      allowed_methods: ['POST'],
    });
  });

  test('GET /api/admin/pubg/promote-match is method-safe', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/promote-match', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(405);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(data).toEqual({
      ok: false,
      error: 'Method not allowed',
      allowed_methods: ['POST'],
    });
  });

  test('GET /api/admin/recalculate-rankings is method-safe', async ({ request }) => {
    const response = await request.get('/api/admin/recalculate-rankings', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(405);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(data).toEqual({
      ok: false,
      error: 'Method not allowed',
      allowed_methods: ['POST'],
    });
  });

  test('/api/admin/pubg/promotion-readiness supports safe read access', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/promotion-readiness', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.filters).toBeTruthy();
    expect(data.filters.status).toBe('all');
    expect(data.filters.limit).toBeGreaterThan(0);
    expect(Array.isArray(data.filters.supported_status_filters)).toBe(true);
    expect(data.filters.supported_status_filters).toContain('all');
    expect(data.filters.supported_status_filters).toContain('ready');
    expect(data.filters.supported_status_filters).toContain('blocked');

    expect(data.summary).toBeTruthy();
    expect(typeof data.summary.returned_matches).toBe('number');
    expect(typeof data.summary.ready_for_promotion).toBe('number');
    expect(typeof data.summary.blocked).toBe('number');
    expect(typeof data.summary.status_breakdown).toBe('object');

    expect(Array.isArray(data.matches)).toBe(true);
  });

  test('/api/admin/pubg/promotion-readiness rejects invalid status filter', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/promotion-readiness?status=invalid-status', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(data.ok).toBe(false);
    expect(data.error).toBe('Invalid status filter');
    expect(Array.isArray(data.supported_status_filters)).toBe(true);
  });

  test('/api/admin/rosters/health supports safe read access', async ({ request }) => {
    const response = await request.get('/api/admin/rosters/health', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(200);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(data.ok).toBe(true);
    expect(data.filters).toBeTruthy();
    expect(data.filters.status).toBe('all');
    expect(data.filters.limit).toBeGreaterThan(0);
    expect(Array.isArray(data.filters.supported_status_filters)).toBe(true);
    expect(data.filters.supported_status_filters).toContain('all');
    expect(data.filters.supported_status_filters).toContain('healthy');
    expect(data.filters.supported_status_filters).toContain('blocked');

    expect(data.summary).toBeTruthy();
    expect(typeof data.summary.returned_players).toBe('number');
    expect(typeof data.summary.healthy).toBe('number');
    expect(typeof data.summary.promotion_safe).toBe('number');
    expect(typeof data.summary.blocked).toBe('number');
    expect(typeof data.summary.issues).toBe('number');

    expect(Array.isArray(data.rows)).toBe(true);
  });

  test('/api/admin/rosters/health rejects invalid status filter', async ({ request }) => {
    const response = await request.get('/api/admin/rosters/health?status=invalid-status', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['cache-control']).toContain('no-store');

    const data = await response.json();

    expect(data.ok).toBe(false);
    expect(data.error).toBe('Invalid status filter');
    expect(Array.isArray(data.supported_status_filters)).toBe(true);
  });
});


test.describe('admin PUBG promotion dry-run source contract', () => {
  test('/api/admin/pubg/promote-match exposes dry-run without enabling core writes', async () => {
    const source = fs.readFileSync('src/app/api/admin/pubg/promote-match/route.ts', 'utf8');

    expect(source).toContain('dry_run?: unknown');
    expect(source).toContain('function normalizeDryRun');
    expect(source).toContain('const dryRun = normalizeDryRun(body.dry_run)');
    expect(source).toContain('dry_run: true');
    expect(source).toContain('would_promote: true');
    expect(source).toContain('core_promotion_disabled: true');
    expect(source).toContain('Dry run passed. Promotion gate is ready, but no core write was executed.');
    expect(source).not.toContain('.rpc(');
    expect(source).not.toContain('promote_pubg_api_match_to_playrank_core(');
  });
});
