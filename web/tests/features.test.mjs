import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseAccountQuery,
  accountFormViews,
  accountMessages,
} from "../src/features/account/view.ts";
import {
  availableToolIds,
  getTools,
  toolCatalog,
  toolPath,
} from "../src/features/tools/catalog.ts";
import { getAccountCopy } from "../src/content/account.ts";
import { getPrivacyCopy } from "../src/content/privacy.ts";

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

test("provider callback errors map to their own messages; others to the generic one", () => {
  assert.deepEqual(
    [
      parseAccountQuery({ error: "signup_disabled" }).message,
      parseAccountQuery({ error: "signup_disabled" }).hasError,
    ],
    ["googleSignupClosed", false],
  );
  assert.equal(parseAccountQuery({ error: "email_not_verified" }).message, "googleUnverified");
  for (const error of ["state_not_found", "constructor", "toString"]) {
    const parsed = parseAccountQuery({ error, message: "passwordChanged" });
    assert.equal(parsed.hasError, true);
    assert.equal(parsed.message, "passwordChanged");
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
  assert.equal(toolCatalog[1].status, "planned");
  assert.deepEqual(availableToolIds, ["fire"]);
  // Only the locale prefix differs between languages.
  assert.equal(toolPath("en", "fire"), "/en/tools/fire");
  assert.equal(toolPath("sv", "fire"), "/sv/tools/fire");
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
