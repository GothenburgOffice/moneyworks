import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import { decryptSecret, encryptionReady, encryptSecret } from "../src/lib/secrets.ts";

const env = { SETTINGS_ENCRYPTION_KEY: randomBytes(32).toString("base64") };

test("stored secrets round-trip without the plaintext in the stored value", () => {
  const stored = encryptSecret("smtp test-only password", env);
  assert.match(stored, /^v1:/);
  assert.ok(!stored.includes("smtp test-only password"));
  assert.equal(decryptSecret(stored, env), "smtp test-only password");
  assert.notEqual(encryptSecret("same", env), encryptSecret("same", env), "fresh IV per value");
});

test("a missing, short or different key cannot read or write secrets", () => {
  const stored = encryptSecret("secret", env);
  assert.equal(encryptionReady({}), false);
  assert.equal(encryptionReady({ SETTINGS_ENCRYPTION_KEY: "c2hvcnQ=" }), false);
  assert.throws(() => encryptSecret("secret", {}), /SETTINGS_ENCRYPTION_KEY/);
  assert.equal(decryptSecret(stored, {}), null);
  const other = { SETTINGS_ENCRYPTION_KEY: randomBytes(32).toString("base64") };
  assert.equal(decryptSecret(stored, other), null);
});

test("tampered values are rejected", () => {
  const [version, iv, tag, data] = encryptSecret("secret", env).split(":");
  const flipped = Buffer.from(data, "base64");
  flipped[0] ^= 1;
  assert.equal(decryptSecret([version, iv, tag, flipped.toString("base64")].join(":"), env), null);
  assert.equal(decryptSecret("plaintext", env), null);
});
