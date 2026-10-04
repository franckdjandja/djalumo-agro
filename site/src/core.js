/* ---------- Core: utilities, platform capabilities, analytics, forms ---------- */
const D = document;
const $ = (s, r = D) => r.querySelector(s);
const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
const RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
const LOWEND = (navigator.hardwareConcurrency || 8) <= 4;
const store = {
  get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } }
};
let LANG = store.get('af.lang') === 'fr' ? 'fr' : 'en';
const L = () => I18N[LANG];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const IMG = { 'bulk-sacks': [645, 860], 'clearing': [645, 860], 'cucumber-field': [645, 860], 'father-2021': [524, 860], 'founder-tomato': [484, 860], 'harvest-2025': [535, 860], 'heat-damage': [484, 860], 'nursery': [484, 860], 'pump': [645, 860], 'relaunch-field': [487, 860], 'tomato-rows': [645, 860] };
const img = (name, alt, eager) => '<img src="img/' + name + '.webp" alt="' + esc(alt) + '" width="' + IMG[name][0] + '" height="' + IMG[name][1] + '" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">';
const nf = (v, d = 0) => new Intl.NumberFormat(L().meta.locale, { maximumFractionDigits: d, minimumFractionDigits: d }).format(v);
const money = (v, cur) => {
  try { return new Intl.NumberFormat(L().meta.locale, { style: 'currency', currency: cur, maximumFractionDigits: v >= 100 || cur === 'XAF' || cur === 'RWF' || cur === 'NGN' || cur === 'KES' ? 0 : 2 }).format(v); }
  catch (e) { return nf(v) + ' ' + cur; }
};
const monthName = (m, style = 'long') => {
  const s = new Intl.DateTimeFormat(L().meta.locale, { month: style }).format(new Date(2027, ((m % 12) + 12) % 12, 1));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const ARROW = '<svg class="arr" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x=".5" y=".5" width="31" height="31" rx="8" fill="#0F1513" stroke="#26332E"/><path d="M8.5 23.5C8.5 14.6 14.6 8.5 23.5 8.5c0 8.9-6.1 15-15 15Z" fill="rgba(91,196,141,.14)" stroke="#5BC48D" stroke-width="1.5"/><path d="M8.5 23.5 18.6 13.4" stroke="#C9A24B" stroke-width="1.5" stroke-linecap="round"/><circle cx="18.6" cy="13.4" r="1.9" fill="#C9A24B"/></svg>';

/* ---------- Analytics abstraction ----------
   Events are queued in memory only. No provider is configured in this build, so nothing leaves the browser.
   A provider is any object with track(event); see the production package for Plausible, PostHog and GA4 adapters. */
const analytics = (() => {
  const providers = [], queue = [];
  return {
    use(p) { providers.push(p); queue.forEach(e => { try { p.track(e); } catch (x) { /* provider error */ } }); },
    track(name, props) {
      const e = { name, props: props || {}, lang: LANG, page: Router.current, at: new Date().toISOString() };
      queue.push(e); if (queue.length > 300) queue.shift();
      providers.forEach(p => { try { p.track(e); } catch (x) { /* provider error */ } });
    },
    events: () => queue.slice()
  };
})();
window.AfriFarmAnalytics = analytics;

/* ---------- Platform capabilities (artifact runtime) ---------- */
/* Build target: 'artifact' (single file preview, host storage) or 'production' (own domain, /api endpoints). */
const TARGET = typeof AF_TARGET !== 'undefined' ? AF_TARGET : 'artifact';
const API_MODE = TARGET === 'production';
const CFG = window.AF_CONFIG || {};
const CAP = { db: null, user: null, uid: null, canWrite: null, owner: false, ready: false, refused: false };
const capReady = (async () => {
  const c = window.AF_HOST; /* storage API provided by a preview host, if any */
  if (!API_MODE && c && typeof c.use === 'function') {
    try {
      const [db, user] = await Promise.all([c.use('db').catch(() => null), c.use('user').catch(() => null)]);
      CAP.db = db; CAP.user = user;
      if (user) {
        const [id, can, own] = await Promise.all([user.id().catch(() => null), user.can('data.write').catch(() => null), user.isOwner().catch(() => false)]);
        CAP.uid = id; CAP.canWrite = can; CAP.owner = !!own;
      }
    } catch (e) { /* capability unavailable: preview mode */ }
  }
  CAP.ready = true;
  D.dispatchEvent(new CustomEvent('af:cap'));
  return CAP;
})();
const writable = () => API_MODE || !!(CAP.db && CAP.uid && CAP.canWrite !== false && !CAP.refused);

/* ---------- Forms ---------- */
const COUNTRY_CODES = 'AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN EH YE ZM ZW'.split(' ');
const countryName = (code, lang) => { try { return new Intl.DisplayNames([lang || LANG], { type: 'region' }).of(code) || code; } catch (e) { return code; } };
const FAVOURED = ['CM', 'RW', 'KE', 'NG', 'CI', 'SN', 'GA', 'CD', 'FR', 'US'];

const FORM_DEFS = {
  contact: {
    col: 'inquiries', submit: 'send', ok: ['okT', 'okD'],
    fields: [
      { n: 'name', k: 'text', req: 1, min: 2, max: 100, ac: 'name' },
      { n: 'email', k: 'email', req: 1, max: 254, ac: 'email' },
      { n: 'organization', k: 'text', lab: 'org', max: 150, ac: 'organization', opt: 1 },
      { n: 'country', k: 'country', req: 1, ac: 'country' },
      { n: 'phone', k: 'tel', max: 30, ac: 'tel', opt: 1 },
      { n: 'orgType', k: 'select', opts: 'orgTypes', opt: 1 },
      { n: 'subject', k: 'select', opts: 'subjects', req: 1, full: 1 },
      { n: 'message', k: 'textarea', req: 1, min: 20, max: 2000, full: 1 },
      { n: 'consent', k: 'consent', req: 1, full: 1 }
    ]
  },
  demo: {
    col: 'demoRequests', submit: 'sendDemo', ok: ['okDemoT', 'okDemoD'],
    fields: [
      { n: 'name', k: 'text', req: 1, min: 2, max: 100, ac: 'name' },
      { n: 'email', k: 'email', lab: 'workEmail', req: 1, max: 254, ac: 'email' },
      { n: 'organization', k: 'text', lab: 'org', req: 1, min: 2, max: 150, ac: 'organization' },
      { n: 'country', k: 'country', req: 1, ac: 'country' },
      { n: 'role', k: 'text', req: 1, min: 2, max: 100, ac: 'organization-title' },
      { n: 'orgType', k: 'select', opts: 'orgTypes', req: 1 },
      { n: 'interest', k: 'select', opts: 'interests', req: 1 },
      { n: 'scale', k: 'select', opts: 'scales', opt: 1 },
      { n: 'method', k: 'radio', opts: 'methods', req: 1, full: 1, def: 0 },
      { n: 'phone', k: 'tel', lab: 'phoneNeeded', max: 30, ac: 'tel', full: 1, when: v => v.method != null && v.method !== '' && v.method !== '0' },
      { n: 'message', k: 'textarea', min: 0, max: 2000, full: 1, opt: 1 },
      { n: 'consent', k: 'consent', req: 1, full: 1 }
    ]
  },
  newsletter: {
    col: 'subscribers', submit: 'btn', ok: ['okT', 'okD'],
    fields: [
      { n: 'email', k: 'email', req: 1, max: 254, ac: 'email' },
      { n: 'language', k: 'lang' },
      { n: 'consent', k: 'consent', req: 1, full: 1 }
    ]
  }
};
const FORM_STATE = {}; // values kept across re-renders and language switches
const LAST_SENT = {};
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const PHONE_RE = /^\+?[0-9 ().]{6,24}$/;
const clean = (v, multi) => {
  let s = String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  s = multi ? s.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim() : s.replace(/\s+/g, ' ').trim();
  return s;
};

function fieldHTML(id, f, vals, compact) {
  const F = L().form, N = L().newsletter;
  const fid = id + '-' + f.n, v = vals[f.n] == null ? '' : vals[f.n];
  const lab = f.k === 'email' && id.startsWith('nl') ? N.email : (F[f.lab || f.n] || f.n);
  const reqMark = f.req ? '<span class="req" aria-hidden="true">*</span>' : '';
  const optMark = f.opt ? ' <span class="faint">(' + F.optional + ')</span>' : '';
  const desc = 'aria-describedby="' + fid + '-err"';
  const wrapCls = 'f' + (f.full ? ' full' : '');
  const hidden = f.when && !f.when(vals) ? ' hidden' : '';
  const err = '<p class="err" id="' + fid + '-err"></p>';
  const lbl = '<label for="' + fid + '">' + esc(lab) + reqMark + optMark + '</label>';
  const common = 'id="' + fid + '" name="' + f.n + '" ' + desc + (f.req ? ' required aria-required="true"' : '');
  switch (f.k) {
    case 'text': case 'email': case 'tel': {
      const type = f.k === 'email' ? 'email' : f.k === 'tel' ? 'tel' : 'text';
      const im = f.k === 'email' ? ' inputmode="email" autocapitalize="off" spellcheck="false"' : f.k === 'tel' ? ' inputmode="tel"' : '';
      const ph = f.k === 'email' && id.startsWith('nl') ? ' placeholder="' + esc(N.ph) + '"' : '';
      if (compact) return '<div class="' + wrapCls + '"' + hidden + '><label class="vh" for="' + fid + '">' + esc(lab) + '</label><input class="inp" type="' + type + '" ' + common + ' value="' + esc(v) + '" autocomplete="' + (f.ac || 'off') + '" maxlength="' + f.max + '"' + im + ph + '>' + err + '</div>';
      return '<div class="' + wrapCls + '"' + hidden + '>' + lbl + '<input class="inp" type="' + type + '" ' + common + ' value="' + esc(v) + '" autocomplete="' + (f.ac || 'off') + '" maxlength="' + f.max + '"' + im + ph + '>' + err + '</div>';
    }
    case 'textarea':
      return '<div class="' + wrapCls + '">' + lbl + '<textarea class="inp" ' + common + ' maxlength="' + f.max + '" rows="6">' + esc(v) + '</textarea><div class="form-foot"><p class="err" id="' + fid + '-err"></p><span class="small faint mono" id="' + fid + '-count" aria-live="off">' + F.chars(String(v).length, f.max) + '</span></div></div>';
    case 'select': {
      const opts = F[f.opts].map((o, i) => '<option value="' + i + '"' + (String(v) === String(i) ? ' selected' : '') + '>' + esc(o) + '</option>').join('');
      return '<div class="' + wrapCls + '">' + lbl + '<select class="inp" ' + common + '><option value="">' + esc(F.choose) + '</option>' + opts + '</select>' + err + '</div>';
    }
    case 'country': {
      const all = COUNTRY_CODES.map(c => [c, countryName(c)]).sort((a, b) => a[1].localeCompare(b[1], LANG));
      const fav = FAVOURED.map(c => [c, countryName(c)]);
      const o = (arr) => arr.map(([c, n]) => '<option value="' + c + '"' + (v === c ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
      return '<div class="' + wrapCls + '">' + lbl + '<select class="inp" ' + common + '><option value="">' + esc(F.choose) + '</option><optgroup label="' + (LANG === 'fr' ? 'Fréquents' : 'Frequent') + '">' + o(fav) + '</optgroup><optgroup label="' + (LANG === 'fr' ? 'Tous les pays' : 'All countries') + '">' + o(all) + '</optgroup></select>' + err + '</div>';
    }
    case 'radio': {
      const cur = v === '' ? String(f.def || 0) : String(v);
      const opts = F[f.opts].map((o, i) => '<label class="chk" style="align-items:center"><input type="radio" name="' + f.n + '" value="' + i + '"' + (cur === String(i) ? ' checked' : '') + '> ' + esc(o) + '</label>').join('');
      return '<fieldset class="' + wrapCls + '" style="border:0;padding:0;margin:0"><legend class="lbl" style="font-size:13px;color:var(--fg-2);font-weight:500;margin-bottom:7px">' + esc(F[f.n]) + reqMark + '</legend><div style="display:flex;gap:18px;flex-wrap:wrap">' + opts + '</div></fieldset>';
    }
    case 'lang': {
      const cur = v === '' ? LANG : v;
      return '<div class="' + wrapCls + '"><label for="' + fid + '">' + esc(N.langPref) + '</label><select class="inp" id="' + fid + '" name="language"><option value="en"' + (cur === 'en' ? ' selected' : '') + '>English</option><option value="fr"' + (cur === 'fr' ? ' selected' : '') + '>Français</option></select></div>';
    }
    case 'consent': {
      const text = id.startsWith('nl') ? N.consent : F.consent;
      return '<div class="' + wrapCls + '"><label class="chk"><input type="checkbox" ' + common + (v ? ' checked' : '') + '> <span>' + esc(text).replace(/(privacy policy|politique de confidentialité)/, '<a href="#privacy">$1</a>') + '</span></label>' + err + '</div>';
    }
  }
  return '';
}

function formHTML(type, id, opts) {
  opts = opts || {};
  const def = FORM_DEFS[type], F = L().form, N = L().newsletter;
  const vals = FORM_STATE[id] || (FORM_STATE[id] = {});
  const hp = '<div class="hp" aria-hidden="true"><label for="' + id + '-website">' + esc(F.hp) + '</label><input id="' + id + '-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>';
  const banner = opts.compact ? '<p class="small faint" data-preview hidden style="font-size:12px"><span style="color:var(--warn)">●</span> ' + esc(F.previewShort) + '</p>' : '<div class="preview-banner full" data-preview hidden><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style="flex:none;margin-top:2px"><circle cx="8" cy="8" r="7" fill="none" stroke="#E2B24A"/><path d="M8 4.5v4.2M8 11v.5" stroke="#E2B24A" stroke-width="1.6" stroke-linecap="round"/></svg><div><b>' + esc(F.previewBanner) + '</b>' + esc(F.previewText) + '</div></div>';
  const btnLabel = type === 'newsletter' ? N.btn : F[def.submit];
  const ts = API_MODE && CFG.turnstileSiteKey ? '<div class="full" data-ts></div>' : '';
  if (opts.compact) {
    const email = def.fields[0], consent = def.fields[2];
    return '<form class="nlf" id="' + id + '" data-type="' + type + '" novalidate>' +
      '<div class="row">' + fieldHTML(id, email, vals, true).replace('class="f"', 'class="f" style="flex:1;min-width:0"') + '<button class="btn btn-green" type="submit" data-label="' + esc(btnLabel) + '">' + esc(btnLabel) + '</button></div>' +
      fieldHTML(id, consent, vals) + ts + hp + '<input type="hidden" name="language" value="' + LANG + '">' +
      '<p class="err" role="alert" data-summary></p>' + banner + '</form>';
  }
  return '<form class="fm panel" id="' + id + '" data-type="' + type + '" novalidate>' +
    '<p class="err full" role="alert" data-summary></p>' + banner +
    def.fields.map(f => fieldHTML(id, f, vals)).join('') + ts + hp +
    '<div class="form-foot full"><p class="small faint">' + esc(F.why) + '</p><button class="btn btn-primary" type="submit" data-label="' + esc(btnLabel) + '">' + esc(btnLabel) + ARROW + '</button></div></form>';
}

function readForm(form) {
  const type = form.dataset.type, def = FORM_DEFS[type], fd = new FormData(form), v = {};
  def.fields.forEach(f => {
    if (f.k === 'consent') v[f.n] = !!form.querySelector('[name="' + f.n + '"]:checked');
    else v[f.n] = clean(fd.get(f.n), f.k === 'textarea');
  });
  if (!v.language) v.language = clean(fd.get('language')) || LANG;
  v.website = clean(fd.get('website'));
  return v;
}

function validateField(f, v, vals) {
  const E = L().form.err;
  if (f.when && !f.when(vals)) return '';
  if (f.k === 'consent') return f.req && !v ? E.consent : '';
  if (f.k === 'radio' || f.k === 'lang') return '';
  const s = v == null ? '' : String(v);
  const req = f.req || (f.n === 'phone' && f.when && f.when(vals));
  if (!s) return req ? E.required : '';
  if (f.k === 'email' && (!EMAIL_RE.test(s) || s.length > 254)) return E.email;
  if (f.k === 'tel' && !PHONE_RE.test(s)) return E.phone;
  if (f.min && s.length < f.min) return E.min(f.min);
  if (f.max && s.length > f.max) return E.max(f.max);
  return '';
}

function showErr(form, name, msg) {
  const el = form.querySelector('[name="' + name + '"]'); const err = form.querySelector('#' + form.id + '-' + name + '-err');
  if (el && el.type !== 'radio') { if (msg) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid'); }
  if (err) err.textContent = msg || '';
}

const sha = async (s) => {
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('').slice(0, 40); }
  catch (e) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return 'f' + (h >>> 0).toString(16); }
};
/* Canonical codes stored in the database, independent of the interface language. */
const CODES = {
  orgTypes: ['FARM', 'COOPERATIVE', 'AGRIBUSINESS', 'FINANCE', 'INVESTOR', 'PUBLIC', 'DEVELOPMENT', 'RESEARCH', 'MEDIA', 'OTHER'],
  subjects: ['PARTNERSHIP', 'PILOT', 'INVESTMENT', 'DATA', 'MEDIA', 'OTHER'],
  interests: ['FARM_PLANNING', 'INVESTMENT', 'COOPERATIVE', 'SUPPLY', 'RISK', 'PUBLIC_PROGRAMME', 'FOUMBOT_PILOT'],
  scales: ['UNDER_1_HA', 'HA_1_10', 'HA_10_100', 'OVER_100_HA', 'NOT_APPLICABLE'],
  methods: ['EMAIL', 'PHONE', 'WHATSAPP']
};
const CODE = (k, i) => (i === '' || i == null) ? null : (CODES[k][+i] || null);
const orNull = v => (v === '' || v == null) ? null : v;
let tsPromise = null;
const loadTurnstile = () => tsPromise || (tsPromise = new Promise((resolve, reject) => {
  const s = D.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.async = true; s.defer = true;
  s.onload = () => resolve(window.turnstile); s.onerror = reject; D.head.appendChild(s);
}));
async function persistApi(type, v, form, mountedAt) {
  const base = { name: v.name, email: v.email, organization: orNull(v.organization), country: orNull(v.country), phone: orNull(v.phone), organizationType: CODE('orgTypes', v.orgType), message: orNull(v.message), consent: !!v.consent };
  const payload = type === 'newsletter' ? { email: v.email, language: v.language === 'fr' ? 'fr' : 'en', consent: !!v.consent }
    : type === 'contact' ? Object.assign(base, { subject: CODE('subjects', v.subject) })
    : Object.assign(base, { role: v.role, interest: CODE('interests', v.interest), scale: CODE('scales', v.scale), contactMethod: CODE('methods', v.method === '' || v.method == null ? '0' : v.method) });
  payload.uiLanguage = LANG; payload.website = v.website || ''; payload.elapsedMs = Date.now() - mountedAt;
  const tk = form.querySelector('[name="cf-turnstile-response"]'); if (tk && tk.value) payload.turnstileToken = tk.value;
  let res;
  try { res = await fetch('/api/' + type, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload), credentials: 'same-origin' }); }
  catch (e) { throw { code: 'unavailable' }; }
  let j = {}; try { j = await res.json(); } catch (e) { /* empty body */ }
  if (res.ok) return j.status === 'duplicate' ? 'dup' : 'ok';
  throw { code: res.status === 429 ? 'rate_limited' : res.status === 422 ? 'invalid' : res.status === 403 ? 'challenge' : res.status >= 500 ? 'server' : 'rejected', fields: j.fields || null };
}
const EN_OPT = (key, idx) => (idx === '' || idx == null) ? null : (I18N.en.form[key][+idx] || null);

