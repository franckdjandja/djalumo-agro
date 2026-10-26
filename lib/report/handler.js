// PDF report workflow: request -> requester confirms the address -> administrator approves -> report emailed.
//   POST /api/report                 JSON request from the Season Planner (same protections as the other forms)
//   GET|POST /api/report?a=confirm   requester confirmation (GET shows a button, POST acts: link scanners never act)
//   GET|POST /api/report?a=review    administrator review page, then approve or refuse
//   GET /api/report?a=preview        the report as it would be sent (administrator link only)
import { z } from 'zod';
import { getConfig } from '../config.js';
import { readJson, send, MAX_BODY_BYTES, HttpError } from '../http.js';
import { line, email, phone, optional, lang, meta, parse } from '../validation.js';
import { clientIp, clientKey, originAllowed, applyAppCors, looksAutomated, createMemoryRateStore, verifyTurnstile, LIMITS } from '../security.js';
import { getSql, createRepository, createPostgresRateStore } from '../db.js';
import { createMailer, esc } from '../email.js';
import { loadSite, tr } from './site.js';
import { buildReportPdf } from './pdf.js';
import { signToken, verifyToken, newReference } from './token.js';
import { PROFILES, T } from './strings.js';
import { formatter } from './format.js';
import * as M from './mail.js';

const DAY = 864e5;
const CONFIRM_DAYS = 7, REVIEW_DAYS = 30, DOWNLOAD_DAYS = 60;
const memoryStore = createMemoryRateStore();

const planSchema = z.object({
  capital: z.number().finite().min(0).max(1e12),
  currency: z.enum(['USD', 'XAF', 'EUR', 'RWF', 'KES', 'NGN']),
  mode: z.enum(['budget', 'crop']),
  area: z.number().finite().min(0).max(100000),
  crop: z.string().regex(/^[a-z]{2,20}$/),
  product: z.string().regex(/^[a-z_]{2,20}$/).nullable().optional().transform((v) => v ?? null),
  water: z.enum(['rainfed', 'manual', 'existing', 'pump', 'drip']),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  land: z.enum(['rent', 'own']),
  market: z.enum(['local', 'city']),
  familyLabour: z.number().min(0).max(0.9),
  ownTools: z.boolean(),
  priceXafKg: z.number().finite().min(0).max(1e9).nullable().optional().transform((v) => (v ? v : null)),
  horizon: z.number().int().min(1).max(240).nullable().optional().transform((v) => v ?? null),
  system: z.enum(['open', 'net', 'greenhouse']).optional().default('open'),
  fieldWork: z.enum(['hand', 'hire']).optional().default('hand'),
  machineQuoteXafHa: z.number().finite().min(0).max(1e9).nullable().optional().transform((v) => (v ? v : 0)),
  structure: z.enum(['new', 'owned', 'repair']).optional().default('new'),
  structureM2: z.number().finite().min(0).max(10000000).nullable().optional().transform((v) => (v ? v : null)),
  replaceCover: z.boolean().optional().default(false),
  repairXaf: z.number().finite().min(0).max(1e12).nullable().optional().transform((v) => (v ? v : 0)),
  dripInPlace: z.boolean().optional().default(true)
});

export const reportSchema = z.object({
  name: line(2, 100),
  email,
  phone: optional(phone),
  profile: z.enum(PROFILES),
  place: optional(line(2, 120)),
  reportLang: lang,
  consent: z.literal(true),
  plan: planSchema,
  ...meta
});

/** Checks against the knowledge base: known crop and product, a start date between one year ago and three years ahead. */
export function checkPlan(plan, kb, now = Date.now()) {
  const crop = kb.crops[plan.crop];
  if (!crop) return 'crop';
  if (plan.product && !(crop.products && crop.products[plan.product])) return 'product';
  const t = Date.parse(plan.start + 'T00:00:00Z');
  if (!Number.isFinite(t) || t < now - 366 * DAY || t > now + 3 * 366 * DAY) return 'start';
  if (plan.mode === 'crop' && !(plan.area > 0)) return 'area';
  if (plan.mode === 'budget' && !(plan.capital > 0)) return 'capital';
  return null;
}

