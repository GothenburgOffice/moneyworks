import pg from "pg";
import { emailDomain, emailPrefix, ipPrefix } from "./support";

// Remove what the browser tests created in the disposable database: their users
// (sessions, accounts and scenarios cascade) and their rate-limit buckets.
export default async function teardown() {
  const pool = new pg.Pool({ connectionString: process.env.AUTH_TEST_DATABASE_URL });
  const pattern = `${emailPrefix}%${emailDomain}`;
  try {
    await pool.query('DELETE FROM "User" WHERE email LIKE $1', [pattern]);
    await pool.query('DELETE FROM "RateLimit" WHERE key LIKE $1', [`%${ipPrefix}%`]);
  } finally {
    await pool.end();
  }
}
