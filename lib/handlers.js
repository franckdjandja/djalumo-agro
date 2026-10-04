// Form endpoints: one pipeline for contact, demo and newsletter.
// method -> origin -> content type -> size -> rate limit -> schema -> bot traps -> Turnstile -> store -> notify -> response
import { getConfig } from './config.js';
import { readJson, send } from './http.js';
import { contactSchema, demoSchema, newsletterSchema, parse } from './validation.js';
import { clientIp, clientKey, originAllowed, looksAutomated, createMemoryRateStore, verifyTurnstile, LIMITS } from './security.js';
import { getSql, createRepository, createPostgresRateStore } from './db.js';
import { createMailer } from './email.js';
import { createNewsletterSync } from './newsletter.js';

const SCHEMAS = { contact: contactSchema, demo: demoSchema, newsletter: newsletterSchema };
const memoryStore = createMemoryRateStore();

/** Production dependencies; tests pass their own. */
export function defaultDeps() {
  return {
    config: () => getConfig(),
    repo: (cfg) => createRepository(getSql(cfg.databaseUrl)),
    rateStore: (cfg) => (cfg.databaseUrl ? createPostgresRateStore(getSql(cfg.databaseUrl)) : memoryStore),
    mailer: (cfg) => createMailer(cfg),
    newsletter: (cfg) => createNewsletterSync(cfg),
    fetch: (...a) => fetch(...a),
    log: { info: (...a) => console.info(...a), error: (...a) => console.error(...a) }
  };
}

async function processSubmission(kind, d, cfg, deps) {
  const repo = deps.repo(cfg);
  const at = new Date().toISOString();
  const notify = async (p) => { try { const r = await p; if (r && r.ok === false && !r.skipped) deps.log.error('[notify] provider refused', r.status); } catch (e) { deps.log.error('[notify] failed', e && e.name); } };
  if (kind === 'contact') {
    await repo.insertInquiry(d);
    await notify(deps.mailer(cfg).notifyInquiry(d, at));
    return { status: 'ok' };
  }
  if (kind === 'demo') {
    await repo.insertDemoRequest(d);
    await notify(deps.mailer(cfg).notifyDemo(d, at));
    return { status: 'ok' };
  }
  const r = await repo.subscribe(d);
  if (r.duplicate) return { status: 'duplicate' };
  await notify(deps.newsletter(cfg).add({ email: d.email, language: d.language }));
  const mailer = deps.mailer(cfg);
  if (cfg.notifyOnNewsletter) await notify(mailer.notifySubscriber(d, at));
  if (cfg.sendSubscriberConfirmation && cfg.siteUrl) await notify(mailer.confirmSubscription(d, `${cfg.siteUrl}/api/unsubscribe?token=${encodeURIComponent(r.token)}`));
  return { status: 'ok' };
}

export function createFormHandler(kind, deps = defaultDeps()) {
  const schema = SCHEMAS[kind];
  return async function handler(req, res) {
    const cfg = deps.config();
    if (req.method === 'OPTIONS') { res.statusCode = 204; res.setHeader('Allow', 'POST, OPTIONS'); return res.end(); }
    if (req.method !== 'POST') return send(res, 405, { status: 'error', error: 'method_not_allowed' }, { Allow: 'POST, OPTIONS' });
    if (!originAllowed(req, cfg.allowedOrigins)) return send(res, 403, { status: 'error', error: 'forbidden' });
    if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return send(res, 415, { status: 'error', error: 'unsupported_media_type' });

    let body;
    try { body = await readJson(req); }
    catch (e) { return send(res, e.status || 400, { status: 'error', error: e.code || 'bad_request' }); }

    const ip = clientIp(req), key = clientKey(ip, cfg.rateLimitSalt), lim = LIMITS[kind];
    let count = 0;
    try { count = await deps.rateStore(cfg).hit(`${kind}:${key}`, lim.windowMs); }
    catch (e) { deps.log.error('[rate] store unavailable', e && e.name); count = await memoryStore.hit(`${kind}:${key}`, lim.windowMs); }
    if (count > lim.max) return send(res, 429, { status: 'error', error: 'rate_limited' }, { 'Retry-After': String(Math.ceil(lim.windowMs / 1000)) });

    const parsed = parse(schema, body);
    if (!parsed.ok) return send(res, 422, { status: 'error', error: 'invalid', fields: parsed.fields });
    const data = parsed.data;

    if (looksAutomated(data, cfg.minFillMs)) return send(res, 200, { status: 'ok' });

    const challenge = await verifyTurnstile(data.turnstileToken, ip, cfg.turnstileSecret, deps.fetch);
    if (!challenge.ok) return send(res, 403, { status: 'error', error: 'challenge_failed' });

    try {
      return send(res, 200, await processSubmission(kind, data, cfg, deps));
    } catch (e) {
      deps.log.error(`[${kind}] could not be stored`, e && (e.code || e.name));
      return send(res, 500, { status: 'error', error: 'server_error' });
    }
  };
}

export function createUnsubscribeHandler(deps = defaultDeps()) {
  return async function handler(req, res) {
    const cfg = deps.config();
    const url = new URL(req.url, 'http://local');
    const token = url.searchParams.get('token') || '';
    let ok = false;
    if (/^[A-Za-z0-9_-]{20,64}$/.test(token) && (req.method === 'GET' || req.method === 'POST')) {
      try { ok = await deps.repo(cfg).unsubscribe(token); } catch (e) { deps.log.error('[unsubscribe] failed', e && e.name); }
    }
    const home = cfg.siteUrl || '/';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.end(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AfriFarm Intelligent</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#070A09;color:#EDF2EE;font:16px/1.6 system-ui,sans-serif}main{max-width:520px;padding:24px}a{color:#5BC48D}small{color:#6F7C76;font-family:monospace;letter-spacing:.12em;text-transform:uppercase}</style></head><body><main><small>AfriFarm Intelligent</small><h1>${ok ? 'You are unsubscribed.' : 'This link is no longer active.'}</h1><p>${ok ? 'You will not receive further newsletters.' : 'The address may already be unsubscribed.'}</p><p lang="fr">${ok ? 'Vous êtes désinscrit. Vous ne recevrez plus la lettre d’information.' : 'Ce lien n’est plus actif. L’adresse a sans doute déjà été désinscrite.'}</p><p><a href="${home}">AfriFarm Intelligent</a></p></main></body></html>`);
  };
}

export function createHealthHandler(deps = defaultDeps()) {
  return async function handler(req, res) {
    const cfg = deps.config();
    let database = cfg.databaseUrl ? 'configured' : 'not_configured';
    if (cfg.databaseUrl) { try { await deps.repo(cfg).ping(); database = 'ok'; } catch { database = 'unreachable'; } }
    send(res, database === 'unreachable' ? 503 : 200, { status: 'ok', database, email: cfg.emailProvider, turnstile: cfg.turnstileSecret ? 'on' : 'off' });
  };
}
