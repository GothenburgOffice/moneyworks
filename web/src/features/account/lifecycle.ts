// Pure account lifecycle rules: the admin users list, locking, the trash and the
// member's own data export. No database, auth or environment access.

// An account in the trash cannot sign in and is deleted with all its data this many
// days later. scripts/cleanup-auth.mjs repeats the number (tests check they match).
export const TRASH_DAYS = 30;
export const USERS_PAGE_SIZE = 50;

export const userScopes = ["all", "active", "locked", "trash"] as const;
export type UserScope = (typeof userScopes)[number];
export const userSorts = ["email", "created", "lastSignIn"] as const;
export type UserSort = (typeof userSorts)[number];

export type UserListQuery = {
  q: string;
  scope: UserScope;
  sort: UserSort;
  dir: "asc" | "desc";
  page: number;
};

type Query = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (typeof value === "string" ? value : "");
const pick = <T extends string>(value: string, allowed: readonly T[], fallback: T): T =>
  (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

// The users list's search, filter, sort and page, from the query string or the hidden
// fields an action form sends back. Anything unknown falls back to the default.
export function parseUserListQuery(query: Query): UserListQuery {
  const page = Number(one(query.page));
  return {
    q: one(query.q).trim().slice(0, 200),
    scope: pick(one(query.scope), userScopes, "all"),
    sort: pick(one(query.sort), userSorts, "created"),
    dir: one(query.dir) === "asc" ? "asc" : "desc",
    page: Number.isInteger(page) && page > 1 && page <= 100_000 ? page : 1,
  };
}

// The query string that leads back to this view of the list (defaults left out).
export function userListSearch(query: UserListQuery, changes: Partial<UserListQuery> = {}) {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.scope !== "all") params.set("scope", next.scope);
  if (next.sort !== "created") params.set("sort", next.sort);
  if (next.dir !== "desc") params.set("dir", next.dir);
  if (next.page > 1) params.set("page", String(next.page));
  const search = params.toString();
  return search ? `?${search}` : "";
}

export const userActions = ["lock", "unlock", "trash", "restore"] as const;
export type UserAction = (typeof userActions)[number];

// Locking or trashing takes access away. An admin keeps the site reachable: never their
// own account, and never the last admin who can still sign in.
export function removesAccess(action: UserAction) {
  return action === "lock" || action === "trash";
}
export function canRemoveAccess(targetIsAdmin: boolean, otherActiveAdmin: boolean) {
  return !targetIsAdmin || otherActiveAdmin;
}

// When an account moved to the trash at `deletedAt` is deleted for good.
export function purgeDate(deletedAt: Date) {
  return new Date(deletedAt.getTime() + TRASH_DAYS * 24 * 60 * 60 * 1000);
}

export type AccountStatus = "Active" | "Locked" | "Trash";
export function accountStatus(user: { lockedAt: Date | null; deletedAt: Date | null }) {
  return user.deletedAt ? "Trash" : user.lockedAt ? "Locked" : ("Active" as AccountStatus);
}

// A member's own data export: everything stored about them, without password hashes,
// session tokens or anything that would let someone else sign in.
export const EXPORT_FORMAT = "moneyworks-account-export";
export const EXPORT_VERSION = 1;

export type ExportSource = {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastSignInAt: Date | null;
  };
  accounts: { providerId: string; accountId: string; createdAt: Date; updatedAt: Date }[];
  sessions: {
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    ipAddress: string | null;
    userAgent: string | null;
    current: boolean;
  }[];
  scenarios: {
    id: string;
    toolId: string;
    name: string;
    schemaVersion: number;
    data: unknown;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

const iso = (date: Date | null) => (date ? date.toISOString() : null);

export function buildAccountExport(source: ExportSource, now: Date) {
  const { user } = source;
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: now.toISOString(),
    account: {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      isAdmin: user.isAdmin,
      createdAt: iso(user.createdAt),
      updatedAt: iso(user.updatedAt),
      lastSignInAt: iso(user.lastSignInAt),
    },
    // A password is stored only as a hash, which is left out; for Google, the
    // account ID Google gave this site is what we keep.
    signInMethods: source.accounts.map((account) =>
      account.providerId === "google"
        ? {
            method: "google",
            googleAccountId: account.accountId,
            createdAt: iso(account.createdAt),
          }
        : {
            method: "password",
            createdAt: iso(account.createdAt),
            updatedAt: iso(account.updatedAt),
          },
    ),
    sessions: source.sessions.map((session) => ({
      createdAt: iso(session.createdAt),
      lastActiveAt: iso(session.updatedAt),
      expiresAt: iso(session.expiresAt),
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      current: session.current,
    })),
    scenarios: source.scenarios.map((scenario) => ({
      id: scenario.id,
      toolId: scenario.toolId,
      name: scenario.name,
      schemaVersion: scenario.schemaVersion,
      data: scenario.data,
      createdAt: iso(scenario.createdAt),
      updatedAt: iso(scenario.updatedAt),
    })),
  };
}

export function exportFileName(now: Date) {
  return `moneyworks-account-${now.toISOString().slice(0, 10)}.json`;
}
