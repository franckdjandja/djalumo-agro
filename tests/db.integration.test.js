// Runs against a real PostgreSQL when TEST_DATABASE_URL is set (skipped otherwise).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import postgres from 'postgres';
import { createRepository, createPostgresRateStore } from '../lib/db.js';

const url = process.env.TEST_DATABASE_URL;
const opts = { skip: !url && 'TEST_DATABASE_URL not set' };
let sql, repo;

before(async () => {
  if (!url) return;
  sql = postgres(url, { max: 2, onnotice: () => {} });
  await sql.unsafe('drop table if exists submission_events, admin_users, rate_limits, newsletter_subscribers, demo_requests, contact_inquiries cascade');
  const schema = fs.readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8');
  await sql.unsafe(schema);
  await sql.unsafe(schema); // idempotent
  repo = createRepository(sql);
});
after(async () => { if (sql) await sql.end(); });

test('inquiry is stored with status NEW and timestamps', opts, async () => {
  const row = await repo.insertInquiry({ name: 'Ada Ngono', email: 'ada@example.org', organization: null, country: 'CM', phone: null, organizationType: 'FARM', subject: 'PILOT', message: 'We would like to join the Foumbot pilot season in 2027.', uiLanguage: 'fr' });
  const [r] = await sql`select status, language, created_at, updated_at, consent_at from contact_inquiries where id = ${row.id}`;
  assert.equal(r.status, 'NEW'); assert.equal(r.language, 'fr'); assert.ok(r.created_at && r.consent_at);
  await sql`update contact_inquiries set status = 'CONTACTED' where id = ${row.id}`;
  const [u] = await sql`select updated_at > created_at as touched from contact_inquiries where id = ${row.id}`;
  assert.equal(u.touched, true);
});

test('injection attempts are stored as plain text', opts, async () => {
  const evil = "Robert'); drop table contact_inquiries; --";
  await repo.insertInquiry({ name: evil.slice(0, 100), email: 'x@y.co', organization: null, country: 'CM', phone: null, organizationType: null, subject: 'OTHER', message: evil + ' padding text to pass length', uiLanguage: 'en' });
  const [c] = await sql`select count(*)::int as n from contact_inquiries`;
  assert.equal(c.n, 2);
});

test('demo request requires a phone when contact is not by email', opts, async () => {
  const base = { name: 'Jean Fotso', email: 'jean@coop.cm', organization: 'Coop Noun', country: 'CM', role: 'Manager', organizationType: 'COOPERATIVE', interest: 'FOUMBOT_PILOT', scale: null, contactMethod: 'WHATSAPP', phone: null, message: null, uiLanguage: 'en' };
  await assert.rejects(repo.insertDemoRequest(base));
  const row = await repo.insertDemoRequest({ ...base, phone: '+237 699 00 00 00' });
  assert.ok(row.id);
});

test('newsletter: duplicate, unsubscribe and resubscribe', opts, async () => {
  const first = await repo.subscribe({ email: 'reader@example.org', language: 'en' });
  assert.equal(first.duplicate, false);
  assert.equal((await repo.subscribe({ email: 'reader@example.org', language: 'en' })).duplicate, true);
  assert.equal(await repo.unsubscribe(first.token), true);
  assert.equal(await repo.unsubscribe(first.token), false);
  const again = await repo.subscribe({ email: 'reader@example.org', language: 'fr' });
  assert.equal(again.resubscribed, true);
  const [s] = await sql`select status, language, unsubscribed_at from newsletter_subscribers where email_normalized = 'reader@example.org'`;
  assert.equal(s.status, 'SUBSCRIBED'); assert.equal(s.language, 'fr'); assert.equal(s.unsubscribed_at, null);
});

test('shared rate limit counter increments per bucket', opts, async () => {
  const rs = createPostgresRateStore(sql);
  assert.equal(await rs.hit('contact:abc', 60000), 1);
  assert.equal(await rs.hit('contact:abc', 60000), 2);
  assert.equal(await rs.hit('contact:def', 60000), 1);
});
