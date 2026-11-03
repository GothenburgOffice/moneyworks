import "server-only";
import { accountConfig, validEmail, type AccountSettings } from "./auth-config";
import { getDatabase } from "./db";
import { decryptSecret, encryptionReady, encryptSecret } from "./secrets";

// SiteSetting keys. The secrets (SMTP password, Google client secret) are stored encrypted.
const keys = {
  controllerName: "privacy.controller_name",
  contactEmail: "privacy.contact_email",
  smtpHost: "smtp.host",
  smtpPort: "smtp.port",
  smtpSecure: "smtp.secure",
  smtpUser: "smtp.user",
  smtpPassword: "smtp.password",
  mailFrom: "mail.from",
  allowRegistration: "registration.allowed",
  googleClientId: "google.client_id",
  googleClientSecret: "google.client_secret",
} as const satisfies Record<keyof AccountSettings, string>;

// The devcontainer and CI pass clearly fake privacy details (never .env, never a
// production stack) so local registration works. Stored only while missing: a
// value saved at /admin, even a blank one, is never overwritten.
let seeded: Promise<void> | null = null;
async function seedPrivacy() {
  const name = process.env.PRIVACY_CONTROLLER_NAME?.trim() || "";
  const email = process.env.PRIVACY_CONTACT_EMAIL?.trim() || "";
  if (!name || !validEmail(email)) return;
  await getDatabase().siteSetting.createMany({
    data: [
      { key: keys.controllerName, value: name },
      { key: keys.contactEmail, value: email },
    ],
    skipDuplicates: true,
  });
}

async function readSettingsMap() {
  seeded ??= seedPrivacy().catch((error) => {
    seeded = null;
    throw error;
  });
  await seeded;
  const rows = await getDatabase().siteSetting.findMany({ select: { key: true, value: true } });
  return new Map(rows.map((row) => [row.key, row.value]));
}

// Settings saved encrypted, and what /admin shows instead of their values.
const secretNames = ["smtpPassword", "googleClientSecret"] as const;
type SecretName = (typeof secretNames)[number];
type SecretState = "unset" | "set" | "unreadable";

function fromMap(settings: Map<string, string>): AccountSettings {
  // An unreadable secret (another or no key) counts as missing, so that feature stays off.
  const secret = (name: SecretName) => {
    const stored = settings.get(keys[name]);
    return (stored && decryptSecret(stored)) || "";
  };
  return {
    controllerName: settings.get(keys.controllerName) ?? "",
    contactEmail: settings.get(keys.contactEmail) ?? "",
    smtpHost: settings.get(keys.smtpHost) ?? "",
    smtpPort: settings.get(keys.smtpPort) ?? "",
    smtpSecure: settings.get(keys.smtpSecure) === "true",
    smtpUser: settings.get(keys.smtpUser) ?? "",
    smtpPassword: secret("smtpPassword"),
    mailFrom: settings.get(keys.mailFrom) ?? "",
    allowRegistration: settings.get(keys.allowRegistration) === "true",
    googleClientId: settings.get(keys.googleClientId) ?? "",
    googleClientSecret: secret("googleClientSecret"),
  };
}

// Read on every account request, so cached briefly. Saves clear this process's
// cache at once; other processes pick changes up within CACHE_MS. The cache lives on
// globalThis because Next.js gives each route its own copy of this module, and a save
// at /admin must reach the account pages and the auth routes too.
const CACHE_MS = 30_000;
type Cache = { at: number; value: Promise<AccountSettings> } | null;
const shared = globalThis as unknown as { moneyworksSettingsCache?: Cache };
// `fresh` skips the cache: sign-ups use it, so switching registration off at /admin
// applies at once in every app process.
export function loadAccountSettings(fresh = false): Promise<AccountSettings> {
  const cache = shared.moneyworksSettingsCache;
  if (!fresh && cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const value = readSettingsMap().then(fromMap);
  shared.moneyworksSettingsCache = { at: Date.now(), value };
  value.catch(() => {
    shared.moneyworksSettingsCache = null;
  });
  return value;
}

// Without the database, mail and privacy count as missing: accounts report
// themselves unavailable instead of the page failing.
export async function loadAccountConfig(fresh = false) {
  return accountConfig(await loadAccountSettings(fresh).catch(() => ({})));
}

export type SettingsView = Omit<AccountSettings, SecretName> &
  Record<SecretName, SecretState> & { encryptionReady: boolean };

// For the admin page: never the secrets themselves, only whether they're set and readable.
export async function readSettingsView(): Promise<SettingsView> {
  const settings = await readSettingsMap();
  const state = (name: SecretName): SecretState => {
    const stored = settings.get(keys[name]);
    return !stored ? "unset" : decryptSecret(stored) ? "set" : "unreadable";
  };
  return {
    ...fromMap(settings),
    smtpPassword: state("smtpPassword"),
    googleClientSecret: state("googleClientSecret"),
    encryptionReady: encryptionReady(),
  };
}

// Blank values are stored blank, so a cleared privacy detail is never seeded
// again. Each secret: a new value, null to delete it, undefined to keep it.
export async function saveSettings(
  update: Omit<AccountSettings, SecretName> & Partial<Record<SecretName, string | null>>,
) {
  const { smtpPassword, googleClientSecret, ...plain } = update;
  const secrets = { smtpPassword, googleClientSecret };
  const values: [string, string][] = Object.entries(plain).map(([name, value]) => [
    keys[name as keyof typeof plain],
    typeof value === "boolean" ? (value ? "true" : "") : value.trim(),
  ]);
  for (const name of secretNames) {
    const value = secrets[name];
    if (value) values.push([keys[name], encryptSecret(value)]);
  }
  const removed = secretNames.filter((name) => secrets[name] === null).map((name) => keys[name]);
  const db = getDatabase();
  await db.$transaction([
    ...values.map(([key, value]) =>
      db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
    ...(removed.length ? [db.siteSetting.deleteMany({ where: { key: { in: removed } } })] : []),
  ]);
  shared.moneyworksSettingsCache = null;
}
