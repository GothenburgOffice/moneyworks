import pg from "pg";
import { emailDomain, emailPrefix, ipPrefix } from "./support";

// Remove what the browser tests created in the disposable database: their users
// (sessions, accounts and scenarios cascade), their password-reset records (keyed
// by user id, with no foreign key) and their rate-limit buckets. Email verification
// links are signed tokens and leave no rows.
export default async function teardown() {
  const pool = new pg.Pool({ connectionString: process.env.AUTH_TEST_DATABASE_URL });
  const pattern = `${emailPrefix}%${emailDomain}`;
  try {
    await pool.query(
      `DELETE FROM "Verification" WHERE identifier LIKE 'reset-password:%'
       AND value IN (SELECT id FROM "User" WHERE email LIKE $1)`,
      [pattern],
    );
    await pool.query('DELETE FROM "User" WHERE email LIKE $1', [pattern]);
    await pool.query('DELETE FROM "RateLimit" WHERE key LIKE $1', [`%${ipPrefix}%`]);
  } finally {
    await pool.end();
  }
}
