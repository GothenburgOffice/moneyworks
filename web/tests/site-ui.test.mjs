import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/site-ui.js", import.meta.url), "utf8");

// The inline <head> script from components/theme-script.tsx, run the same way.
const themeScript = readFileSync(
  new URL("../src/components/theme-script.tsx", import.meta.url),
  "utf8",
)
  .match(/const script = `([^`]+)`/)[1]
  .replace("${themeStorageKey}", "theme");

function browser({ stored = null, systemLight = false, blockedStorage = false } = {}) {
  const store = new Map(stored ? [["theme", stored]] : []);
  const localStorage = {
    getItem(key) {
      if (blockedStorage) throw new Error("SecurityError");
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      if (blockedStorage) throw new Error("SecurityError");
      store.set(key, value);
    },
  };
  const media = { matches: systemLight, listener: null };
  media.addEventListener = (event, listener) => {
    media.listener = listener;
  };
  const windowListeners = {};
  const window = {
    addEventListener(event, listener) {
      windowListeners[event] = listener;
    },
    matchMedia: () => media,
  };
  return { store, localStorage, media, window, windowListeners, matchMedia: window.matchMedia };
}

function setup(options) {
  const env = browser(options);
  const root = { dataset: { theme: "dark" } };
  runInNewContext(themeScript, {
    document: { documentElement: root },
    localStorage: env.localStorage,
    window: env.window,
    matchMedia: env.matchMedia,
  });
  const clicks = {};
  const attributes = {};
  const button = {
    hidden: true,
    dataset: { lightLabel: "Switch to light theme", darkLabel: "Switch to dark theme" },
    addEventListener: (event, listener) => {
      clicks[event] = listener;
    },
    setAttribute: (name, value) => {
      attributes[name] = value;
    },
  };
  runInNewContext(source, {
    document: {
      addEventListener() {},
      documentElement: root,
      querySelector: (selector) => (selector === "[data-theme-toggle]" ? button : null),
      querySelectorAll: () => [],
    },
    localStorage: env.localStorage,
    window: env.window,
  });
  return { ...env, root, button, attributes, click: clicks.click };
}

test("the head script follows the system until a theme is picked", () => {
  assert.equal(setup().root.dataset.theme, "dark");
  assert.equal(setup({ systemLight: true }).root.dataset.theme, "light");
  assert.equal(setup({ stored: "dark", systemLight: true }).root.dataset.theme, "dark");
  assert.equal(setup({ stored: "light" }).root.dataset.theme, "light");
  assert.equal(setup({ stored: "blue", systemLight: true }).root.dataset.theme, "light");
  assert.equal(setup({ blockedStorage: true, systemLight: true }).root.dataset.theme, "light");
});

test("the toggle is revealed with a localized label matching the theme", () => {
  const ui = setup();
  assert.equal(ui.button.hidden, false);
  assert.equal(ui.attributes["aria-label"], "Switch to light theme");
  assert.equal(ui.attributes["aria-pressed"], "true");
  const light = setup({ systemLight: true });
  assert.equal(light.attributes["aria-label"], "Switch to dark theme");
  assert.equal(light.attributes["aria-pressed"], "false");
});

test("a picked theme is stored and no URL is touched", () => {
  const ui = setup();
  assert.equal(ui.store.size, 0, "nothing is stored before a pick");
  ui.click();
  assert.equal(ui.root.dataset.theme, "light");
  assert.equal(ui.store.get("theme"), "light");
  assert.equal(ui.attributes["aria-label"], "Switch to dark theme");
  ui.click();
  assert.equal(ui.root.dataset.theme, "dark");
  assert.equal(ui.store.get("theme"), "dark");
  assert.doesNotMatch(source, /history\.|location\.|\?theme=/);
});

test("system changes apply only until a theme is picked", () => {
  const ui = setup();
  ui.media.listener({ matches: true });
  assert.equal(ui.root.dataset.theme, "light");
  ui.click(); // picks dark
  ui.media.listener({ matches: true });
  assert.equal(ui.root.dataset.theme, "dark");
});

test("another tab's pick is followed", () => {
  const ui = setup();
  ui.windowListeners.storage({ key: "theme", newValue: "light" });
  assert.equal(ui.root.dataset.theme, "light");
  assert.equal(ui.attributes["aria-pressed"], "false");
  ui.windowListeners.storage({ key: "theme", newValue: "blue" });
  assert.equal(ui.root.dataset.theme, "light");
});

test("blocked storage still switches the theme for the page", () => {
  const ui = setup({ blockedStorage: true });
  ui.click();
  assert.equal(ui.root.dataset.theme, "light");
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