async function persist(type, v) {
  const now = new Date().toISOString(), uid = CAP.uid, db = CAP.db;
  if (type === 'newsletter') {
    const email = v.email.toLowerCase();
    const ref = db.collection('subscribers/' + uid + '/emails').doc(await sha(email));
    const snap = await ref.get();
    if (snap.exists && (snap.data() || {}).status === 'SUBSCRIBED') return 'dup';
    await ref.set({ email, status: 'SUBSCRIBED', consent: true, consentText: I18N[v.language === 'fr' ? 'fr' : 'en'].newsletter.consent, language: v.language === 'fr' ? 'fr' : 'en', source: 'website', createdAt: now, unsubscribedAt: null });
    await db.doc('subscribers/' + uid).set({ updatedAt: now });
    return 'ok';
  }
  const base = { name: v.name, email: v.email.toLowerCase(), organization: v.organization || null, country: v.country || null, countryName: v.country ? countryName(v.country, 'en') : null, phone: v.phone || null, orgType: EN_OPT('orgTypes', v.orgType), message: v.message || null, status: 'NEW', language: LANG, source: 'website', consent: true, createdAt: now, updatedAt: now };
  const rec = type === 'contact'
    ? Object.assign(base, { subject: EN_OPT('subjects', v.subject) })
    : Object.assign(base, { role: v.role, interest: EN_OPT('interests', v.interest), scale: EN_OPT('scales', v.scale), contactMethod: EN_OPT('methods', v.method), phone: v.method !== '0' ? (v.phone || null) : (v.phone || null) });
  const col = FORM_DEFS[type].col;
  await db.collection(col + '/' + uid + '/items').add(rec);
  await db.doc(col + '/' + uid).set({ updatedAt: now });
  return 'ok';
}

