import { defineConfig, devices } from "@playwright/test";

// Account pages in a real browser. Unlike playwright.config.ts this starts its own
// server: the loopback account fixture (tests/support/account-runtime.mjs) on the
// production build, with a capture-only mailbox, against AUTH_TEST_DATABASE_URL.
// That must be a disposable, migrated database; the tests delete what they create.
if (!process.env.AUTH_TEST_DATABASE_URL)
  throw new Error(
    "Set AUTH_TEST_DATABASE_URL to a disposable migrated database (and run npm run build first).",
  );

export default defineConfig({
  testDir: "tests/e2e-accounts",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  globalTeardown: "./tests/e2e-accounts/teardown.ts",
  webServer: {
    command: "node tests/support/account-runtime.mjs",
    url: "http://127.0.0.1:3302/api/health",
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
  },
  use: {
    baseURL: "http://127.0.0.1:3302",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
