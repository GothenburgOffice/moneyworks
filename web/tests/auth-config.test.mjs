import assert from "node:assert/strict";
import { test } from "node:test";
import { getCookies } from "better-auth/cookies";
import { accountConfig, authCookieOptions } from "../src/lib/auth-config.ts";

const fields = [
  "AUTH_BASE_URL",
  "AUTH_SECRET",
  "AUTH_PUBLIC_SIGNUP",
  "PRIVACY_CONTROLLER_NAME",
  "PRIVACY_CONTACT_EMAIL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "MAIL_FROM",
  "SMTP_ALLOW_LOCAL_PLAINTEXT",
];
function config(extra = {}) {
  const previous = Object.fromEntries(fields.map((key) => [key, process.env[key]]));
  for (const key of fields) delete process.env[key];
  Object.assign(
    process.env,
    {
      AUTH_BASE_URL: "https://moneyworks.example",
      AUTH_SECRET: "unit-test-only-secret-not-for-a-hosted-instance",
      AUTH_PUBLIC_SIGNUP: "true",
      SMTP_HOST: "smtp.example.invalid",
      MAIL_FROM: "test@example.invalid",
      PRIVACY_CONTROLLER_NAME: "Test controller",
      PRIVACY_CONTACT_EMAIL: "privacy@example.invalid",
    },
    extra,
  );
  try {
    return accountConfig();
  } finally {
    for (const key of fields)
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
  }
}
test("registration requires deliberate setup, mail and privacy identity", () => {
  assert.equal(config().registrationEnabled, true);
  assert.equal(config({ PRIVACY_CONTACT_EMAIL: "" }).registrationEnabled, false);
  assert.equal(config({ PRIVACY_CONTROLLER_NAME: "" }).registrationEnabled, false);
  assert.equal(config({ SMTP_HOST: "" }).configured, false);
  assert.equal(config({ SMTP_PORT: "not-a-port" }).configured, false);
  assert.equal(config({ AUTH_SECRET: "replace-this-owner-placeholder" }).configured, false);
  assert.equal(config({ AUTH_PUBLIC_SIGNUP: "false" }).registrationEnabled, false);
});
test("HTTP is allowed only for explicit loopback development; HTTPS is required elsewhere", () => {
  assert.equal(config({ AUTH_BASE_URL: "http://localhost:3000" }).configured, true);
  assert.equal(config({ AUTH_BASE_URL: "http://127.0.0.1:3302" }).configured, true);
  for (const url of [
    "http://moneyworks.example",
    "https://user:password@moneyworks.example",
    "https://moneyworks.example/hidden",
    "invalid",
  ]) {
    assert.equal(config({ AUTH_BASE_URL: url }).configured, false);
  }
});
test("plaintext SMTP escape hatch cannot apply to a remote mail server", () => {
  assert.equal(config({ SMTP_ALLOW_LOCAL_PLAINTEXT: "true" }).plainLocalMail, false);
  assert.equal(
    config({ SMTP_HOST: "127.0.0.1", SMTP_ALLOW_LOCAL_PLAINTEXT: "true" }).plainLocalMail,
    true,
  );
});
test("actual library creates __Host cookies with Secure, HttpOnly, Lax and no Domain", () => {
  const setup = config();
  const cookies = getCookies({
    baseURL: setup.baseURL,
    advanced: authCookieOptions(setup),
    session: { expiresIn: 86400 },
  });
  for (const cookie of [cookies.sessionToken, cookies.dontRememberToken]) {
    assert.match(cookie.name, /^__Host-moneyworks\./);
    assert.equal(cookie.attributes.secure, true);
    assert.equal(cookie.attributes.httpOnly, true);
    assert.equal(cookie.attributes.path, "/");
    assert.equal(cookie.attributes.sameSite, "lax");
    assert.equal(cookie.attributes.domain, undefined);
  }
});
