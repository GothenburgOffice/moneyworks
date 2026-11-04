import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/site-ui.js", import.meta.url), "utf8");
function setup({ query = "", blockedHistory = false } = {}) {
  const listeners = {};
  const attributes = {};
  const root = { dataset: { theme: "dark" } };
  const button = {
    hidden: true,
    dataset: { lightLabel: "Switch to light theme", darkLabel: "Switch to dark theme" },
    addEventListener: (event, listener) => {
      listeners[event] = listener;
    },
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
  };
  const links = ["/en", "/sv"].map((href) => ({
    href,
    getAttribute() {
      return this.href;
    },
    setAttribute(name, value) {
      this[name] = value;
    },
  }));
  let preferenceURL = "";
  runInNewContext(source, {
    document: {
      addEventListener() {},
      documentElement: root,
      querySelector: (selector) => (selector === "[data-theme-toggle]" ? button : null),
      querySelectorAll: (selector) => (selector === "[data-locale-link]" ? links : []),
    },
    location: { search: query, href: `https://example.test/en${query}` },
    history: {
      replaceState(state, title, url) {
        if (blockedHistory) throw new Error("History unavailable");
        preferenceURL = url;
      },
    },
    window: { addEventListener() {} },
    URL,
    URLSearchParams,
  });
  return {
    root,
    button,
    attributes,
    links,
    click: listeners.click,
    preferenceURL: () => preferenceURL,
  };
}
test("C defaults to dark and progressively reveals the localized toggle", () => {
  const ui = setup();
  assert.equal(ui.root.dataset.theme, "dark");
  assert.equal(ui.button.hidden, false);
  assert.equal(ui.attributes["aria-label"], "Switch to light theme");
  assert.equal(ui.attributes["aria-pressed"], "true");
});

test("theme switches, persists and follows locale links", () => {
  const ui = setup();
  ui.click();
  assert.equal(ui.root.dataset.theme, "light");
  assert.equal(ui.preferenceURL(), "/en?theme=light");
  assert.equal(ui.attributes["aria-label"], "Switch to dark theme");
  assert.equal(ui.attributes["aria-pressed"], "false");
  assert.equal(ui.links[1].href, "/sv?theme=light");
  ui.click();
  assert.equal(ui.root.dataset.theme, "dark");
  assert.equal(ui.links[0].href, "/en?theme=dark");
});
test("explicit language-link preference selects light without browser storage", () => {
  assert.equal(setup({ query: "?theme=light" }).root.dataset.theme, "light");
});
test("only valid query preferences are accepted", () => {
  assert.equal(setup({ query: "?theme=dark" }).root.dataset.theme, "dark");
  assert.equal(setup({ query: "?theme=invalid" }).root.dataset.theme, "dark");
});
test("theme and locale navigation work when history updates fail", () => {
  const ui = setup({ blockedHistory: true });
  ui.click();
  assert.equal(ui.root.dataset.theme, "light");
  assert.equal(ui.links[1].href, "/sv?theme=light");
});

test("sticky header uses a stable threshold and coalesces passive scroll work", () => {
  const slot = { offsetHeight: 92, dataset: {} };
  const root = { dataset: {} };
  const listeners = {},
    frames = [],
    options = {};
  const window = {
    scrollY: 0,
    addEventListener(event, listener, config) {
      listeners[event] = listener;
      options[event] = config;
    },
  };
  runInNewContext(source, {
    document: {
      addEventListener() {},
      documentElement: root,
      querySelector: (selector) => (selector === "[data-sticky-header]" ? slot : null),
      querySelectorAll: () => [],
    },
    window,
    requestAnimationFrame: (callback) => frames.push(callback),
  });
  assert.equal(slot.dataset.compact, "false");
  window.scrollY = 93;
  listeners.scroll();
  listeners.scroll();
  assert.equal(options.scroll.passive, true);
  assert.equal(frames.length, 1);
  frames.shift()();
  assert.equal(slot.dataset.compact, "true");
  assert.equal(root.dataset.headerCompact, "true");
  window.scrollY = 92;
  listeners.scroll();
  frames.shift()();
  assert.equal(slot.dataset.compact, "false");
  slot.offsetHeight = 78;
  window.scrollY = 80;
  listeners.resize();
  frames.shift()();
  assert.equal(slot.dataset.compact, "true");
  window.scrollY = 0;
  listeners.pageshow();
  frames.shift()();
  assert.equal(slot.dataset.compact, "false");
});

test("native demo pauses on close and hidden document without autoplay", () => {
  let pauses = 0;
  const video = {
    pause: () => pauses++,
    play: () => assert.fail("Enhancement must never autoplay"),
  };
  const demoEvents = {},
    windowEvents = {},
    documentEvents = {},
    frames = [];
  const demo = {
    open: true,
    addEventListener(event, listener) {
      demoEvents[event] = listener;
    },
    querySelector: () => video,
  };
  const document = {
    readyState: "complete",
    hidden: false,
    documentElement: { dataset: {} },
    addEventListener(event, listener) {
      documentEvents[event] = listener;
    },
    querySelector: () => null,
    querySelectorAll: (selector) =>
      ({
        "[data-tool-demo]": [demo],
        "[data-tool-demo] video": [video],
      })[selector] ?? [],
  };
  runInNewContext(source, {
    document,
    requestAnimationFrame: (callback) => frames.push(callback),
    window: {
      addEventListener(event, listener) {
        windowEvents[event] = listener;
      },
      dispatchEvent() {},
    },
  });
  while (frames.length) frames.shift()();
  demoEvents.toggle();
  assert.equal(pauses, 0);
  demo.open = false;
  demoEvents.toggle();
  assert.equal(pauses, 1);
  documentEvents.visibilitychange();
  assert.equal(pauses, 1);
  document.hidden = true;
  documentEvents.visibilitychange();
  assert.equal(pauses, 2);
});
