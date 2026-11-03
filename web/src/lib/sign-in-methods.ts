import "server-only";
import { getDatabase } from "./db";

// One sign-in method per member, admins included: an account that signs in with
// Google loses its password, and gets no new one while Google is switched on at
// /admin. If Google is switched off, password recovery works again, so nobody is
// locked out.

// True when this user signs in with Google instead of a password.
export async function usesGoogleOnly(userId: string) {
  const google = await getDatabase().account.findFirst({
    where: { userId, providerId: "google" },
    select: { id: true },
  });
  return Boolean(google);
}

// Before Google is linked to an existing user. An unverified account never proved
// anyone owned the address (Google just did), so its sessions go too, as in the admin
// bootstrap; a verified member keeps theirs. A user Better Auth is creating in the
// same step is not visible yet and is skipped.
export async function prepareGoogleLink(userId: string) {
  const db = getDatabase();
  const user = await db.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
  if (!user) return;
  await db.$transaction([
    ...(user.emailVerified ? [] : [db.session.deleteMany({ where: { userId } })]),
    db.account.deleteMany({ where: { userId, providerId: "credential" } }),
  ]);
}

// What the account page shows: the sign-in methods and whether to link /admin.
export async function accountSummary(userId: string) {
  const user = await getDatabase().user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, accounts: { select: { providerId: true } } },
  });
  const ids = new Set(user?.accounts.map((account) => account.providerId));
  return {
    methods: { password: ids.has("credential"), google: ids.has("google") },
    isAdmin: Boolean(user?.isAdmin),
  };
}
