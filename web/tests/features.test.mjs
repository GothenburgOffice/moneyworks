import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseAccountQuery,
  accountFormViews,
  accountMessages,
} from "../src/features/account/view.ts";
import { getTools, toolCatalog } from "../src/features/tools/catalog.ts";
import { getAccountCopy } from "../src/content/account.ts";
import { getPrivacyCopy } from "../src/content/privacy.ts";
import { getFireCopy } from "../src/content/fire.ts";

test("FIRE controller copy keys exist in both locales", () => {
  const controller = readFileSync(
    new URL("../src/enhancements/fire-calculator.js", import.meta.url),
    "utf8",
  );
  const keys = new Set(
    [...controller.matchAll(/\bcopy\.([A-Za-z_]\w*)/g)].map((match) => match[1]),
  );
  for (const locale of ["en", "sv"]) {
    const copy = getFireCopy(locale);
    for (const key of keys)
      assert.equal(typeof copy[key], "string", `Missing ${locale} FIRE copy: ${key}`);
  }
});

test("FIRE result selectors used by the controller exist in its server-rendered view", () => {
  const controller = readFileSync(
    new URL("../src/enhancements/fire-calculator.js", import.meta.url),
    "utf8",
  );
  const view = readFileSync(
    new URL("../src/components/fire/fire-results.tsx", import.meta.url),
    "utf8",
  );
  const attributes = new Set(
    [...view.matchAll(/\b(data-result-[a-z-]+)(?=[\s=>])/g)].map((match) => match[1]),
  );
  const selectors = [
    ...controller.matchAll(
      /(?:text|querySelector|querySelectorAll)\(["']\[(data-result-[a-z-]+)\]["']/g,
    ),
  ];
  assert.ok(selectors.length > 10);
  for (const [, attribute] of selectors)
    assert.ok(attributes.has(attribute), `Missing result marker: ${attribute}`);
});

test("account query allows only implemented views and feedback", () => {
  for (const view of [...accountFormViews, "privacy"])
    assert.equal(parseAccountQuery({ view }).view, view);
  for (const message of accountMessages)
    assert.equal(parseAccountQuery({ message }).message, message);
});

test("unknown and repeated query parameters cannot select arbitrary views or copy", () => {
  for (const view of ["logout", "../auth", "constructor", ["register", "login"]]) {
    assert.equal(parseAccountQuery({ view }).view, "login");
  }
  for (const message of ["privacyRetention", "constructor", ["failed"]]) {
    assert.equal(parseAccountQuery({ message }).message, undefined);
  }
});

test("reset tokens preserve valid links and reject oversized or repeated values", () => {
  const token = "url-token_123";
  assert.equal(parseAccountQuery({ view: "reset", token }).token, token);
  assert.equal(parseAccountQuery({ token: "x".repeat(2048) }).token.length, 2048);
  assert.equal(parseAccountQuery({ token: "x".repeat(2049) }).token, "");
  assert.equal(parseAccountQuery({ token: [token] }).token, "");
  assert.equal(parseAccountQuery({}).hasError, false);
  assert.equal(parseAccountQuery({ error: "verification-failed" }).hasError, true);
});

test("catalogue retains approved stable IDs and honest implementation status", () => {
  assert.deepEqual(
    toolCatalog.map((tool) => tool.id),
    ["fire", "crypto"],
  );
  assert.equal(new Set(toolCatalog.map((tool) => tool.id)).size, toolCatalog.length);
  assert.equal(toolCatalog[0].status, "available");
  assert.equal(toolCatalog[0].href, "#fire-calculator");
  assert.equal(toolCatalog[1].status, "planned");
});

test("every catalogue entry has complete localized content in both languages", () => {
  for (const locale of ["en", "sv"]) {
    const { Site } = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
    for (const tool of getTools(Site.tools)) {
      for (const key of ["category", "title", "description", "context", "detailTitle", "note"]) {
        assert.ok(
          typeof tool.content[key] === "string" && tool.content[key].length,
          `${locale}/${tool.id}/${key}`,
        );
      }
      assert.ok(tool.content.items.length);
    }
  }
});

test("account and privacy translations have matching keys and separate responsibilities", () => {
  assert.deepEqual(Object.keys(getAccountCopy("en")), Object.keys(getAccountCopy("sv")));
  assert.deepEqual(Object.keys(getPrivacyCopy("en")), Object.keys(getPrivacyCopy("sv")));
  assert.equal("cookieShort" in getAccountCopy("en"), false);
  assert.equal("loginTitle" in getPrivacyCopy("en"), false);
});