export function defaultReportDeps() {
  return {
    config: () => getConfig(),
    repo: (cfg) => (cfg.databaseUrl ? createRepository(getSql(cfg.databaseUrl)) : null),
    rateStore: (cfg) => (cfg.databaseUrl ? createPostgresRateStore(getSql(cfg.databaseUrl)) : memoryStore),
    mailer: (cfg) => createMailer(cfg),
    fetch: (...a) => fetch(...a),
    now: () => Date.now(),
    log: { info: (...a) => console.info(...a), error: (...a) => console.error(...a) }
  };
}

const ready = (cfg) => !!(cfg.reportsEnabled && cfg.reportSecret && cfg.emailProvider !== 'none' && cfg.reportAdmin.length);

function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(html);
}

async function readForm(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  let raw;
  if (typeof req.body === 'string') raw = req.body;
  else if (Buffer.isBuffer(req.body)) raw = req.body.toString('utf8');
  else {
    let size = 0; const chunks = [];
    for await (const c of req) { size += c.length; if (size > MAX_BODY_BYTES) throw new HttpError(413, 'too_large'); chunks.push(c); }
    raw = Buffer.concat(chunks).toString('utf8');
  }
  if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, 'too_large');
  return Object.fromEntries(new URLSearchParams(raw));
}

/** Short description of the plan for emails and pages, in the given language. */
function describe(q, lang) {
  const { engine, kb } = loadSite();
  const r = engine.plan(kb, q.input);
  const t = T[lang], f = formatter(lang, q.input.currency, kb.fx);
  const crop = kb.crops[q.input.crop];
  const cropName = tr(crop.name, lang);
  const multi = crop.products && Object.keys(crop.products).length > 1;
  const prod = r.product;
  const unit = prod && prod.unitLabel ? tr(prod.unitLabel, lang) : 'kg';
  const startD = new Date(q.input.start + 'T00:00:00Z');
  const text = cropName + (multi && prod ? ' (' + tr(prod.label, lang).toLowerCase() + ')' : '') + ', ' + f.area(r.areaHa) + ', ' + (lang === 'fr' ? 'départ le ' : 'starting ') + f.date(startD);
  const long = r.profile && r.profile !== 'season';
  const capitalNeed = q.input.mode === 'crop' ? r.requiredXaf : r.budget.total;
  const W = M.words(lang).rows;
  const rows = [
    [W.ref, q.ref], [W.name, q.name], [W.email, q.email], [W.phone, q.phone], [W.profile, t.profiles[q.profile]], [W.place, q.place], [W.lang, M.words(lang).langs[q.lang]],
    [W.crop, cropName + (multi && prod ? ', ' + tr(prod.label, lang).toLowerCase() : '')], [W.area, f.area(r.areaHa)], [W.capital, f.money(capitalNeed)],
    [W.price, q.input.priceXafKg ? f.unit(q.input.priceXafKg) + ' ' + t.perUnit(long || unit !== 'kg' ? unit : 'kg') : t.inputs.priceNone],
    [W.water, t.waterOpt[q.input.water]], [W.start, f.date(startD)], [W.margin, r.priceSource ? f.money(r.scenarios.average.margin) : null]
  ];
  return { r, text, rows, cropName, feasible: !['below_min', 'upfront_exceeds', 'below_module'].includes(r.state) };
}

const fileName = (cropName, ref) => ('Djalumo Agro ' + cropName + ' ' + ref).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').replace(/\s+/g, ' ').trim() + '.pdf';

