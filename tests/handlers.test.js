import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createFormHandler } from '../lib/handlers.js';
import { getConfig } from '../lib/config.js';
import { createMemoryRateStore } from '../lib/security.js';

function fakeDeps(env = {}) {
  const store = { inquiries: [], demos: [], subs: new Map() };
  const mails = [];
  const rate = createMemoryRateStore();
  const deps = {
    config: () => getConfig({ DATABASE_URL: 'postgres://test', CONTACT_NOTIFICATION_EMAIL: 'team@djalumo.test', EMAIL_PROVIDER: 'console', ...env }),
    repo: () => ({
      async insertInquiry(d) { store.inquiries.push(d); return { id: 'x' }; },
      async insertDemoRequest(d) { store.demos.push(d); return { id: 'y' }; },
      async subscribe(d) { if (store.subs.has(d.email)) return { duplicate: true }; store.subs.set(d.email, d); return { duplicate: false, token: 't'.repeat(32) }; }
    }),
    rateStore: () => rate,
    mailer: () => ({ notifyInquiry: async (d) => { mails.push(['inquiry', d.email]); return { ok: true }; }, notifyDemo: async (d) => { mails.push(['demo', d.email]); return { ok: true }; }, notifySubscriber: async () => ({ ok: true }), confirmSubscription: async () => ({ ok: true }) }),
    newsletter: () => ({ add: async () => ({ ok: true, skipped: true }) }),
    fetch: async () => ({ json: async () => ({ success: false }) }),
    log: { info() {}, error() {} }
  };
  return { deps, store, mails };
}

function call(handler, { method = 'POST', body, headers = {}, ip = '10.0.0.1', raw } = {}) {
  const payload = raw !== undefined ? raw : body === undefined ? '' : JSON.stringify(body);
  const req = Readable.from(payload ? [Buffer.from(payload)] : []);
  req.method = method;
  req.url = '/api/x';
  req.headers = { 'content-type': 'application/json', 'x-forwarded-for': ip, ...headers };
  return new Promise((resolve) => {
    const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { resolve({ status: this.statusCode, headers: this.headers, json: b ? JSON.parse(b) : null }); } };
    handler(req, res);
  });
}

const contact = { name: 'Ada Ngono', email: 'ada@example.org', country: 'CM', subject: 'PILOT', message: 'We would like to join the Foumbot pilot season in 2027.', consent: true, elapsedMs: 9000, website: '' };

test('contact: stored and notified', async () => {
  const { deps, store, mails } = fakeDeps();
  const r = await call(createFormHandler('contact', deps), { body: contact });
  assert.equal(r.status, 200); assert.deepEqual(r.json, { status: 'ok' });
  assert.equal(store.inquiries.length, 1); assert.deepEqual(mails, [['inquiry', 'ada@example.org']]);
  assert.equal(r.headers['cache-control'], 'no-store');
});

test('contact: validation errors return 422 with field names and store nothing', async () => {
  const { deps, store } = fakeDeps();
  const r = await call(createFormHandler('contact', deps), { body: { ...contact, email: 'nope' } });
  assert.equal(r.status, 422); assert.equal(r.json.fields.email, 'invalid'); assert.equal(store.inquiries.length, 0);
});

test('honeypot and timing trap are accepted silently but never stored', async () => {
  const { deps, store } = fakeDeps();
  const h = createFormHandler('contact', deps);
  assert.equal((await call(h, { body: { ...contact, website: 'http://spam' }, ip: '1.1.1.1' })).status, 200);
  assert.equal((await call(h, { body: { ...contact, elapsedMs: 300 }, ip: '1.1.1.2' })).status, 200);
  assert.equal(store.inquiries.length, 0);
});

test('rate limit: sixth contact from one client within ten minutes gets 429', async () => {
  const { deps } = fakeDeps();
  const h = createFormHandler('contact', deps);
  for (let i = 0; i < 5; i++) assert.equal((await call(h, { body: contact, ip: '9.9.9.9' })).status, 200);
  const r = await call(h, { body: contact, ip: '9.9.9.9' });
  assert.equal(r.status, 429); assert.ok(r.headers['retry-after']);
});

test('method, media type, size and origin are enforced', async () => {
  const { deps } = fakeDeps({ ALLOWED_ORIGINS: 'https://djalumo.test' });
  const h = createFormHandler('contact', deps);
  assert.equal((await call(h, { method: 'GET' })).status, 405);
  assert.equal((await call(h, { body: contact, headers: { 'content-type': 'text/plain' } })).status, 415);
  assert.equal((await call(h, { raw: JSON.stringify({ ...contact, message: 'x'.repeat(20000) }) })).status, 413);
  assert.equal((await call(h, { raw: '{bad json' })).status, 400);
  assert.equal((await call(h, { body: contact, headers: { origin: 'https://evil.test' } })).status, 403);
  assert.equal((await call(h, { body: contact, headers: { origin: 'https://djalumo.test' } })).status, 200);
});

test('turnstile: a failed challenge is refused when the secret is configured', async () => {
  const { deps, store } = fakeDeps({ TURNSTILE_SECRET_KEY: 'secret' });
  const r = await call(createFormHandler('contact', deps), { body: { ...contact, turnstileToken: 'abc' } });
  assert.equal(r.status, 403); assert.equal(store.inquiries.length, 0);
});

test('demo: stored with notification', async () => {
  const { deps, store, mails } = fakeDeps();
  const body = { name: 'Jean Fotso', email: 'jean@coop.cm', organization: 'Coop Noun', country: 'CM', role: 'Manager', organizationType: 'COOPERATIVE', interest: 'FOUMBOT_PILOT', contactMethod: 'PHONE', phone: '+237 699 00 00 00', consent: true, elapsedMs: 12000 };
  const r = await call(createFormHandler('demo', deps), { body });
  assert.equal(r.status, 200); assert.equal(store.demos.length, 1); assert.equal(mails[0][0], 'demo');
});

test('newsletter: duplicate detection', async () => {
  const { deps } = fakeDeps();
  const h = createFormHandler('newsletter', deps);
  assert.deepEqual((await call(h, { body: { email: 'Reader@Example.org', consent: true, elapsedMs: 4000 }, ip: '2.2.2.2' })).json, { status: 'ok' });
  assert.deepEqual((await call(h, { body: { email: 'reader@example.org', consent: true, elapsedMs: 4000 }, ip: '2.2.2.3' })).json, { status: 'duplicate' });
});

test('storage failure returns a generic error without internals', async () => {
  const { deps } = fakeDeps();
  deps.repo = () => ({ insertInquiry: async () => { throw Object.assign(new Error('connection refused at 10.1.2.3'), { code: 'ECONNREFUSED' }); } });
  const r = await call(createFormHandler('contact', deps), { body: contact, ip: '3.3.3.3' });
  assert.equal(r.status, 500); assert.deepEqual(r.json, { status: 'error', error: 'server_error' });
});
