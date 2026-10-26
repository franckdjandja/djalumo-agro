import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import zlib from 'node:zlib';
import { createReportHandler } from '../lib/report/handler.js';
import { buildReportPdf } from '../lib/report/pdf.js';
import { signToken, verifyToken, newReference } from '../lib/report/token.js';
import { T } from '../lib/report/strings.js';
import { getConfig } from '../lib/config.js';
import { createMemoryRateStore } from '../lib/security.js';

const NOW = Date.parse('2026-10-23T10:00:00Z');
const ENV = { REPORTS_ENABLED: 'true', REPORT_SIGNING_SECRET: 's'.repeat(40), REPORT_ADMIN_EMAIL: 'admin@djalumo.test', EMAIL_PROVIDER: 'console', SITE_URL: 'https://djalumo.test' };

function setup({ db = true, env = {}, failDelivery = false } = {}) {
  const mails = [], rows = new Map();
  const rate = createMemoryRateStore();
  const repo = {
    async insertReportRequest(q) { rows.set(q.ref, 'PENDING_EMAIL'); return { id: q.ref }; },
    async confirmReport(ref) { const s = rows.get(ref); if (!s) return 'missing'; if (s === 'PENDING_EMAIL') { rows.set(ref, 'PENDING_REVIEW'); return 'confirmed'; } return 'already'; },
    async decideReport(ref, st) { const s = rows.get(ref); if (!s) return 'missing'; if (s === 'PENDING_EMAIL' || s === 'PENDING_REVIEW') { rows.set(ref, st); return 'ok'; } return s; },
    async reopenReport(ref) { if (rows.get(ref) === 'SENT') rows.set(ref, 'PENDING_REVIEW'); },
    async reportStatus(ref) { return rows.get(ref) || null; }
  };
  const deps = {
    config: () => getConfig({ ...ENV, ...env }),
    repo: () => (db ? repo : null),
    rateStore: () => rate,
    mailer: () => ({ send: async (m) => { mails.push(m); return failDelivery && m.attachments && !m.to.includes('admin@djalumo.test') ? { ok: false, status: 500 } : { ok: true }; } }),
    fetch: async () => ({ json: async () => ({ success: true }) }),
    now: () => NOW,
    log: { info() {}, error() {} }
  };
  return { handler: createReportHandler(deps), mails, rows };
}

function call(handler, { method = 'POST', url = '/api/report', body, form, headers = {}, ip = '10.0.0.9' } = {}) {
  const payload = form ? new URLSearchParams(form).toString() : body === undefined ? '' : JSON.stringify(body);
  const req = Readable.from(payload ? [Buffer.from(payload)] : []);
  req.method = method; req.url = url;
  req.headers = { 'content-type': form ? 'application/x-www-form-urlencoded' : 'application/json', 'x-forwarded-for': ip, host: 'djalumo.test', ...headers };
  return new Promise((resolve) => {
    const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(b) { resolve({ status: this.statusCode, headers: this.headers, body: b }); } };
    handler(req, res);
  });
}

const plan = { capital: 3000000, currency: 'XAF', mode: 'budget', area: 0.5, crop: 'cassava', product: 'gari', water: 'rainfed', start: '2027-03-01', land: 'rent', market: 'local', familyLabour: 0, ownTools: false, priceXafKg: 700 };
const request = { name: 'Ada Ngono', email: 'ada@example.org', phone: '+237 6 70 00 00 00', profile: 'farmer', place: 'Bertoua, Est', reportLang: 'fr', consent: true, plan, elapsedMs: 9000, website: '', uiLanguage: 'fr' };
const linkOf = (mail, a) => { const m = new RegExp('https://djalumo\\.test/api/report\\?a=' + a + '&t=([^\\s"&]+)').exec(mail.text); return m ? decodeURIComponent(m[1]) : null; };

