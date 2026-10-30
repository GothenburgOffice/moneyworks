import pg from 'pg';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
const apply = process.argv.includes('--apply');
const expired = [
  ['Session', '"expiresAt" < NOW()', []],
  ['Verification', '"expiresAt" < NOW()', []],
  ['RateLimit', '"lastRequest" < $1', [Date.now() - 86400000]],
];
try {
  for (const [table, condition, values] of expired) {
    if (apply) {
      const result = await pool.query(`DELETE FROM "${table}" WHERE ${condition}`, values);
      console.log(`${table}: removed ${result.rowCount} expired records`);
    } else {
      const result = await pool.query(`SELECT COUNT(*)::int AS count FROM "${table}" WHERE ${condition}`, values);
      console.log(`${table}: ${result.rows[0].count} expired records; dry run`);
    }
  }
} finally { await pool.end(); }
