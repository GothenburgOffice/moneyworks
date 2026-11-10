import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  accountStatus,
  buildAccountExport,
  canRemoveAccess,
  exportFileName,
  parseUserListQuery,
  purgeDate,
  removesAccess,
  TRASH_DAYS,
  userListSearch,
} from "../src/features/account/lifecycle.ts";

test("the users list query keeps allowlisted values and falls back on anything else", () => {
  assert.deepEqual(parseUserListQuery({}), {
    q: "",
    scope: "all",
    sort: "created",
    dir: "desc",
    page: 1,
  });
  assert.deepEqual(
    parseUserListQuery({ q: "  ann@ ", scope: "trash", sort: "email", dir: "asc", page: "3" }),
    { q: "ann@", scope: "trash", sort: "email", dir: "asc", page: 3 },
  );
  for (const page of ["0", "-1", "1.5", "x", "100001"])
    assert.equal(parseUserListQuery({ page }).page, 1);
  const odd = parseUserListQuery({
    scope: "constructor",
    sort: "password",
    dir: "sideways",
    q: ["a", "b"],
  });
  assert.deepEqual([odd.scope, odd.sort, odd.dir, odd.q], ["all", "created", "desc", ""]);
  assert.equal(parseUserListQuery({ q: "x".repeat(500) }).q.length, 200);
});

test("the users list search string round-trips and leaves defaults out", () => {
  const query = parseUserListQuery({ q: "a&b", scope: "locked", page: "2" });
  const search = userListSearch(query);
  assert.equal(search, "?q=a%26b&scope=locked&page=2");
  assert.deepEqual(parseUserListQuery(Object.fromEntries(new URLSearchParams(search))), query);
  assert.equal(userListSearch(parseUserListQuery({})), "");
  assert.equal(userListSearch(query, { page: 1, q: "" }), "?scope=locked");
});

test("only locking and the trash take access away, never from the last active admin", () => {
  assert.deepEqual(["lock", "unlock", "trash", "restore"].map(removesAccess), [
    true,
    false,
    true,
    false,
  ]);
  assert.equal(canRemoveAccess(false, false), true);
  assert.equal(canRemoveAccess(true, true), true);
  assert.equal(canRemoveAccess(true, false), false);
});

test("trash and lock state, and the purge date", () => {
  const at = new Date("2026-11-06T10:00:00Z");
  assert.equal(purgeDate(at).toISOString(), "2026-12-06T10:00:00.000Z");
  assert.equal(accountStatus({ lockedAt: null, deletedAt: null }), "Active");
  assert.equal(accountStatus({ lockedAt: at, deletedAt: null }), "Locked");
  assert.equal(accountStatus({ lockedAt: at, deletedAt: at }), "Trash");
});

test("the cleanup script purges the trash after the same number of days", () => {
  const script = readFileSync("scripts/cleanup-auth.mjs", "utf8");
  assert.match(script, new RegExp(`const TRASH_DAYS = ${TRASH_DAYS};`));
  assert.match(
    script,
    /\["User", '"deletedAt" < NOW\(\) - make_interval\(days => \$1\)', \[TRASH_DAYS\]\]/,
  );
});

test("the export holds the member's data and nothing that signs in", () => {
  const at = new Date("2026-11-01T08:00:00Z");
  const now = new Date("2026-11-06T09:30:00Z");
  const data = buildAccountExport(
    {
      user: {
        id: "u1",
        name: "MoneyWorks member",
        image: null,
        email: "member@example.test",
        emailVerified: true,
        isAdmin: false,
        createdAt: at,
        updatedAt: at,
        lastSignInAt: null,
      },
      accounts: [
        { providerId: "credential", accountId: "u1", createdAt: at, updatedAt: at },
        { providerId: "google", accountId: "g-123", createdAt: at, updatedAt: at },
      ],
      sessions: [
        {
          createdAt: at,
          updatedAt: at,
          expiresAt: now,
          ipAddress: "192.0.2.1",
          userAgent: "Test browser",
          current: true,
        },
      ],
      scenarios: [
        {
          id: "s1",
          toolId: "fire",
          name: "Plan",
          schemaVersion: 1,
          data: { spending: 1 },
          createdAt: at,
          updatedAt: at,
        },
      ],
    },
    now,
  );
  assert.equal(data.format, "moneyworks-account-export");
  assert.equal(data.version, 1);
  assert.equal(data.exportedAt, "2026-11-06T09:30:00.000Z");
  assert.equal(data.account.email, "member@example.test");
  assert.equal(data.account.name, "MoneyWorks member");
  assert.equal(data.account.image, null);
  assert.equal(data.account.lastSignInAt, null);
  assert.deepEqual(
    data.signInMethods.map((method) => method.method),
    ["password", "google"],
  );
  assert.equal(data.signInMethods[1].googleAccountId, "g-123");
  assert.equal(data.sessions[0].current, true);
  assert.deepEqual(data.scenarios[0].data, { spending: 1 });
  const text = JSON.stringify(data);
  assert.doesNotMatch(text, /password"\s*:|token|hash/i);
  assert.equal(exportFileName(now), "moneyworks-account-2026-11-06.json");
});