test('tokens: signed, compressed, kind and expiry checked, tampering refused', () => {
  const secret = 'k'.repeat(32);
  const tok = signToken({ k: 'confirm', exp: NOW + 1000, q: { ref: 'DJ2610 AAAA' } }, secret);
  assert.equal(verifyToken(tok, secret, 'confirm', NOW).q.ref, 'DJ2610 AAAA');
  assert.equal(verifyToken(tok, secret, 'review', NOW), null);
  assert.equal(verifyToken(tok, secret, 'confirm', NOW + 2000), null);
  assert.equal(verifyToken(tok, 'other'.repeat(8), 'confirm', NOW), null);
  const forged = zlib.deflateRawSync(Buffer.from(JSON.stringify({ k: 'review', exp: NOW + 1e9, q: {} }))).toString('base64url') + '.' + tok.split('.')[1];
  assert.equal(verifyToken(forged, secret, 'review', NOW), null);
  assert.match(newReference(new Date(NOW)), /^DJ2610 [A-HJ-NP-Z2-9]{4}$/);
});

test('report: request, confirmation, review and approval send the PDF only after approval', async () => {
  const { handler, mails, rows } = setup();
  const r1 = await call(handler, { body: request });
  assert.equal(r1.status, 200, r1.body);
  assert.equal(mails.length, 1);
  assert.deepEqual(mails[0].to, ['ada@example.org']);
  assert.ok(!mails[0].attachments, 'no report before approval');
  const confirm = linkOf(mails[0], 'confirm');
  assert.ok(confirm);

  const page = await call(handler, { method: 'GET', url: '/api/report?a=confirm&t=' + encodeURIComponent(confirm) });
  assert.equal(page.status, 200);
  assert.match(page.body, /<form method="post"/);
  assert.equal(mails.length, 1, 'a GET (link scanner) never acts');

  const c = await call(handler, { url: '/api/report?a=confirm', form: { t: confirm } });
  assert.equal(c.status, 200, c.body);
  assert.equal(mails.length, 2);
  const admin = mails[1];
  assert.deepEqual(admin.to, ['admin@djalumo.test']);
  assert.equal(admin.attachments.length, 1);
  assert.ok(Buffer.from(admin.attachments[0].content, 'base64').subarray(0, 5).toString() === '%PDF-');
  assert.match(admin.subject, /Rapport à valider : Ada Ngono, Manioc/);
  const again = await call(handler, { url: '/api/report?a=confirm', form: { t: confirm } });
  assert.match(again.body, /déjà confirmée/);
  assert.equal(mails.length, 2, 'the administrator is told once');

  const review = linkOf(admin, 'review');
  const rp = await call(handler, { method: 'GET', url: '/api/report?a=review&t=' + encodeURIComponent(review) });
  assert.match(rp.body, /Valider et envoyer le rapport/);
  const pv = await call(handler, { method: 'GET', url: '/api/report?a=preview&t=' + encodeURIComponent(review) });
  assert.equal(pv.headers['content-type'], 'application/pdf');

  const ok = await call(handler, { url: '/api/report?a=review', form: { t: review, decision: 'approve' } });
  assert.equal(ok.status, 200, ok.body);
  assert.equal(mails.length, 3);
  const delivery = mails[2];
  assert.deepEqual(delivery.to, ['ada@example.org']);
  assert.match(delivery.subject, /Votre rapport Djalumo Agro : Manioc/);
  assert.equal(delivery.attachments.length, 1);
  assert.equal([...rows.values()][0], 'SENT');
  const dl = linkOf(delivery, 'download');
  assert.ok(dl, 'the delivery email carries a download link');
  const got = await call(handler, { method: 'GET', url: '/api/report?a=download&t=' + encodeURIComponent(dl) });
  assert.equal(got.headers['content-type'], 'application/pdf');
  assert.match(got.headers['content-disposition'], /^attachment;/);
  const notDl = await call(handler, { method: 'GET', url: '/api/report?a=download&t=' + encodeURIComponent(review) });
  assert.equal(notDl.status, 400, 'a review link is not a download link');
  const twice = await call(handler, { url: '/api/report?a=review', form: { t: review, decision: 'approve' } });
  assert.match(twice.body, /déjà été validée/);
  assert.equal(mails.length, 3, 'single use');
});

