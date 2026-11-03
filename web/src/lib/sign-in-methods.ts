import "server-only";
import { getDatabase } from "./db";

// One sign-in method per member: an account that signs in with Google loses its
// password, and gets no new one while Google is switched on at /admin. Admins keep
// their password, because /admin has only password sign-in. If Google is switched
// off, password recovery works again, so nobody is locked out.

// True when this user signs in with Google instead of a password.
export async function usesGoogleOnly(userId: string) {
  const user = await getDatabase().user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, accounts: { where: { providerId: "google" }, select: { id: true } } },
  });
  return Boolean(user && !user.isAdmin && user.accounts.length);
}

// Before Google is linked to an existing user. An unverified account never proved
// anyone owned the address (Google just did), so its password and sessions go, as in
// the admin bootstrap. A verified member's password goes too, unless they are an admin.
// A user Better Auth is creating in the same step is not visible yet and is skipped.
export async function prepareGoogleLink(userId: string) {
  const db = getDatabase();
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true, emailVerified: true },
  });
  if (!user || (user.isAdmin && user.emailVerified)) return;
  await db.$transaction([
    ...(user.emailVerified ? [] : [db.session.deleteMany({ where: { userId } })]),
    db.account.deleteMany({ where: { userId, providerId: "credential" } }),
  ]);
}

// The sign-in methods shown on the account page.
export async function signInMethods(userId: string) {
  const accounts = await getDatabase().account.findMany({
    where: { userId },
    select: { providerId: true },
  });
  const ids = new Set(accounts.map((account) => account.providerId));
  return { password: ids.has("credential"), google: ids.has("google") };
}
