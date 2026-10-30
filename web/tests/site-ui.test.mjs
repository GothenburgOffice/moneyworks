import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../public/site-ui.js', import.meta.url), 'utf8');
function setup({ query = '', blockedHistory = false } = {}) {
  const listeners = {};
  const attributes = {};
  const root = { dataset: { theme: 'dark' } };
  const button = {
    hidden: true,
    dataset: { lightLabel: 'Switch to light theme', darkLabel: 'Switch to dark theme' },
    addEventListener: (event, listener) => { listeners[event] = listener; },
    setAttribute: (name, value) => { attributes[name] = value; },
  };
  const links = ['/en', '/sv'].map(href => ({
    href, getAttribute() { return this.href; },
    setAttribute(name, value) { this[name] = value; },
  }));
  let preferenceURL = '';
  runInNewContext(source, {
    document: {
      documentElement: root, querySelector: () => button,
      querySelectorAll: selector => selector === '[data-locale-link]' ? links : [],
    },
    location: { search: query, href: `https://example.test/en${query}` },
    history: { replaceState(state, title, url) { if (blockedHistory) throw new Error('History unavailable'); preferenceURL = url; } },
    URL, URLSearchParams,
  });
  return { root, button, attributes, links, click: listeners.click, preferenceURL: () => preferenceURL };
}
test('C defaults to dark and progressively reveals the localized toggle', () => {
  const ui = setup();
  assert.equal(ui.root.dataset.theme, 'dark');
  assert.equal(ui.button.hidden, false);
  assert.equal(ui.attributes['aria-label'], 'Switch to light theme');
  assert.equal(ui.attributes['aria-pressed'], 'true');
});
test('theme switches, persists and follows locale links', () => {
  const ui = setup();
  ui.click();
  assert.equal(ui.root.dataset.theme, 'light');
  assert.equal(ui.preferenceURL(), '/en?theme=light');
  assert.equal(ui.attributes['aria-label'], 'Switch to dark theme');
  assert.equal(ui.attributes['aria-pressed'], 'false');
  assert.equal(ui.links[1].href, '/sv?theme=light');
  ui.click();
  assert.equal(ui.root.dataset.theme, 'dark');
  assert.equal(ui.links[0].href, '/en?theme=dark');
});
test('explicit language-link preference selects light without browser storage', () => {
  assert.equal(setup({ query: '?theme=light' }).root.dataset.theme, 'light');
});
test('only valid query preferences are accepted', () => {
  assert.equal(setup({ query: '?theme=dark' }).root.dataset.theme, 'dark');
  assert.equal(setup({ query: '?theme=invalid' }).root.dataset.theme, 'dark');
});
test('theme and locale navigation work when the iframe restricts history', () => {
  const ui = setup({ blockedHistory: true });
  ui.click();
  assert.equal(ui.root.dataset.theme, 'light');
  assert.equal(ui.links[1].href, '/sv?theme=light');
});
