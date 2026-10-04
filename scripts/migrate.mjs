// Applies db/schema.sql (idempotent).
//   npm run db:migrate            -> fails if no database is configured
//   node scripts/migrate.mjs --if-configured   -> used by the deployment build: skips quietly without a database
//                                                 and never blocks the deployment if the database is unreachable
import fs from 'node:fs';
import postgres from 'postgres';

const soft = process.argv.includes('--if-configured');
// Neon's Vercel integration provides DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED (direct, preferred for schema changes)
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
if (!url) {
  if (soft) { console.log('[migrate] No database configured yet: skipped.'); process.exit(0); }
  console.error('DATABASE_URL is not set'); process.exit(1);
}
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes('host=/');
const sql = postgres(url, { ssl: local ? false : 'require', max: 1, connect_timeout: 15, onnotice: () => {} });
try {
  await sql.unsafe(fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  console.log('[migrate] Schema applied.');
} catch (e) {
  console.error('[migrate] Migration failed:', e.message);
  if (!soft) process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}
