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
  assert.ok(
    link(await mail("You already have a MoneyWorks account")).endsWith("/en/account?view=login"),
  );
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

  // /admin: native form posts, an admin bootstrapped from ADMIN_EMAIL/ADMIN_PASSWORD.
  jar.clear();
  const adminForm = (action, fields, headers = {}) =>
    fetch(`${base}/api/admin/${action}`, {
      method: "POST",
      redirect: "manual",
      headers: {
        origin: base,
        "content-type": "application/x-www-form-urlencoded",
        "x-test-client-ip": `198.51.100.${counter++}`,
        ...(jar.size ? { cookie: cookieHeader() } : {}),
        ...headers,
      },
      body: new URLSearchParams(fields),
    }).then((response) => {
      for (const set of response.headers.getSetCookie()) {
        const [first] = set.split(";");
        const [key, value] = [
          first.slice(0, first.indexOf("=")),
          first.slice(first.indexOf("=") + 1),
        ];
        if (!value || /Max-Age=0/i.test(set)) jar.delete(key);
        else jar.set(key, value);
      }
      return response;
    });
  const message = (result) => new URL(result.headers.get("location")).searchParams.get("message");
  // A member signing in at /admin fails like a wrong password and keeps no session.
  const memberSessions = async () =>
    (
      await pool.query(
        'SELECT count(*)::int AS n FROM "Session" s JOIN "User" u ON u.id = s."userId" WHERE u.email = $1',
        [email],
      )
    ).rows[0].n;
  const sessionsBefore = await memberSessions();
  response = await adminForm("login", { email, password: newPassword });
  assert.equal(message(response), "failed");
  assert.equal(await memberSessions(), sessionsBefore);
  assert.equal(jar.size, 0);
  checks.push("a member signing in at /admin fails the same way and keeps no session");

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
  const adminEmail = "mw-admin-qa@example.invalid";
  const settingsFields = {
    controllerName: "Automated test controller, not a public operator",
    contactEmail: "test-controller@example.invalid",
    smtpHost: "127.0.0.1",
    smtpPort: "10252",
    mailFrom: "test-mail@example.invalid",
  };
  const setting = async (key) =>
    (await pool.query('SELECT value FROM "SiteSetting" WHERE key=$1', [key])).rows[0]?.value;
  assert.equal((await adminForm("settings", settingsFields)).status, 404, "settings need an admin");
  assert.ok(!(await (await fetch(`${base}/admin`)).text()).includes("Site settings"));
  // Someone registered the admin email first but never verified it: the bootstrap
  // takes that account over instead of keeping its stranger-chosen password.
  await pool.query(
    `INSERT INTO "User" (id, name, email, "emailVerified", "updatedAt")
     VALUES ('squatter-qa', 'Squatter', $1, false, now())`,
    [adminEmail],
  );
  await pool.query(
    `INSERT INTO "Account" (id, "accountId", "providerId", "userId", password, "updatedAt")
     VALUES ('squatter-qa-credential', 'squatter-qa', 'credential', 'squatter-qa', 'not-a-hash', now())`,
  );
  response = await adminForm("login", { email: adminEmail, password: "not the admin password" });
  assert.equal(new URL(response.headers.get("location")).searchParams.get("message"), "failed");
  assert.equal(jar.size, 0);
  response = await adminForm("login", {
    email: adminEmail,
    password: "an automated admin test passphrase",
  });
  assert.equal(response.status, 303);
  assert.ok(jar.size, "admin sign-in sets a session cookie");
  assert.deepEqual(
    (await pool.query('SELECT "isAdmin","emailVerified" FROM "User" WHERE email=$1', [adminEmail]))
      .rows[0],
    { isAdmin: true, emailVerified: true },
  );
  assert.notEqual(
    (await pool.query(`SELECT password FROM "Account" WHERE "userId"='squatter-qa'`)).rows[0]
      .password,
    "not-a-hash",
    "the unverified squatter's password is replaced",
  );
  let page = await (await fetch(`${base}/admin`, { headers: { cookie: cookieHeader() } })).text();
  assert.ok(page.includes("Site settings") && page.includes("test-controller@example.invalid"));
  checks.push("admin bootstrap takes over an unverified squatter; others get 404");

  response = await adminForm("settings", {
    ...settingsFields,
    smtpUser: "mailer",
    smtpPassword: "an smtp test-only password",
  });
  assert.equal(new URL(response.headers.get("location")).searchParams.get("message"), "saved");
  const storedPassword = await setting("smtp.password");
  assert.match(storedPassword, /^v1:/);
  assert.ok(!storedPassword.includes("an smtp test-only password"));
  page = await (await fetch(`${base}/admin`, { headers: { cookie: cookieHeader() } })).text();
  assert.ok(page.includes("set (leave blank to keep it)") && !page.includes("test-only password"));
  response = await adminForm("settings", { ...settingsFields, allowRegistration: "on" });
  assert.equal(
    new URL(response.headers.get("location")).searchParams.get("message"),
    "registrationBlocked",
    "example privacy details cannot open public registration",
  );
  assert.equal(await setting("registration.allowed"), "");
  response = await adminForm("settings", { ...settingsFields, smtpPort: "99999" });
  assert.equal(new URL(response.headers.get("location")).searchParams.get("message"), "invalid");
  assert.equal(await setting("smtp.port"), "10252");
  assert.equal(
    (await adminForm("settings", settingsFields, { origin: "https://attacker.invalid" })).status,
    403,
  );
  await adminForm("settings", { ...settingsFields, clearSmtpPassword: "on" });
  assert.equal(await setting("smtp.password"), undefined);
  assert.equal(await setting("smtp.user"), "");
  checks.push("admin settings: SMTP password stored encrypted, never shown; bad input rejected");

  // Google sign-in: client saved at /admin (secret encrypted), then the form starts
  // Google's flow. The callback itself needs Google, so it is tested by hand.
  const googleFields = {
    ...settingsFields,
    googleClientId: "1234-test.apps.googleusercontent.com",
    googleClientSecret: "a google test-only client secret",
  };
  response = await adminForm("settings", { ...googleFields, googleClientId: "not-a-client-id" });
  assert.equal(message(response), "invalid");
  assert.equal(message(await adminForm("settings", googleFields)), "saved");
  assert.equal(await setting("google.client_id"), "1234-test.apps.googleusercontent.com");
  assert.match(await setting("google.client_secret"), /^v1:/);
  page = await (await fetch(`${base}/admin`, { headers: { cookie: cookieHeader() } })).text();
  assert.ok(!page.includes("google test-only client secret"));
  assert.ok(page.includes(`${base}/api/auth/callback/google`));
  assert.ok(
    (await (await fetch(`${base}/en/account?view=privacy`)).text()).includes(
      "If you sign in with Google",
    ),
  );
  checks.push("Google client saved at /admin, secret encrypted and never shown");

  const startGoogle = (origin) =>
    fetch(`${base}/api/account/google`, {
      method: "POST",
      redirect: "manual",
      headers: {
        origin,
        "content-type": "application/x-www-form-urlencoded",
        "x-test-client-ip": `198.51.100.${counter++}`,
      },
      body: "locale=sv",
    });
  assert.ok((await (await fetch(`${base}/sv/account`)).text()).includes("Fortsätt med Google"));
  response = await startGoogle(base);
  assert.equal(response.status, 303);
  const google = new URL(response.headers.get("location"));
  assert.equal(google.origin, "https://accounts.google.com");
  assert.equal(google.searchParams.get("client_id"), "1234-test.apps.googleusercontent.com");
  assert.equal(google.searchParams.get("redirect_uri"), `${base}/api/auth/callback/google`);
  assert.ok(google.searchParams.get("state"));
  assert.ok(response.headers.getSetCookie().length, "the flow's state cookie is set");
  response = await startGoogle("http://localhost:3302");
  assert.match(response.headers.get("location"), /view=login&message=unavailable/);
  assert.equal((await startGoogle("https://attacker.invalid")).status, 403);
  checks.push("Google sign-in starts only from APP_ORIGIN and only goes to Google");

  // The whole Google callback, with the fixture's fake token endpoint choosing who
  // Google says the person is. Each flow uses its own cookie jar (a fresh browser).
  const googleSignIn = async (identity) => {
    const cookies = new Map();
    const keep = (result) => {
      for (const set of result.headers.getSetCookie()) {
        const [first] = set.split(";");
        const [key, value] = [
          first.slice(0, first.indexOf("=")),
          first.slice(first.indexOf("=") + 1),
        ];
        if (!value || /Max-Age=0/i.test(set)) cookies.delete(key);
        else cookies.set(key, value);
      }
      return result;
    };
    const cookie = () => [...cookies].map(([key, value]) => `${key}=${value}`).join("; ");
    const start = keep(await startGoogle(base));
    const state = new URL(start.headers.get("location")).searchParams.get("state");
    await fetch("http://127.0.0.1:3304/google-identity", {
      method: "POST",
      body: JSON.stringify({ aud: "1234-test.apps.googleusercontent.com", ...identity }),
    });
    const back = keep(
      await fetch(`${base}/api/auth/callback/google?code=test-code&state=${state}`, {
        redirect: "manual",
        headers: { cookie: cookie(), "x-test-client-ip": `198.51.100.${counter++}` },
      }),
    );
    const location = new URL(back.headers.get("location"), base);
    const session = await (
      await fetch(`${base}/api/auth/get-session`, { headers: { cookie: cookie() } })
    ).json();
    return { location, session };
  };
  const methods = async (address) =>
    (
      await pool.query(
        `SELECT a."providerId" FROM "Account" a JOIN "User" u ON u.id = a."userId"
         WHERE u.email = $1 ORDER BY 1`,
        [address],
      )
    ).rows.map((row) => row.providerId);

  // A new address registers (registration is open in the fixture), verified by Google,
  // without Google's name or photo.
  const googleEmail = "mw-google-qa@example.invalid";
  let result = await googleSignIn({ sub: "google-new", email: googleEmail, email_verified: true });
  assert.equal(result.location.href, `${base}/sv/account?view=login`);
  assert.equal(result.session?.user.email, googleEmail);
  assert.deepEqual(
    (
      await pool.query('SELECT name, image, "emailVerified" FROM "User" WHERE email=$1', [
        googleEmail,
      ])
    ).rows[0],
    { name: "MoneyWorks member", image: null, emailVerified: true },
  );
  assert.deepEqual(await methods(googleEmail), ["google"]);
  assert.deepEqual(
    (
      await pool.query(
        `SELECT a."accessToken", a."refreshToken", a."idToken" FROM "Account" a
         JOIN "User" u ON u.id = a."userId" WHERE u.email = $1`,
        [googleEmail],
      )
    ).rows[0],
    { accessToken: null, refreshToken: null, idToken: null },
    "no Google tokens are stored",
  );
  result = await googleSignIn({ sub: "google-new", email: googleEmail, email_verified: true });
  assert.equal(result.session?.user.email, googleEmail, "the same Google account signs in again");
  checks.push("Google registers a new verified address and signs it in again");

  // Google has not verified the address: no account, a specific message.
  const unverifiedEmail = "mw-google-unverified-qa@example.invalid";
  result = await googleSignIn({
    sub: "google-unverified",
    email: unverifiedEmail,
    email_verified: false,
  });
  assert.equal(result.location.searchParams.get("error"), "email_not_verified");
  assert.equal(result.session, null);
  assert.equal(
    (await pool.query('SELECT 1 FROM "User" WHERE email=$1', [unverifiedEmail])).rowCount,
    0,
  );
  checks.push("an address Google has not verified is refused");

  // A verified password member who signs in with Google switches to Google: same user,
  // password removed. Recovery then sends sign-in help instead of a reset token.
  const memberEmail = "mw-google-member-qa@example.invalid";
  await pool.query(
    `INSERT INTO "User" (id, name, email, "emailVerified", "updatedAt")
     VALUES ('google-member-qa', 'MoneyWorks member', $1, true, now())`,
    [memberEmail],
  );
  await pool.query(
    `INSERT INTO "Account" (id, "accountId", "providerId", "userId", password, "updatedAt")
     VALUES ('google-member-qa-credential', 'google-member-qa', 'credential', 'google-member-qa', 'test-hash', now())`,
  );
  result = await googleSignIn({ sub: "google-member", email: memberEmail, email_verified: true });
  assert.equal(result.session?.user.id, "google-member-qa", "joined to the existing user");
  assert.deepEqual(await methods(memberEmail), ["google"]);
  response = await call("/api/auth/request-password-reset", {
    email: memberEmail,
    redirectTo: `${base}/en/account?view=reset`,
  });
  assert.equal(response.status, 200);
  const googleMail = await (async () => {
    const end = Date.now() + 6000;
    while (Date.now() < end) {
      const messages = await (await fetch("http://127.0.0.1:3304/messages")).json();
      const text = messages.findLast((item) => item.includes(memberEmail));
      if (text) return text;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    throw new Error("Expected the Google sign-in email.");
  })();
  assert.ok(googleMail.includes("Sign in to MoneyWorks with Google"));
  assert.ok(!googleMail.includes("reset-password"), "no recovery token for a Google member");
  checks.push(
    "a password member switching to Google loses the password; recovery sends sign-in help",
  );

  // Someone registered this address but never verified it: Google proves the real
  // owner, so the stranger's password and sessions go.
  const squattedEmail = "mw-google-squatted-qa@example.invalid";
  await pool.query(
    `INSERT INTO "User" (id, name, email, "emailVerified", "updatedAt")
     VALUES ('google-squatted-qa', 'Squatter', $1, false, now())`,
    [squattedEmail],
  );
  await pool.query(
    `INSERT INTO "Account" (id, "accountId", "providerId", "userId", password, "updatedAt")
     VALUES ('google-squatted-qa-credential', 'google-squatted-qa', 'credential', 'google-squatted-qa', 'test-hash', now())`,
  );
  await pool.query(
    `INSERT INTO "Session" (id, token, "userId", "expiresAt", "updatedAt")
     VALUES ('google-squatted-qa-session', 'google-squatted-qa-token', 'google-squatted-qa', now() + interval '1 day', now())`,
  );
  result = await googleSignIn({ sub: "google-owner", email: squattedEmail, email_verified: true });
  assert.equal(result.session?.user.id, "google-squatted-qa");
  assert.deepEqual(await methods(squattedEmail), ["google"]);
  assert.equal(
    (await pool.query(`SELECT 1 FROM "Session" WHERE id='google-squatted-qa-session'`)).rowCount,
    0,
  );
  assert.equal(
    (await pool.query('SELECT "emailVerified" FROM "User" WHERE email=$1', [squattedEmail])).rows[0]
      .emailVerified,
    true,
  );
  checks.push("Google takes over an unverified squatter: its password and sessions go");

  // Admins keep their password: /admin has only password sign-in.
  result = await googleSignIn({ sub: "google-admin", email: adminEmail, email_verified: true });
  assert.equal(result.session?.user.email, adminEmail);
  assert.deepEqual(await methods(adminEmail), ["credential", "google"]);
  checks.push("an admin who signs in with Google keeps the password");

  await adminForm("logout", {});
  assert.equal((await adminForm("settings", settingsFields)).status, 404);
  checks.push("admin sign-out ends access");
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
    await pool.query('DELETE FROM "User" WHERE email = ANY($1)', [
      [
        email,
        "mw-admin-qa@example.invalid",
        "mw-google-qa@example.invalid",
        "mw-google-member-qa@example.invalid",
        "mw-google-squatted-qa@example.invalid",
      ],
    ]);
    await pool.query('DELETE FROM "SiteSetting"');
    await pool.query('DELETE FROM "RateLimit" WHERE key LIKE $1 OR key LIKE $2', [
      "%192.0.2.%",
      "%198.51.100.%",
    ]);
  } finally {
    await pool.end();
    fixture.kill("SIGTERM");
  }
}