test('report: refusal, failed delivery, bad links and invalid plans', async () => {
  const s = setup();
  await call(s.handler, { body: request });
  await call(s.handler, { url: '/api/report?a=confirm', form: { t: linkOf(s.mails[0], 'confirm') } });
  const review = linkOf(s.mails[1], 'review');
  const no = await call(s.handler, { url: '/api/report?a=review', form: { t: review, decision: 'refuse', notify: '1' } });
  assert.match(no.body, /Demande refusée/);
  assert.equal(s.mails.length, 3);
  assert.ok(!s.mails[2].attachments, 'a refusal never carries the report');

  const f = setup({ failDelivery: true });
  await call(f.handler, { body: request });
  await call(f.handler, { url: '/api/report?a=confirm', form: { t: linkOf(f.mails[0], 'confirm') } });
  const fr = await call(f.handler, { url: '/api/report?a=review', form: { t: linkOf(f.mails[1], 'review'), decision: 'approve' } });
  assert.equal(fr.status, 502);
  assert.equal([...f.rows.values()][0], 'PENDING_REVIEW', 'request stays open after a failed send');

  const bad = await call(s.handler, { method: 'GET', url: '/api/report?a=review&t=abc.def' });
  assert.equal(bad.status, 400);
  const confirmAsReview = await call(s.handler, { url: '/api/report?a=review', form: { t: linkOf(s.mails[0], 'confirm'), decision: 'approve' } });
  assert.equal(confirmAsReview.status, 400, 'a requester link cannot approve');

  const v1 = await call(s.handler, { body: { ...request, plan: { ...plan, crop: 'banana' } }, ip: '10.1.0.1' });
  assert.equal(v1.status, 422);
  const v2 = await call(s.handler, { body: { ...request, plan: { ...plan, product: 'flour' } }, ip: '10.1.0.2' });
  assert.equal(v2.status, 422);
  const v3 = await call(s.handler, { body: { ...request, consent: false }, ip: '10.1.0.3' });
  assert.equal(v3.status, 422);
  const v4 = await call(s.handler, { body: { ...request, plan: { ...plan, capital: 1000 } }, ip: '10.1.0.4' });
  assert.equal(v4.status, 422);
});

test('report: works without a database and is off until configured', async () => {
  const s = setup({ db: false });
  assert.equal((await call(s.handler, { body: request })).status, 200);
  const c = await call(s.handler, { url: '/api/report?a=confirm', form: { t: linkOf(s.mails[0], 'confirm') } });
  assert.equal(c.status, 200);
  const off = setup({ env: { REPORTS_ENABLED: 'false' } });
  assert.equal((await call(off.handler, { body: request })).status, 503);
});

test('PDF report: every crop renders in both languages without long dashes', async () => {
  const crops = [['tomato', null, 'fr'], ['chili', null, 'en'], ['cassava', 'baton', 'fr'], ['plantain', null, 'en'], ['avocado', null, 'fr']];
  for (const [crop, product, lang] of crops) {
    const { buffer, pages } = await buildReportPdf({ input: { ...plan, crop, product, priceXafKg: null, water: 'pump' }, request: { name: 'Test', profile: 'other', place: null }, lang, ref: 'DJ2610 TEST', issued: new Date(NOW) });
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-', crop);
    assert.ok(pages >= 8 && pages <= 20, crop + ' pages ' + pages);
  }
  const all = JSON.stringify(T, (k, v) => (typeof v === 'function' ? v.toString() : v));
  assert.ok(!/[–—]/.test(all), 'no long dash in the report wording');
});