export function createReportHandler(deps = defaultReportDeps()) {
  return async function handler(req, res) {
    const cfg = deps.config();
    const url = new URL(req.url, 'http://local');
    const action = url.searchParams.get('a') || '';
    const home = cfg.siteUrl || '/';
    const base = cfg.siteUrl || ('https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'localhost'));
    const pageLang = (q) => (q && q.lang === 'en' ? 'en' : 'fr');

    if (!action) applyAppCors(req, res);
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.setHeader('Allow', 'GET, POST, OPTIONS'); return res.end(); }
    if (!ready(cfg)) {
      if (!action) return send(res, 503, { status: 'error', error: 'reports_unavailable' });
      const P = M.words('fr').page;
      return sendHtml(res, 503, M.page('fr', P.unavailableT, '<p>' + esc(P.unavailableD) + '</p>', home));
    }
    const ip = clientIp(req), key = clientKey(ip, cfg.rateLimitSalt);
    const limited = async (kind) => {
      const lim = LIMITS[kind];
      let count = 0;
      try { count = await deps.rateStore(cfg).hit(`${kind}:${key}`, lim.windowMs); }
      catch (e) { deps.log.error('[rate] store unavailable', e && e.name); count = await memoryStore.hit(`${kind}:${key}`, lim.windowMs); }
      return count > lim.max;
    };
    const repo = deps.repo(cfg);
    const mailer = deps.mailer(cfg);
    const sent = (r) => r && r.ok !== false;

    try {
      // ---------- request from the simulator ----------
      if (!action) {
        if (req.method !== 'POST') return send(res, 405, { status: 'error', error: 'method_not_allowed' }, { Allow: 'POST, OPTIONS' });
        if (!originAllowed(req, cfg.allowedOrigins)) return send(res, 403, { status: 'error', error: 'forbidden' });
        if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return send(res, 415, { status: 'error', error: 'unsupported_media_type' });
        let body;
        try { body = await readJson(req); } catch (e) { return send(res, e.status || 400, { status: 'error', error: e.code || 'bad_request' }); }
        if (await limited('report')) return send(res, 429, { status: 'error', error: 'rate_limited' }, { 'Retry-After': String(LIMITS.report.windowMs / 1000) });
        const parsed = parse(reportSchema, body);
        if (!parsed.ok) return send(res, 422, { status: 'error', error: 'invalid', fields: parsed.fields });
        const d = parsed.data;
        const { kb } = loadSite();
        const bad = checkPlan(d.plan, kb, deps.now());
        if (bad) return send(res, 422, { status: 'error', error: 'invalid', fields: { plan: bad } });
        if (looksAutomated(d, cfg.minFillMs)) return send(res, 200, { status: 'ok' });
        const challenge = await verifyTurnstile(d.turnstileToken, ip, cfg.turnstileSecret, deps.fetch);
        if (!challenge.ok) return send(res, 403, { status: 'error', error: 'challenge_failed' });

        const q = { ref: newReference(new Date(deps.now())), name: d.name, email: d.email, phone: d.phone, profile: d.profile, place: d.place, lang: d.reportLang, ui: d.uiLanguage, input: d.plan, at: new Date(deps.now()).toISOString() };
        const info = describe(q, q.lang);
        if (!info.feasible) return send(res, 422, { status: 'error', error: 'plan_not_feasible' });
        if (repo) await repo.insertReportRequest(q, { crop: q.input.crop, areaHa: info.r.areaHa, state: info.r.state });
        const token = signToken({ k: 'confirm', exp: deps.now() + CONFIRM_DAYS * DAY, q }, cfg.reportSecret);
        const mail = M.confirmEmail(q.lang, q, info.text, `${base}/api/report?a=confirm&t=${encodeURIComponent(token)}`);
        const r = await mailer.send({ to: [q.email], ...mail, replyTo: cfg.reportAdmin[0] });
        if (!sent(r)) { deps.log.error('[report] confirmation email refused', r && (r.status || r.reason)); return send(res, 502, { status: 'error', error: 'email_failed' }); }
        deps.log.info('[report] requested', q.ref);
        return send(res, 200, { status: 'ok' });
      }

      // ---------- requester confirmation ----------
      if (action === 'confirm') {
        const t = req.method === 'POST' ? (await readForm(req)).t : url.searchParams.get('t');
        const p = verifyToken(t, cfg.reportSecret, 'confirm', deps.now());
        const L0 = pageLang(p && p.q), P = M.words(L0).page;
        if (!p) return sendHtml(res, 400, M.page(L0, P.invalidT, '<p>' + esc(P.invalidD) + '</p>', home));
        const q = p.q;
        if (req.method !== 'POST') {
          const info = describe(q, L0);
          return sendHtml(res, 200, M.page(L0, P.confirmT, '<p>' + esc(P.confirmD(info.text)) + '</p><form method="post" action="/api/report?a=confirm"><input type="hidden" name="t" value="' + esc(t) + '"><button class="primary" type="submit">' + esc(P.confirmBtn) + '</button></form>', null));
        }
        if (await limited('reportAction')) return sendHtml(res, 429, M.page(L0, P.unavailableT, '<p>' + esc(P.unavailableD) + '</p>', home));
        if (repo) {
          const st = await repo.confirmReport(q.ref);
          if (st === 'already') return sendHtml(res, 200, M.page(L0, P.alreadyT, '<p>' + esc(P.alreadyD) + '</p>', home));
        }
        const AL = cfg.reportAdminLang;
        const info = describe(q, AL);
        const pdf = await buildReportPdf({ input: q.input, request: q, lang: q.lang, ref: q.ref, issued: new Date(deps.now()) });
        info.rows.push([M.words(AL).rows.pages, String(pdf.pages)]);
        const review = signToken({ k: 'review', exp: deps.now() + REVIEW_DAYS * DAY, q }, cfg.reportSecret);
        const mail = M.adminEmail(AL, q, info.rows, `${base}/api/report?a=review&t=${encodeURIComponent(review)}`, info.cropName);
        const r = await mailer.send({ to: cfg.reportAdmin, ...mail, replyTo: q.email, attachments: [{ filename: fileName(info.cropName, q.ref), content: pdf.buffer.toString('base64'), contentType: 'application/pdf' }] });
        if (!sent(r)) { deps.log.error('[report] admin email refused', r && (r.status || r.reason)); return sendHtml(res, 502, M.page(L0, P.unavailableT, '<p>' + esc(P.unavailableD) + '</p>', home)); }
        deps.log.info('[report] confirmed', q.ref);
        return sendHtml(res, 200, M.page(L0, P.confirmedT, '<p>' + esc(P.confirmedD) + '</p>', home));
      }

      // ---------- requester download (link issued only at approval) ----------
      if (action === 'download') {
        const p = verifyToken(url.searchParams.get('t'), cfg.reportSecret, 'download', deps.now());
        const L0 = pageLang(p && p.q), P = M.words(L0).page;
        if (!p) return sendHtml(res, 400, M.page(L0, P.invalidT, '<p>' + esc(P.invalidD) + '</p>', home));
        if (await limited('reportAction')) return sendHtml(res, 429, M.page(L0, P.unavailableT, '<p>' + esc(P.unavailableD) + '</p>', home));
        const q = p.q;
        const pdf = await buildReportPdf({ input: q.input, request: q, lang: q.lang, ref: q.ref, issued: new Date(p.at || deps.now()) });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="' + fileName(describe(q, L0).cropName, q.ref) + '"');
        res.setHeader('Cache-Control', 'private, no-store'); res.setHeader('X-Robots-Tag', 'noindex'); res.setHeader('Referrer-Policy', 'no-referrer');
        return res.end(pdf.buffer);
      }

      // ---------- administrator ----------
      if (action === 'review' || action === 'preview') {
        const form = req.method === 'POST' ? await readForm(req) : null;
        const t = form ? form.t : url.searchParams.get('t');
        const AL = cfg.reportAdminLang, P = M.words(AL).page;
        const p = verifyToken(t, cfg.reportSecret, 'review', deps.now());
        if (!p) return sendHtml(res, 400, M.page(AL, P.invalidT, '<p>' + esc(P.invalidD) + '</p>', home));
        const q = p.q;
        if (action === 'preview') {
          const pdf = await buildReportPdf({ input: q.input, request: q, lang: q.lang, ref: q.ref, issued: new Date(deps.now()) });
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', 'inline; filename="' + fileName(describe(q, AL).cropName, q.ref) + '"');
          res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex'); res.setHeader('Referrer-Policy', 'no-referrer');
          return res.end(pdf.buffer);
        }
        const status = repo ? await repo.reportStatus(q.ref) : null;
        if (status === 'SENT' || status === 'REFUSED') return sendHtml(res, 200, M.page(AL, P.doneT, '<p>' + esc(P.doneD(status)) + '</p>', null));
        if (!form) {
          const info = describe(q, AL);
          const hidden = '<input type="hidden" name="t" value="' + esc(t) + '">';
          const body = '<p>' + esc(P.reviewD) + '</p>' + M.rowsHtml(info.rows) +
            '<p><a class="btn ghost" href="/api/report?a=preview&amp;t=' + esc(encodeURIComponent(t)) + '" target="_blank" rel="noopener">' + esc(P.preview) + '</a></p>' +
            '<form method="post" action="/api/report?a=review">' + hidden + '<input type="hidden" name="decision" value="approve"><button class="primary" type="submit">' + esc(P.approve) + '</button></form>' +
            '<form method="post" action="/api/report?a=review">' + hidden + '<input type="hidden" name="decision" value="refuse"><label><input type="checkbox" name="notify" value="1" checked> ' + esc(P.notify) + '</label><button class="danger" type="submit">' + esc(P.refuse) + '</button></form>';
          return sendHtml(res, 200, M.page(AL, P.reviewT, body, null));
        }
        if (await limited('reportAction')) return sendHtml(res, 429, M.page(AL, P.unavailableT, '<p>' + esc(P.unavailableD) + '</p>', null));
        const info = describe(q, q.lang);
        if (form.decision === 'approve') {
          if (repo) { const st = await repo.decideReport(q.ref, 'SENT'); if (st === 'SENT' || st === 'REFUSED') return sendHtml(res, 200, M.page(AL, P.doneT, '<p>' + esc(P.doneD(st)) + '</p>', null)); }
          const at = deps.now();
          const pdf = await buildReportPdf({ input: q.input, request: q, lang: q.lang, ref: q.ref, issued: new Date(at) });
          const dl = `${base}/api/report?a=download&t=${encodeURIComponent(signToken({ k: 'download', exp: at + DOWNLOAD_DAYS * DAY, at, q }, cfg.reportSecret))}`;
          const mail = M.deliveryEmail(q.lang, q, info.text, info.cropName, pdf.pages, dl);
          const r = await mailer.send({ to: [q.email], ...mail, replyTo: cfg.reportAdmin[0], attachments: [{ filename: fileName(info.cropName, q.ref), content: pdf.buffer.toString('base64'), contentType: 'application/pdf' }] });
          if (!sent(r)) {
            deps.log.error('[report] delivery refused', r && (r.status || r.reason));
            if (repo) await repo.reopenReport(q.ref);
            return sendHtml(res, 502, M.page(AL, P.failT, '<p>' + esc(P.failD) + '</p>', null));
          }
          deps.log.info('[report] sent', q.ref);
          return sendHtml(res, 200, M.page(AL, P.sentT, '<p>' + esc(P.sentD(q.email)) + '</p><p><a class="btn ghost" href="' + esc(dl) + '">' + esc(P.download) + '</a></p>', null));
        }
        if (form.decision === 'refuse') {
          if (repo) { const st = await repo.decideReport(q.ref, 'REFUSED'); if (st === 'SENT' || st === 'REFUSED') return sendHtml(res, 200, M.page(AL, P.doneT, '<p>' + esc(P.doneD(st)) + '</p>', null)); }
          const notify = form.notify === '1';
          if (notify) await mailer.send({ to: [q.email], ...M.refusalEmail(q.lang, q, info.cropName), replyTo: cfg.reportAdmin[0] });
          deps.log.info('[report] refused', q.ref);
          return sendHtml(res, 200, M.page(AL, P.refusedT, '<p>' + esc(P.refusedD(notify)) + '</p>', null));
        }
        return sendHtml(res, 400, M.page(AL, P.invalidT, '<p>' + esc(P.invalidD) + '</p>', null));
      }
      return send(res, 404, { status: 'error', error: 'not_found' });
    } catch (e) {
      deps.log.error('[report] failed', e && (e.code || e.name), e && e.message);
      if (!action) return send(res, e.status || 500, { status: 'error', error: e.code || 'server_error' });
      const P = M.words('fr').page;
      return sendHtml(res, 500, M.page('fr', P.unavailableT, '<p>' + esc(P.unavailableD) + '</p>', home));
    }
  };
}
