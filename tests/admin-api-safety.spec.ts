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
    username: process.env.ADMIN_USERNAME ?? envLocal.ADMIN_USERNAME ?? env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD ?? envLocal.ADMIN_PASSWORD ?? env.ADMIN_PASSWORD,
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
  });

  test('GET /api/admin/pubg/promote-match is method-safe', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/promote-match', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(405);
  });

  test('GET /api/admin/recalculate-rankings is method-safe', async ({ request }) => {
    const response = await request.get('/api/admin/recalculate-rankings', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(405);
  });

  test('/api/admin/pubg/promotion-readiness supports safe read access', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/promotion-readiness', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toBeTruthy();
  });

  test('/api/admin/pubg/promotion-readiness rejects invalid status filter', async ({ request }) => {
    const response = await request.get('/api/admin/pubg/promotion-readiness?status=invalid-status', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();

    expect(data.ok).toBe(false);
  });

  test('/api/admin/rosters/health supports safe read access', async ({ request }) => {
    const response = await request.get('/api/admin/rosters/health', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    expect(data).toBeTruthy();
  });

  test('/api/admin/rosters/health rejects invalid status filter', async ({ request }) => {
    const response = await request.get('/api/admin/rosters/health?status=invalid-status', {
      headers: getAuthHeaders()!,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();

    expect(data.ok).toBe(false);
  });
});
