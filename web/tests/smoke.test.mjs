import assert from 'node:assert/strict';
import { test } from 'node:test';

const base = process.env.TEST_BASE_URL ?? 'http://127.0.0.1:3000';

for (const [locale, title, fire, crypto, planned] of [
  ['en', 'A clearer view of your money.', 'FIRE calculator', 'Crypto tax calculator', 'Planned'],
  ['sv', 'En tydligare bild av din ekonomi.', 'FIRE-kalkylator', 'Kryptoskattekalkylator', 'Planeras'],
]) {
  test(`${locale}: the complete one-page tool hub is pre-rendered without JavaScript`, async () => {
    const response = await fetch(`${base}/${locale}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`<html lang="${locale}"`));
    // Inspect rendered main content, not translation strings in Next.js payloads.
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1];
    assert.ok(main, 'Missing main element');
    const heading = main.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    assert.equal(heading, title);
    assert.ok(html.includes('data-theme="dark"'));
    assert.ok(html.includes('data-theme-toggle'));
    assert.ok(main.includes('intro-art'));
    assert.ok(main.includes(fire));
    assert.ok(main.includes(crypto));
    assert.ok(main.includes(planned));
    // Both views are pre-rendered; native hash/CSS selection exposes one at a time.
    assert.equal((main.match(/<h1\b/g) ?? []).length, 2);
    assert.ok(main.includes('data-home-view'));
    assert.ok(main.includes('data-tool-panel="fire"'));
    assert.ok(main.includes('id="fire-page-title"'));
    for (const id of ['tools', 'fire', 'fire-calculator', 'crypto', 'learn', 'about']) {
      assert.ok(main.includes(`id="${id}"`), `Missing ${id} section`);
    }
    assert.ok(html.includes('data-db-status'));
    assert.ok(html.includes('aria-label="') && html.includes('href="/sv"'));
    assert.ok(!main.includes('<time'));
    assert.ok(!main.includes('from PostgreSQL'));
    assert.ok(!main.includes('från PostgreSQL'));
    assert.ok(html.includes('name="description"'));
    assert.ok(html.includes('src="/db-status.js"'));
    assert.ok(html.includes('src="/site-ui.js"'));
    assert.ok(html.includes('src="/fire-calculator.js"'));
    assert.ok(main.includes('data-fire-form'));
    assert.ok(main.includes('data-pension-template'));
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
