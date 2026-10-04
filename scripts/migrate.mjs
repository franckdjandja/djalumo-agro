// Applies db/schema.sql to DATABASE_URL. Usage: npm run db:migrate
import fs from 'node:fs';
import postgres from 'postgres';
const url = process.env.DATABASE_URL;
if (!url) { console.error('DATABASE_URL is not set'); process.exit(1); }
const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url) || url.includes('host=/');
const sql = postgres(url, { ssl: local ? false : 'require', max: 1, onnotice: () => {} });
try {
  await sql.unsafe(fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  console.log('Schema applied.');
} catch (e) {
  console.error('Migration failed:', e.message); process.exitCode = 1;
} finally { await sql.end(); }
