import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../public/db-status.js", import.meta.url), "utf8");
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const expected = process.env.EXPECTED_DB_STATUS ?? "connected";

for (const [locale, connected, unavailable] of [
  ["en", "Database connection: OK", "Database connection: unavailable"],
  ["sv", "Databasanslutning: OK", "Databasanslutning: inte tillgänglig"],
]) {
  test(`${locale}: the actual enhancement script reports the live database result`, async () => {
    const element = { textContent: "checking", dataset: { connected, unavailable } };
    await runInNewContext(source, {
      document: {
        querySelector: () => element,
        currentScript: { dataset: { healthUrl: `${base}/api/health/db` } },
      },
      fetch,
      AbortController,
      setTimeout,
      clearTimeout,
    });
    assert.equal(element.textContent, expected === "connected" ? connected : unavailable);
  });
}

test("a failed network request cannot show fake database success", async () => {
  const element = {
    textContent: "checking",
    dataset: {
      connected: "Database connection: OK",
      unavailable: "Database connection: unavailable",
    },
  };
  await runInNewContext(source, {
    document: { querySelector: () => element, currentScript: null },
    fetch: async () => {
      throw new Error("Network unavailable");
    },
    AbortController,
    setTimeout,
    clearTimeout,
  });
  assert.equal(element.textContent, element.dataset.unavailable);
});
