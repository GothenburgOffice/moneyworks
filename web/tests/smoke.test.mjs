import assert from 'node:assert/strict';
import { test } from 'node:test';

const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';

for (const [locale, title, status] of [
  ['en', 'Hello world!', 'Database connection: OK'],
  ['sv', 'Hej världen!', 'Databasanslutning: OK'],
]) {
  test(`${locale}: only a localized hello world and a live database status`, async () => {
    const response = await fetch(`${base}/${locale}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`<html lang="${locale}"`));
    // Inspect rendered main content, not translation strings in Next.js payloads.
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
    assert.ok(main, 'Missing main element');
    assert.ok(main.includes(`>${title}</h1>`));
    assert.ok(main.includes(`>${status}</p>`));
    assert.equal((main.match(/<h1\b/g) ?? []).length, 1);
    assert.equal((main.match(/<p\b/g) ?? []).length, 1);
    assert.ok(!main.includes('<time'));
    assert.ok(!main.includes('from PostgreSQL'));
    assert.ok(!main.includes('från PostgreSQL'));
  });
}

test('English is the default even with Swedish browser language and cookie', async () => {
  const response = await fetch(`${base}/`, {
    redirect: 'manual',
    headers: {
      'Accept-Language': 'sv-SE,sv;q=0.9',
      Cookie: 'NEXT_LOCALE=sv',
    },
  });
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get('location'), base).pathname, '/en');
});

test('database health performs a real uncached read', async () => {
  const response = await fetch(`${base}/api/health/db`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const health = await response.json();
  assert.equal(health.status, 'ok');
  assert.equal(typeof health.message, 'string');
  assert.ok(Number.isFinite(Date.parse(health.checkedAt)));
});
