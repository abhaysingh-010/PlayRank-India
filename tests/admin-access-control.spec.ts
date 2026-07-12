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

const protectedRoutes = [
  '/admin',
  '/admin/teams',
  '/api/admin/pubg/promotion-readiness',
];

test.describe('admin access-control regression tests', () => {
  for (const route of protectedRoutes) {
    test(`${route} rejects missing auth`, async ({ request }) => {
      const response = await request.get(route);

      expect(response.status()).toBe(401);
      expect(response.headers()['cache-control']).toContain('no-store');
      expect(response.headers()['www-authenticate']).toContain('Basic realm="PlayRank Admin"');

      const body = await response.text();
      expect(body).toContain('Unauthorized');
    });
  }

  for (const route of protectedRoutes) {
    test(`${route} rejects wrong auth`, async ({ request }) => {
      const response = await request.get(route, {
        headers: {
          Authorization: basicAuth('wrong', 'wrong'),
        },
      });

      expect(response.status()).toBe(401);
      expect(response.headers()['cache-control']).toContain('no-store');
      expect(response.headers()['www-authenticate']).toContain('Basic realm="PlayRank Admin"');

      const body = await response.text();
      expect(body).toContain('Unauthorized');
    });
  }

  test('admin routes allow correct auth when credentials are available', async ({ request }) => {
    const credentials = getAdminCredentials();

    test.skip(
      !credentials.username || !credentials.password,
      'ADMIN_USERNAME and ADMIN_PASSWORD are not available to the Playwright test runner',
    );

    const response = await request.get('/admin', {
      headers: {
        Authorization: basicAuth(credentials.username!, credentials.password!),
      },
    });

    expect(response.status()).toBeLessThan(500);
    expect(response.status()).not.toBe(401);

    const body = await response.text();
    expect(body).not.toContain('Unauthorized');
    expect(body).not.toContain('Admin protection is not configured');
  });
});

test('admin unsafe requests reject missing or cross-site origins', async ({ request }) => {
  const credentials = getAdminCredentials();

  test.skip(
    !credentials.username || !credentials.password,
    'ADMIN_USERNAME and ADMIN_PASSWORD are not available to the Playwright test runner',
  );

  const authorization = basicAuth(
    credentials.username!,
    credentials.password!,
  );

  const missingOriginResponse = await request.post(
    '/api/admin/pubg/promotion-readiness',
    {
      headers: {
        Authorization: authorization,
      },
    },
  );

  expect(missingOriginResponse.status()).toBe(403);
  expect(missingOriginResponse.headers()['cache-control']).toContain('no-store');
  expect(await missingOriginResponse.text()).toContain(
    'Cross-site request rejected',
  );

  const crossSiteResponse = await request.post(
    '/api/admin/pubg/promotion-readiness',
    {
      headers: {
        Authorization: authorization,
        Origin: 'https://attacker.example',
      },
    },
  );

  expect(crossSiteResponse.status()).toBe(403);
  expect(await crossSiteResponse.text()).toContain(
    'Cross-site request rejected',
  );
});

test('admin unsafe requests allow the configured same origin', async ({ request }) => {
  const credentials = getAdminCredentials();

  test.skip(
    !credentials.username || !credentials.password,
    'ADMIN_USERNAME and ADMIN_PASSWORD are not available to the Playwright test runner',
  );

  const response = await request.post(
    '/api/admin/pubg/promotion-readiness',
    {
      headers: {
        Authorization: basicAuth(
          credentials.username!,
          credentials.password!,
        ),
        Origin: 'http://127.0.0.1:3000',
      },
    },
  );

  expect(response.status()).not.toBe(401);
  expect(response.status()).not.toBe(403);
  expect(response.status()).toBeLessThan(500);
});

test('admin write requests are rate limited per client and route', async ({ request }) => {
  const credentials = getAdminCredentials();

  test.skip(
    !credentials.username || !credentials.password,
    'ADMIN_USERNAME and ADMIN_PASSWORD are not available to the Playwright test runner',
  );

  const headers = {
    Authorization: basicAuth(
      credentials.username!,
      credentials.password!,
    ),
    Origin: 'http://127.0.0.1:3000',
    'X-Forwarded-For': '198.51.100.77',
  };

  for (let attempt = 1; attempt <= 20; attempt += 1) {
    const response = await request.post(
      '/api/admin/pubg/promotion-readiness',
      { headers },
    );

    expect(response.status()).not.toBe(429);
    expect(response.headers()['x-ratelimit-limit']).toBe('20');
    expect(Number(response.headers()['x-ratelimit-remaining'])).toBe(
      20 - attempt,
    );
  }

  const blockedResponse = await request.post(
    '/api/admin/pubg/promotion-readiness',
    { headers },
  );

  expect(blockedResponse.status()).toBe(429);
  expect(blockedResponse.headers()['cache-control']).toContain('no-store');
  expect(blockedResponse.headers()['retry-after']).toBeTruthy();
  expect(blockedResponse.headers()['x-ratelimit-limit']).toBe('20');
  expect(blockedResponse.headers()['x-ratelimit-remaining']).toBe('0');
  expect(await blockedResponse.text()).toContain(
    'Too many admin requests',
  );
});
