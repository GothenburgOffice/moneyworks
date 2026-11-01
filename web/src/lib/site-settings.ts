import "server-only";
import { accountConfig, validEmail, type AccountSettings } from "./auth-config";
import { getDatabase } from "./db";
import { decryptSecret, encryptionReady, encryptSecret } from "./secrets";

// SiteSetting keys. Only the SMTP password is a secret; it is stored encrypted.
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

function fromMap(settings: Map<string, string>): AccountSettings {
  const stored = settings.get(keys.smtpPassword);
  return {
    controllerName: settings.get(keys.controllerName) ?? "",
    contactEmail: settings.get(keys.contactEmail) ?? "",
    smtpHost: settings.get(keys.smtpHost) ?? "",
    smtpPort: settings.get(keys.smtpPort) ?? "",
    smtpSecure: settings.get(keys.smtpSecure) === "true",
    smtpUser: settings.get(keys.smtpUser) ?? "",
    // An unreadable password (another or no key) counts as missing, so mail stays off.
    smtpPassword: (stored && decryptSecret(stored)) || "",
    mailFrom: settings.get(keys.mailFrom) ?? "",
    allowRegistration: settings.get(keys.allowRegistration) === "true",
  };
}

// Read on every account request, so cached briefly. Saves clear this process's
// cache at once; other processes pick changes up within CACHE_MS.
const CACHE_MS = 30_000;
let cache: { at: number; value: Promise<AccountSettings> } | null = null;
export function loadAccountSettings(): Promise<AccountSettings> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const value = readSettingsMap().then(fromMap);
  cache = { at: Date.now(), value };
  value.catch(() => {
    cache = null;
  });
  return value;
}

// Without the database, mail and privacy count as missing: accounts report
// themselves unavailable instead of the page failing.
export async function loadAccountConfig() {
  return accountConfig(await loadAccountSettings().catch(() => ({})));
}

export type SettingsView = Omit<AccountSettings, "smtpPassword"> & {
  smtpPassword: "unset" | "set" | "unreadable";
  encryptionReady: boolean;
};

// For the admin page: never the password itself, only whether it's set and readable.
export async function readSettingsView(): Promise<SettingsView> {
  const settings = await readSettingsMap();
  const stored = settings.get(keys.smtpPassword);
  return {
    ...fromMap(settings),
    smtpPassword: !stored ? "unset" : decryptSecret(stored) ? "set" : "unreadable",
    encryptionReady: encryptionReady(),
  };
}

// Blank values are stored blank, so a cleared privacy detail is never seeded
// again. `smtpPassword`: a new value, null to delete it, undefined to keep it.
export async function saveSettings(
  update: Omit<AccountSettings, "smtpPassword"> & { smtpPassword?: string | null },
) {
  const { smtpPassword, ...plain } = update;
  const values: [string, string][] = Object.entries(plain).map(([name, value]) => [
    keys[name as keyof typeof plain],
    typeof value === "boolean" ? (value ? "true" : "") : value.trim(),
  ]);
  if (smtpPassword) values.push([keys.smtpPassword, encryptSecret(smtpPassword)]);
  const db = getDatabase();
  await db.$transaction([
    ...values.map(([key, value]) =>
      db.siteSetting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
    ...(smtpPassword === null
      ? [db.siteSetting.deleteMany({ where: { key: keys.smtpPassword } })]
      : []),
  ]);
  cache = null;
}