test('PDF report: a greenhouse plan and a plan with hired machines render in both languages', async () => {
  const cases = [[{ crop: 'tomato', system: 'greenhouse', capital: 12000000 }, 'fr'], [{ crop: 'pepper', system: 'greenhouse', capital: 12000000 }, 'en'], [{ crop: 'tomato', system: 'net', capital: 12000000 }, 'en'], [{ crop: 'tomato', fieldWork: 'hire', capital: 30000000 }, 'fr'],
    [{ crop: 'greenbean', system: 'greenhouse', capital: 12000000 }, 'fr'], [{ crop: 'chili', system: 'greenhouse', capital: 12000000 }, 'en'], [{ crop: 'zucchini', system: 'greenhouse', capital: 12000000 }, 'fr'],
    [{ crop: 'cucumber', system: 'greenhouse', structure: 'owned', structureM2: 500 }, 'en'], [{ crop: 'tomato', system: 'greenhouse', structure: 'repair', structureM2: 800, replaceCover: true, repairXaf: 300000 }, 'fr'], [{ crop: 'tomato', system: 'net', structure: 'owned', structureM2: 5000, dripInPlace: false }, 'en']];
  for (const [extra, lang] of cases) {
    const { buffer, pages } = await buildReportPdf({ input: { ...plan, product: null, priceXafKg: null, water: 'pump', ...extra }, request: { name: 'Test', profile: 'other', place: null }, lang, ref: 'DJ2610 TEST', issued: new Date(NOW) });
    assert.equal(buffer.subarray(0, 5).toString(), '%PDF-', JSON.stringify(extra));
    assert.ok(pages >= 8 && pages <= 22, JSON.stringify(extra) + ' pages ' + pages);
  }
});

test('report request: the production system and the field work are accepted, unknown values refused', async () => {
  const { handler } = setup();
  const ok = await call(handler, { body: { ...request, plan: { ...plan, capital: 12000000, crop: 'tomato', product: null, system: 'greenhouse', fieldWork: 'hand', machineQuoteXafHa: null } } });
  assert.equal(ok.status, 200, ok.body);
  const bad = await call(handler, { body: { ...request, plan: { ...plan, crop: 'tomato', product: null, system: 'hydroponic' } } });
  assert.equal(bad.status, 422);
  const owned = await call(handler, { body: { ...request, plan: { ...plan, crop: 'zucchini', product: null, system: 'greenhouse', structure: 'repair', structureM2: 500, replaceCover: true, repairXaf: 250000, dripInPlace: true, priceXafKg: 300 } } });
  assert.equal(owned.status, 200, owned.body);
  const wrong = await call(handler, { body: { ...request, plan: { ...plan, crop: 'tomato', product: null, system: 'greenhouse', structure: 'rented' } } });
  assert.equal(wrong.status, 422);
});

test('config: a Gmail account and its app password are enough to switch reports on', () => {
  const c = getConfig({ GMAIL_USER: 'franck@example.org', GMAIL_APP_PASSWORD: 'abcd efgh ijkl mnop' });
  assert.equal(c.emailProvider, 'gmail');
  assert.equal(c.smtp.host, 'smtp.gmail.com');
  assert.equal(c.smtp.pass, 'abcdefghijklmnop');
  assert.equal(c.emailFrom, 'Djalumo Agro <franck@example.org>');
  assert.equal(c.reportsEnabled, true);
  assert.ok(c.reportSecret.length >= 32);
  assert.deepEqual(c.reportAdmin, ['franck@example.org']);
  assert.deepEqual(c.notifyTo, ['franck@example.org']);
  assert.equal(getConfig({ GMAIL_USER: 'a@b.org', GMAIL_APP_PASSWORD: 'x', REPORTS_ENABLED: 'false' }).reportsEnabled, false);
  assert.equal(getConfig({}).reportsEnabled, false);
});
