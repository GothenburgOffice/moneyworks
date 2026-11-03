import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { validEmail } from "./auth-config";
import { getAuth } from "./auth";
import { getDatabase } from "./db";

type Env = Record<string, string | undefined>;
const digest = (value: string) => createHash("sha256").update(value).digest();

// True when a login submits exactly ADMIN_EMAIL and ADMIN_PASSWORD (constant time).
export function isBootstrapLogin(email: string, password: string, env: Env = process.env) {
  const expected = (env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!expected || !env.ADMIN_PASSWORD) return false;
  const emailMatches = timingSafeEqual(digest(email), digest(expected));
  return timingSafeEqual(digest(password), digest(env.ADMIN_PASSWORD)) && emailMatches;
}

// While no admin exists, a login with ADMIN_EMAIL and ADMIN_PASSWORD creates that
// verified account (as vocabulary-training does on start). A verified account with
// that email is promoted with its own password. An unverified one proves nobody's
// ownership, so it is taken over: verified, given ADMIN_PASSWORD, its sessions ended.
// Once an admin exists, .env is ignored.
export async function ensureAdmin(env: Env = process.env) {
  const email = (env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = env.ADMIN_PASSWORD || "";
  if (!email) return "skipped";
  const db = getDatabase();
  if (await db.user.findFirst({ where: { isAdmin: true }, select: { id: true } })) return "exists";
  // Better Auth's own limits, so the account can sign in normally.
  if (!validEmail(email) || password.length < 15 || password.length > 128) return "invalid";
  const existing = await db.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true },
  });
  if (existing?.emailVerified) {
    await db.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
    return "promoted";
  }
  if (existing) {
    const hash = await hashPassword(password);
    await db.$transaction([
      db.session.deleteMany({ where: { userId: existing.id } }),
      db.account.deleteMany({ where: { userId: existing.id, providerId: "credential" } }),
      db.account.create({
        data: {
          id: randomUUID(),
          userId: existing.id,
          accountId: existing.id,
          providerId: "credential",
          password: hash,
        },
      }),
      db.user.update({
        where: { id: existing.id },
        data: { isAdmin: true, emailVerified: true },
      }),
    ]);
    return "taken over";
  }
  const id = randomUUID();
  try {
    await db.user.create({
      data: {
        id,
        email,
        name: "Administrator",
        emailVerified: true,
        isAdmin: true,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: "credential",
            password: await hashPassword(password),
          },
        },
      },
    });
  } catch {
    // A parallel login created it first.
    return "exists";
  }
  return "created";
}

// The signed-in admin for this request, or null (signed out or not an admin).
export async function currentAdmin(origin: string, headers: Headers) {
  const session = await (await getAuth(origin)).api.getSession({ headers });
  if (!session) return null;
  const user = await getDatabase().user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true },
  });
  return user?.isAdmin ? user : null;
}
