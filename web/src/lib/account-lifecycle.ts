import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import {
  canRemoveAccess,
  removesAccess,
  TRASH_DAYS,
  USERS_PAGE_SIZE,
  type ExportSource,
  type UserAction,
  type UserListQuery,
} from "@/features/account/lifecycle";
import { getDatabase } from "./db";

// True when this user may not sign in: locked by an admin, or in the trash.
export async function accessBlocked(userId: string) {
  const user = await getDatabase().user.findUnique({
    where: { id: userId },
    select: { lockedAt: true, deletedAt: true },
  });
  return Boolean(user?.lockedAt || user?.deletedAt);
}

export async function recordSignIn(userId: string) {
  await getDatabase().user.updateMany({
    where: { id: userId },
    data: { lastSignInAt: new Date() },
  });
}

// Is there an admin other than this user who can still sign in?
export async function otherActiveAdmin(
  userId: string,
  db: Prisma.TransactionClient = getDatabase(),
) {
  const other = await db.user.findFirst({
    where: { isAdmin: true, id: { not: userId }, lockedAt: null, deletedAt: null },
    select: { id: true },
  });
  return Boolean(other);
}

// Deletes accounts whose time in the trash is up, with everything they own (cascade).
export async function purgeTrashedAccounts(now = new Date()) {
  const cutoff = new Date(now.getTime() - TRASH_DAYS * 24 * 60 * 60 * 1000);
  const result = await getDatabase().user.deleteMany({ where: { deletedAt: { lt: cutoff } } });
  return result.count;
}

export type AccessChangeResult = "done" | "self" | "lastAdmin" | "notFound";

// One admin action on one account. Locking or trashing ends its sessions at once.
// Changes run one at a time (advisory lock), so two admins can't remove each other.
export async function changeAccess(
  adminId: string,
  userId: string,
  action: UserAction,
): Promise<AccessChangeResult> {
  const removing = removesAccess(action);
  if (removing && userId === adminId) return "self";
  return getDatabase().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended('admin:user-access', 0))`;
    const target = await tx.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
    if (!target) return "notFound";
    if (removing && !canRemoveAccess(target.isAdmin, await otherActiveAdmin(userId, tx)))
      return "lastAdmin";
    const now = new Date();
    const data =
      action === "lock"
        ? { lockedAt: now }
        : action === "unlock"
          ? { lockedAt: null }
          : action === "trash"
            ? { deletedAt: now }
            : { deletedAt: null };
    // Locking an already locked account keeps the original time (same for the trash).
    const unchanged =
      action === "lock" ? { lockedAt: null } : action === "trash" ? { deletedAt: null } : {};
    await tx.user.updateMany({ where: { id: userId, ...unchanged }, data });
    if (removing) await tx.session.deleteMany({ where: { userId } });
    return "done";
  });
}

export type AdminUserRow = {
  id: string;
  email: string;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: Date;
  lastSignInAt: Date | null;
  lockedAt: Date | null;
  deletedAt: Date | null;
  methods: string[];
};

// One page of the users list. Sort and filter come from fixed lists (parseUserListQuery).
export async function listUsers(query: UserListQuery) {
  const db = getDatabase();
  const where: Prisma.UserWhereInput = {
    ...(query.q ? { email: { contains: query.q, mode: "insensitive" } } : {}),
    ...(query.scope === "active" ? { lockedAt: null, deletedAt: null } : {}),
    ...(query.scope === "locked" ? { lockedAt: { not: null }, deletedAt: null } : {}),
    ...(query.scope === "trash" ? { deletedAt: { not: null } } : {}),
  };
  const orderBy: Prisma.UserOrderByWithRelationInput[] = [
    query.sort === "email"
      ? { email: query.dir }
      : query.sort === "lastSignIn"
        ? { lastSignInAt: { sort: query.dir, nulls: "last" } }
        : { createdAt: query.dir },
    { email: "asc" },
    { id: "asc" },
  ];
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * USERS_PAGE_SIZE,
      take: USERS_PAGE_SIZE,
      select: {
        id: true,
        email: true,
        emailVerified: true,
        isAdmin: true,
        createdAt: true,
        lastSignInAt: true,
        lockedAt: true,
        deletedAt: true,
        accounts: { select: { providerId: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  const users: AdminUserRow[] = rows.map(({ accounts, ...user }) => ({
    ...user,
    methods: accounts.map((account) => (account.providerId === "google" ? "Google" : "Password")),
  }));
  return { users, total };
}

// Everything stored about one member, for their own export.
export async function loadExportSource(
  userId: string,
  currentSessionId: string,
): Promise<ExportSource | null> {
  const user = await getDatabase().user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      isAdmin: true,
      createdAt: true,
      updatedAt: true,
      lastSignInAt: true,
      accounts: {
        select: { providerId: true, accountId: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: "asc" },
      },
      sessions: {
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
          expiresAt: true,
          ipAddress: true,
          userAgent: true,
        },
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "asc" },
      },
      scenarios: {
        select: {
          id: true,
          toolId: true,
          name: true,
          schemaVersion: true,
          data: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!user) return null;
  const { accounts, sessions, scenarios, ...account } = user;
  return {
    user: account,
    accounts,
    sessions: sessions.map(({ id, ...session }) => ({
      ...session,
      current: id === currentSessionId,
    })),
    scenarios,
  };
}