function resultHTML(kind, title, text, actions) {
  const icon = kind === 'ok'
    ? '<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path class="check-path" d="M6 13.5l4.5 4.5L20 8.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    : '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5v7M12 17v.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  return '<div class="result ' + (kind === 'ok' ? '' : kind) + '" role="status" tabindex="-1"><div class="ic">' + icon + '</div><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div style="display:flex;gap:10px;flex-wrap:wrap">' + actions + '</div></div>';
}

function bindForm(form, opts) {
  opts = opts || {};
  const type = form.dataset.type, def = FORM_DEFS[type], id = form.id, F = L().form, N = L().newsletter;
  const mountedAt = Date.now();
  const touched = {};
  const sync = () => { const v = readForm(form); FORM_STATE[id] = Object.assign(FORM_STATE[id] || {}, v); return v; };
  const preview = () => { const b = form.querySelector('[data-preview]'); if (b) b.hidden = !(CAP.ready && !writable()); };
  preview(); D.addEventListener('af:cap', preview, { once: true });
  const tsBox = form.querySelector('[data-ts]');
  if (tsBox) loadTurnstile().then(t => { if (t && tsBox.isConnected) t.render(tsBox, { sitekey: CFG.turnstileSiteKey, theme: 'dark', language: LANG, size: 'flexible' }); }).catch(() => { /* challenge unavailable: server decides */ });
  form.addEventListener('input', e => {
    const v = sync(), name = e.target.name;
    if (name === 'message') { const c = form.querySelector('#' + id + '-message-count'); if (c) c.textContent = F.chars(e.target.value.length, 2000); }
    if (name === 'method') { def.fields.filter(f => f.when).forEach(f => { const w = form.querySelector('#' + id + '-' + f.n); if (w) { const box = w.closest('.f'); if (box) box.hidden = !f.when(v); } }); }
    if (touched[name]) { const f = def.fields.find(x => x.n === name); if (f) showErr(form, name, validateField(f, v[name], v)); }
  });
  form.addEventListener('focusout', e => {
    const name = e.target.name; if (!name || name === 'website') return;
    touched[name] = true; const v = sync(); const f = def.fields.find(x => x.n === name);
    if (f && (e.target.value || f.k === 'consent')) showErr(form, name, validateField(f, v[name], v));
  });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const v = sync(); const sum = form.querySelector('[data-summary]');
    const errs = def.fields.map(f => [f, validateField(f, v[f.n], v)]).filter(x => x[1]);
    def.fields.forEach(f => showErr(form, f.n, ''));
    errs.forEach(([f, m]) => { showErr(form, f.n, m); touched[f.n] = true; });
    if (errs.length) {
      sum.textContent = F.err.summary(errs.length);
      const first = form.querySelector('[name="' + errs[0][0].n + '"]'); if (first) first.focus();
      analytics.track('form_invalid', { form: type, fields: errs.map(x => x[0].n) });
      return;
    }
    sum.textContent = '';
    if (v.website || Date.now() - mountedAt < 2500) { done('ok'); return; } // honeypot or bot speed: accept silently, store nothing
    if (LAST_SENT[type] && Date.now() - LAST_SENT[type] < 60000) { sum.textContent = F.waitD; return; }
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.innerHTML = '<span class="spin" aria-hidden="true"></span>' + esc(F.sending);
    await capReady;
    if (!writable()) { restore(); done('pre'); return; }
    let res;
    const save = () => API_MODE ? persistApi(type, v, form, mountedAt) : persist(type, v);
    try { res = await save(); }
    catch (err) {
      const code = err && err.code;
      if (code === 'rate_limited') { restore(); sum.textContent = F.waitD; return; }
      if (code === 'challenge') { restore(); sum.textContent = F.challengeD; resetTs(); return; }
      if (code === 'invalid') { restore(); const fl = err.fields || {}; const names = Object.keys(fl); names.forEach(n => showErr(form, n, F.err.check)); sum.textContent = F.err.summary(Math.max(1, names.length)); return; }
      if (code === 'unavailable' || code === 'server') {
        await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
        try { res = await save(); } catch (err2) { restore(); fail(err2 && err2.code); resetTs(); return; }
      } else if (code === 'invalid_argument' || code === 'not_granted' || code === 'revoked' || code === 'capability_disabled' || code === 'capability_removed') {
        CAP.refused = true; restore(); done('pre'); return;
      } else { restore(); fail(code); return; }
    }
    LAST_SENT[type] = Date.now();
    done(res === 'dup' ? 'dup' : 'ok');
    function resetTs() { if (tsBox && window.turnstile) { try { window.turnstile.reset(tsBox); } catch (x) { /* widget gone */ } } }
    function restore() { btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = esc(btn.dataset.label) + (opts.compact ? '' : ARROW); }
  });
  function fail(code) {
    const sum = form.querySelector('[data-summary]');
    sum.textContent = code === 'quota_exceeded' ? F.quotaD : F.badD;
    analytics.track('form_error', { form: type, code: code || 'unknown' });
  }
  function done(kind) {
    const isNl = type === 'newsletter';
    let t, d;
    if (kind === 'pre') { t = F.preT; d = F.preD; }
    else if (kind === 'dup') { t = N.dupT; d = N.dupD; }
    else if (isNl) { t = N.okT; d = N.okD; }
    else { t = F[def.ok[0]]; d = F[def.ok[1]]; }
    const wrap = form.parentNode;
    const holder = D.createElement('div');
    holder.className = opts.compact ? '' : 'panel';
    const again = kind === 'pre'
      ? '<button class="btn btn-ghost btn-sm" type="button" data-edit>' + esc(F.edit) + '</button>'
      : (isNl ? '' : '<button class="btn btn-ghost btn-sm" type="button" data-again>' + esc(F.again) + '</button>') + '<a class="btn btn-ghost btn-sm" href="#home">' + esc(L().nav.home) + '</a>';
    holder.innerHTML = resultHTML(kind === 'pre' ? 'pre' : 'ok', t, d, again);
    wrap.replaceChild(holder, form);
    const r = holder.querySelector('.result'); if (r) r.focus({ preventScroll: false });
    if (kind === 'ok' && !isNl) FORM_STATE[id] = {};
    if (kind === 'ok' && isNl) FORM_STATE[id] = {};
    analytics.track(kind === 'pre' ? 'form_preview' : 'form_submitted', { form: type, result: kind });
    holder.addEventListener('click', ev => {
      if (ev.target.closest('[data-again],[data-edit]')) {
        const tmp = D.createElement('div'); tmp.innerHTML = formHTML(type, id, opts);
        const nf2 = tmp.firstChild; wrap.replaceChild(nf2, holder); bindForm(nf2, opts);
        const first = nf2.querySelector('input,select,textarea'); if (first) first.focus();
      }
    });
  }
}
