import pg from "pg";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured.");
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 3000,
});
const apply = process.argv.includes("--apply");
// Days an account stays in the admin trash before it is deleted with all its data.
// Must equal TRASH_DAYS in src/features/account/lifecycle.ts (checked by test:auth-config).
const TRASH_DAYS = 30;
const expired = [
  ["Session", '"expiresAt" < NOW()', []],
  ["Verification", '"expiresAt" < NOW()', []],
  ["RateLimit", '"lastRequest" < $1', [Date.now() - 86400000]],
  // Deleting the user deletes everything it owns (ON DELETE CASCADE).
  ["User", '"deletedAt" < NOW() - make_interval(days => $1)', [TRASH_DAYS]],
];
try {
  for (const [table, condition, values] of expired) {
    if (apply) {
      const result = await pool.query(`DELETE FROM "${table}" WHERE ${condition}`, values);
      console.log(`${table}: removed ${result.rowCount} expired records`);
    } else {
      const result = await pool.query(
        `SELECT COUNT(*)::int AS count FROM "${table}" WHERE ${condition}`,
        values,
      );
      console.log(`${table}: ${result.rows[0].count} expired records; dry run`);
    }
  }
} finally {
  await pool.end();
}
