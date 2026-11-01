import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { validEmail } from "./auth-config";
import { getAuth } from "./auth";
import { getDatabase } from "./db";

// While no admin exists, the admin login creates ADMIN_EMAIL with ADMIN_PASSWORD
// (as vocabulary-training does on start), or promotes an existing account with that
// email without touching its password. Once an admin exists, .env is ignored.
export async function ensureAdmin(env: Record<string, string | undefined> = process.env) {
  const email = (env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = env.ADMIN_PASSWORD || "";
  if (!email) return "skipped";
  const db = getDatabase();
  if (await db.user.findFirst({ where: { isAdmin: true }, select: { id: true } })) return "exists";
  if (!validEmail(email)) return "invalid";
  const promoted = await db.user.updateMany({ where: { email }, data: { isAdmin: true } });
  if (promoted.count) return "promoted";
  // Better Auth's own limits, so the account can sign in normally.
  if (password.length < 15 || password.length > 128) return "invalid";
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
  const session = await getAuth(origin).api.getSession({ headers });
  if (!session) return null;
  const user = await getDatabase().user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, isAdmin: true },
  });
  return user?.isAdmin ? user : null;
}
