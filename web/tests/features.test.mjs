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
  publicPagePaths,
  toolCatalog,
  toolPath,
} from "../src/features/tools/catalog.ts";
import {
  languageLinkHeader,
  parseLocaleOrigins,
  sitemapEntries,
  sitemapUrl,
} from "../src/features/site/language-links.ts";
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

const locales = ["en", "sv"];
const origins = { en: "https://moneyworks.example", sv: "https://pengarjobbar.example" };

test("language home domains need one valid origin per locale", () => {
  assert.deepEqual(
    parseLocaleOrigins(
      " en=https://moneyworks.example/ , sv=https://pengarjobbar.example",
      locales,
    ),
    origins,
  );
  assert.deepEqual(
    parseLocaleOrigins("en=http://localhost:3410,sv=http://localhost:3410", locales),
    {
      en: "http://localhost:3410",
      sv: "http://localhost:3410",
    },
  );
  for (const value of [
    "",
    "en=https://moneyworks.example",
    "en=https://moneyworks.example,sv=https://pengarjobbar.example,de=https://x.example",
    "en=https://moneyworks.example,en=https://other.example,sv=https://pengarjobbar.example",
    "en=https://moneyworks.example/en,sv=https://pengarjobbar.example",
    "en=ftp://moneyworks.example,sv=https://pengarjobbar.example",
    "en=moneyworks.example,sv=https://pengarjobbar.example",
    "https://moneyworks.example,sv=https://pengarjobbar.example",
  ])
    assert.equal(parseLocaleOrigins(value, locales), null, value);
});

test("public pages link canonical and hreflang copies on each language's domain", () => {
  const options = { locales, defaultLocale: "en", pagePaths: publicPagePaths };
  assert.equal(
    languageLinkHeader("/sv/tools/fire", origins, options),
    [
      '<https://pengarjobbar.example/sv/tools/fire>; rel="canonical"',
      '<https://moneyworks.example/en/tools/fire>; rel="alternate"; hreflang="en"',
      '<https://pengarjobbar.example/sv/tools/fire>; rel="alternate"; hreflang="sv"',
      '<https://moneyworks.example/en/tools/fire>; rel="alternate"; hreflang="x-default"',
    ].join(", "),
  );
  assert.match(
    languageLinkHeader("/en", origins, options),
    /^<https:\/\/moneyworks\.example\/en>; rel="canonical"/,
  );
  for (const path of ["/", "/en/account", "/sv/tools/crypto", "/de", "/en/tools/fire/x"])
    assert.equal(languageLinkHeader(path, origins, options), null, path);
});

test("each domain's sitemap lists its own languages' pages with alternates", () => {
  const options = { locales, defaultLocale: "en", pagePaths: publicPagePaths };
  const swedish = sitemapEntries("pengarjobbar.example", origins, options);
  assert.deepEqual(
    swedish.map((entry) => entry.url),
    ["https://pengarjobbar.example/sv", "https://pengarjobbar.example/sv/tools/fire"],
  );
  assert.deepEqual(swedish[1].alternates.languages, {
    en: "https://moneyworks.example/en/tools/fire",
    sv: "https://pengarjobbar.example/sv/tools/fire",
    "x-default": "https://moneyworks.example/en/tools/fire",
  });
  assert.deepEqual(sitemapEntries("other.example", origins, options), []);
  const shared = { en: "https://pengar.example", sv: "https://pengar.example" };
  assert.equal(sitemapEntries("pengar.example", shared, options).length, 4);
  assert.equal(sitemapUrl("moneyworks.example", origins), "https://moneyworks.example/sitemap.xml");
  assert.equal(sitemapUrl("127.0.0.1:3000", origins), undefined);
});
