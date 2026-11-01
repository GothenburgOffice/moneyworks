import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const require = createRequire(new URL("../package.json", import.meta.url));
const { Pool } = require("pg");
if (!process.env.AUTH_TEST_DATABASE_URL)
  throw new Error(
    "Set AUTH_TEST_DATABASE_URL explicitly to a disposable migrated database. This is not a production test.",
  );
const pool = new Pool({ connectionString: process.env.AUTH_TEST_DATABASE_URL });
const fixture = spawn(
  process.execPath,
  [fileURLToPath(new URL("./support/account-runtime.mjs", import.meta.url))],
  { env: process.env, stdio: ["ignore", "pipe", "pipe"] },
);
let diagnostics = "";
fixture.stderr.on("data", (chunk) => {
  diagnostics = (diagnostics + chunk).slice(-4000);
});
await new Promise((resolve, reject) => {
  fixture.stdout.on("data", (chunk) => {
    if (chunk.toString().includes("test fixture ready")) resolve();
  });
  fixture.once("error", reject);
  fixture.once("exit", (code) => {
    if (code) reject(new Error(`Account fixture failed: ${diagnostics}`));
  });
}).catch(async (error) => {
  fixture.kill();
  await pool.end();
  throw error;
});
const base = "http://127.0.0.1:3302";
const email = `mw-auth-qa-${Date.now()}@example.invalid`;
const password = "a long unique automated test passphrase";
const newPassword = "a different long automated test passphrase";
const jar = new Map();
const checks = [];
let counter = 1;
const cookieHeader = () => [...jar].map(([key, value]) => `${key}=${value}`).join("; ");
async function call(path, body, options = {}) {
  const headers = {
    origin: base,
    "content-type": "application/json",
    "x-test-client-ip": `192.0.2.${counter++}`,
    ...options.headers,
  };
  if (!options.noCookie && jar.size) headers.cookie = cookieHeader();
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: "manual",
  });
  for (const set of response.headers.getSetCookie()) {
    const [first] = set.split(";");
    const split = first.indexOf("=");
    const key = first.slice(0, split),
      value = first.slice(split + 1);
    if (!value || /Max-Age=0/i.test(set)) jar.delete(key);
    else jar.set(key, value);
  }
  return response;
}
async function mail(kind) {
  const end = Date.now() + 6000;
  while (Date.now() < end) {
    const messages = await (await fetch("http://127.0.0.1:3304/messages")).json();
    const text = messages.findLast((message) => message.includes(email) && message.includes(kind));
    if (text) return text;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Expected local capture email did not arrive.");
}
function link(text) {
  // SMTP's quoted-printable lines are unfolded for the plain-text fixture.
  const decoded = text
    .replace(/=\r\n/g, "")
    .replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const url = decoded.match(/http:\/\/127\.0\.0\.1:3302\/[^\s<>]+/);
  assert.ok(url, "mail should contain a local verification/recovery link");
  return url[0];
}
try {
  let response = await call("/api/auth/sign-up/email", {
    name: "Test member",
    email,
    password,
    callbackURL: `${base}/en/account`,
  });
  assert.equal(response.status, 200, await response.text());
  assert.equal(jar.size, 0, "no session before email verification");
  const stored = await pool.query(
    'SELECT u."emailVerified",a.password FROM "User" u JOIN "Account" a ON a."userId"=u.id WHERE u.email=$1',
    [email],
  );
  assert.equal(stored.rows[0].emailVerified, false);
  assert.ok(stored.rows[0].password && stored.rows[0].password !== password);
  checks.push("registration persists a password hash, no pre-verification session");
  response = await call("/api/auth/sign-in/email", { email, password, rememberMe: false });
  assert.equal(response.status, 403);
  checks.push("unverified sign-in blocked");
  const verification = link(await mail("Verify your MoneyWorks email"));
  response = await fetch(verification, { redirect: "manual" });
  assert.equal(response.status, 302);
  assert.equal(
    (await pool.query('SELECT "emailVerified" FROM "User" WHERE email=$1', [email])).rows[0]
      .emailVerified,
    true,
  );
  response = await call("/api/auth/sign-in/email", { email, password, rememberMe: false });
  assert.equal(response.status, 200, await response.text());
  const setCookies = response.headers.getSetCookie();
  assert.ok(setCookies.some((cookie) => /HttpOnly/i.test(cookie) && /SameSite=Lax/i.test(cookie)));
  assert.ok(setCookies.every((cookie) => !/Domain=/i.test(cookie)));
  checks.push("verification, sign-in and host-only HttpOnly SameSite cookies");
  const session = await (await call("/api/auth/get-session")).json();
  assert.equal(session.user.email, email);
  const workspaceResponse = await fetch(`${base}/en/account`, {
    headers: { cookie: cookieHeader() },
  });
  assert.match(workspaceResponse.headers.get("cache-control"), /no-store/);
  assert.equal(workspaceResponse.headers.get("referrer-policy"), "strict-origin");
  assert.equal(workspaceResponse.headers.get("x-frame-options"), "DENY");
  const workspace = await workspaceResponse.text();
  assert.ok(
    workspace.includes(email) &&
      workspace.includes("Portfolio saving and tax workspaces will be added later"),
  );
  assert.ok(
    !workspace.includes(password) &&
      !workspace.includes(stored.rows[0].password) &&
      !workspace.includes("private-test-fixture-only"),
  );
  checks.push("database-validated private workspace, no invented financial records");
  response = await call(
    "/api/auth/sign-out",
    {},
    { headers: { origin: "https://attacker.invalid" } },
  );
  assert.equal(response.status, 403);
  response = await fetch(`${base}/api/account/logout`, {
    method: "POST",
    headers: { origin: "https://attacker.invalid" },
    body: "locale=en",
  });
  assert.equal(response.status, 403);
  checks.push("direct API and native form reject cross-site mutation");
  response = await fetch(`${base}/api/account/logout`, {
    method: "POST",
    headers: {
      origin: "http://localhost:3302",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "locale=en",
    redirect: "manual",
  });
  assert.equal(response.status, 303);
  assert.ok(response.headers.get("location").startsWith("http://localhost:3302/en/account"));
  checks.push("an APP_ORIGIN_ALIASES origin is accepted and stays on its own origin");
  response = await call("/api/auth/sign-out");
  assert.equal(response.status, 405);
  assert.equal((await (await call("/api/auth/get-session")).json()).user.email, email);
  response = await call("/api/auth/link-social", { provider: "google" });
  assert.equal(response.status, 404);
  checks.push("GET cannot sign out and unconfigured provider/link endpoints are unavailable");
  response = await call("/api/auth/request-password-reset", {
    email,
    redirectTo: "https://attacker.invalid/reset",
  });
  assert.equal(response.status, 403);
  checks.push("external recovery redirects rejected");
  response = await call("/api/auth/request-password-reset", {
    email,
    redirectTo: `${base}/en/account?view=reset`,
  });
  assert.equal(response.status, 200);
  const recovery = link(await mail("Reset your MoneyWorks password"));
  const recoveryResponse = await fetch(recovery, { redirect: "manual" });
  assert.equal(recoveryResponse.status, 302);
  const recoveryLocation = new URL(recoveryResponse.headers.get("location"), base);
  const token = recoveryLocation.searchParams.get("token");
  assert.ok(token);
  response = await call("/api/auth/reset-password", { newPassword, token });
  assert.equal(response.status, 200, await response.text());
  assert.equal(await (await call("/api/auth/get-session")).json(), null);
  response = await call("/api/auth/reset-password", { newPassword: password, token });
  assert.ok(response.status >= 400, "reset token must be one-time");
  checks.push("recovery changes password, revokes sessions and rejects token replay");
  jar.clear();
  response = await call("/api/auth/sign-in/email", { email, password, rememberMe: false });
  assert.ok(response.status >= 400);
  response = await call("/api/auth/sign-in/email", {
    email,
    password: newPassword,
    rememberMe: false,
  });
  assert.equal(response.status, 200);
  await call("/api/auth/sign-out", {});
  assert.equal(await (await call("/api/auth/get-session")).json(), null);
  checks.push("old password rejected, new password works, logout revokes session");
  for (let i = 0; i < 6; i++) {
    response = await call(
      "/api/auth/sign-in/email",
      { email, password: "incorrect password" },
      {
        headers: {
          "x-test-client-ip": "198.51.100.42",
          "x-moneyworks-client-ip": `203.0.113.${i + 1}`,
        },
        noCookie: true,
      },
    );
    if (i === 5) assert.equal(response.status, 429);
  }
  checks.push("database-backed login rate limit");
  response = await call("/api/auth/sign-up/email", {
    name: "Test member",
    email: email.replace("@", "-short@"),
    password: "short",
  });
  assert.ok(response.status >= 400);
  response = await call("/api/auth/sign-in/email", { email, password: "x".repeat(9000) });
  assert.equal(response.status, 413);
  checks.push("short passwords and oversized request bodies rejected");
  response = await call("/api/auth/sign-up/email", { name: "Test member", email, password });
  assert.equal(response.status, 200, "existing-account registration must not enumerate");
  response = await call("/api/auth/request-password-reset", {
    email: email.replace("@", "-missing@"),
    redirectTo: `${base}/en/account?view=reset`,
  });
  assert.equal(response.status, 200, "unknown recovery address gets same status");
  checks.push("registration and recovery avoid account enumeration");
  for (const locale of ["en", "sv"]) {
    const anonymous = await fetch(`${base}/${locale}`, { headers: { "accept-language": "sv" } });
    assert.equal(
      anonymous.headers.getSetCookie().length,
      0,
      "anonymous content must not set cookies",
    );
    assert.ok((await anonymous.text()).includes("cookie-information"));
  }
  checks.push("anonymous bilingual pages set no cookies");

  const insertScenario = (userId) =>
    pool.query(
      `INSERT INTO "Scenario" (id, "userId", "toolId", name, "schemaVersion", data, "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'fire', 'Test plan', 1, '{"spending":1}', now())`,
      [userId],
    );
  await assert.rejects(insertScenario("no-such-user"), /foreign key/);
  const { id: userId } = (await pool.query('SELECT id FROM "User" WHERE email=$1', [email]))
    .rows[0];
  await insertScenario(userId);
  await pool.query('DELETE FROM "User" WHERE id=$1', [userId]);
  assert.equal(
    (await pool.query('SELECT count(*)::int AS n FROM "Scenario" WHERE "userId"=$1', [userId]))
      .rows[0].n,
    0,
  );
  checks.push("scenarios require an existing user and are deleted with the user");
  console.log(
    JSON.stringify(
      {
        checks,
        passed: checks.length,
        realEmailsSent: 0,
        newRuntimeDependencies: ["better-auth", "nodemailer"],
      },
      null,
      2,
    ),
  );
} finally {
  try {
    await pool.query('DELETE FROM "User" WHERE email=$1', [email]);
    await pool.query('DELETE FROM "RateLimit" WHERE key LIKE $1 OR key LIKE $2', [
      "%192.0.2.%",
      "%198.51.100.42%",
    ]);
  } finally {
    await pool.end();
    fixture.kill("SIGTERM");
  }
}
