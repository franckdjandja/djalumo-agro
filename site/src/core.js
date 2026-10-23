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
  try { return new Intl.NumberFormat(L().meta.locale, { style: 'currency', currency: cur, maximumFractionDigits: Math.abs(v) >= 100 || v === 0 || cur === 'XAF' || cur === 'RWF' || cur === 'NGN' || cur === 'KES' ? 0 : 2 }).format(v); }
  catch (e) { return nf(v) + ' ' + cur; }
};
const monthName = (m, style = 'long') => {
  const s = new Intl.DateTimeFormat(L().meta.locale, { month: style }).format(new Date(2027, ((m % 12) + 12) % 12, 1));
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const ARROW = '<svg class="arr" width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const LOGO = '<svg class="logo" viewBox="-6 259 4983 762" aria-hidden="true" focusable="false"><path d="M70 1000V280H303Q311.5 280 338 280.5Q364.5 281 389 284Q476 294.5 536.5 344.5Q597 394.5 628.5 471.5Q660 548.5 660 640Q660 731.5 628.5 808.5Q597 885.5 536.5 935.5Q476 985.5 389 996Q364.5 999 338 999.5Q311.5 1000 303 1000ZM208 872H303Q316.5 872 339.5 871.2Q362.5 870.5 381 867Q428 857.5 457.8 823Q487.5 788.5 501.8 740Q516 691.5 516 640Q516 586 501.2 537.5Q486.5 489 456.5 455.5Q426.5 422 381 413Q362.5 409 339.5 408.5Q316.5 408 303 408H208Z M961 1015Q875 1015 819.2 971Q763.5 927 740 852L874 820Q878.5 847.5 903 867.8Q927.5 888 955 888Q974 888 995.8 877.5Q1017.5 867 1027 844Q1033 829.5 1034 808.5Q1035 787.5 1035 760V280H1173V760Q1173 794.5 1172.8 820Q1172.5 845.5 1167.8 867.8Q1163 890 1149 914Q1118.5 967 1069.5 991Q1020.5 1015 961 1015Z M1283 1000 1503 280H1706L1926 1000H1786L1590 365H1616L1423 1000ZM1415 850V723H1795V850Z M2056 1000V280H2192V873H2502V1000Z M2910 1015Q2823 1015 2757 979.8Q2691 944.5 2654 880.5Q2617 816.5 2617 730V281L2755 280V729Q2755 764.5 2767 793.5Q2779 822.5 2800.2 843.5Q2821.5 864.5 2849.8 875.8Q2878 887 2910 887Q2943 887 2971.2 875.5Q2999.5 864 3020.5 843Q3041.5 822 3053.2 793Q3065 764 3065 729V280H3203V730Q3203 816.5 3166 880.5Q3129 944.5 3063 979.8Q2997 1015 2910 1015Z M3373 1000V280H3495L3733 758L3971 280H4093V1000H3966V570L3757 1000H3709L3500 570V1000Z" fill="currentColor"/><g transform="translate(4273.0 265.0) scale(7.5000)"><ellipse cx="46.53" cy="50" rx="37.53" ry="41.0" fill="none" stroke="currentColor" stroke-width="18"/><g transform="translate(24.92 27.29) scale(0.4366)"><g mask="url(#dj-cm)"><path d="M17.4 3.1 C18.6 2.9 20.8 4.2 22.9 4 C24.9 3.8 27.9 2.1 30 1.7 C32.1 1.3 34.1 1.6 35.7 1.4 C37.3 1.3 38.8 1 39.7 1 C40.7 1 41.2 0.8 41.4 1.4 C41.6 2 41.2 4 41 4.7 C40.8 5.5 39.9 5.5 40 5.9 C40.1 6.2 40.7 6.3 41.4 6.6 C42.2 6.8 43.6 7 44.6 7.3 C45.5 7.5 46.5 7.6 47.3 8 C48.1 8.4 48.4 9.2 49.4 9.7 C50.5 10.2 52.9 11.1 53.7 10.9 C54.5 10.6 53.6 9 54.3 8.4 C55 7.9 56.8 7.3 58 7.4 C59.2 7.5 59.7 8.6 61.4 9 C63.2 9.4 66.7 9.6 68.4 9.7 C70.2 9.8 71.2 9.3 71.9 9.6 C72.5 9.9 71.8 10.6 72.1 11.6 C72.5 12.6 73.3 14 74 15.4 C74.7 16.8 75.6 18.2 76.4 20 C77.2 21.8 77.9 24.3 78.9 26.3 C79.8 28.3 80.8 30.4 82.1 32 C83.5 33.6 85.8 34.8 86.7 35.7 C87.6 36.7 87 37.1 87.6 37.7 C88.1 38.3 88.6 39.4 90 39.4 C91.4 39.5 94.5 38.5 96 38.1 C97.5 37.8 98.5 37.2 99 37.4 C99.5 37.6 99.1 38.5 98.7 39.4 C98.4 40.3 97.5 41.6 96.9 42.9 C96.2 44.1 96.1 45.3 95 46.7 C93.9 48.1 91.9 50.1 90.4 51.4 C89 52.8 87.5 53.8 86.4 54.9 C85.4 55.9 84.8 56.7 84.1 57.6 C83.5 58.4 82.8 58.9 82.4 60 C82 61.1 81.9 62.6 81.9 64 C81.9 65.4 82.1 67.1 82.4 68.6 C82.7 70 83.5 71.5 83.6 72.9 C83.7 74.2 84 75.3 83.1 76.4 C82.3 77.6 79.7 78.8 78.4 79.9 C77.1 80.9 75.8 81.1 75.4 82.6 C75.1 84 76.8 87 76.3 88.4 C75.8 89.9 73.1 90.3 72.3 91.4 C71.5 92.6 71.8 94.5 71.4 95.4 C71 96.4 71 96 70 97 C69 98 66.9 100.5 65.6 101.4 C64.3 102.4 64.2 102.4 62.3 102.9 C60.4 103.3 56 104 54.3 104 C52.6 104 52.5 103.6 52 103.1 C51.5 102.6 51.8 102.2 51.4 101 C51.1 99.8 50.5 97.5 49.9 96 C49.2 94.5 48 93.8 47.4 92.3 C46.9 90.8 47.2 89 46.4 87 C45.6 85 43.1 82.4 42.6 80.6 C42 78.7 42.8 77.4 43.1 76 C43.5 74.6 44.6 73.8 44.9 72.3 C45.1 70.8 44.8 68.4 44.6 66.9 C44.3 65.3 43.6 64 43.3 63 C43 62 43.1 61.8 42.7 61.1 C42.3 60.5 41.6 60.1 40.9 59.1 C40.1 58.1 38.4 56 38.1 55.1 C37.9 54.2 38.9 54.3 39.1 53.7 C39.4 53.1 39.6 52.2 39.7 51.6 C39.8 51 39.9 50.6 39.9 50.1 C39.8 49.6 39.9 49 39.6 48.6 C39.3 48.2 38.6 47.8 38 47.7 C37.4 47.6 36.5 47.9 35.9 48 C35.2 48.1 34.9 48.6 34.3 48.1 C33.7 47.7 32.8 45.9 32.1 45.4 C31.5 44.9 31.1 45.2 30.6 45.1 C30.1 45.1 29.7 45.1 29.1 45.2 C28.6 45.3 28.1 45.4 27.4 45.6 C26.8 45.8 26.2 46 25.4 46.3 C24.6 46.6 23.6 47.4 22.7 47.5 C21.8 47.6 21.3 46.6 20 46.7 C18.7 46.8 16.3 48.2 14.7 48 C13.1 47.8 11.6 46.3 10.3 45.3 C9 44.3 7.5 42.9 6.9 42.1 C6.2 41.4 6.7 41.5 6.1 40.7 C5.6 39.9 4.1 38.2 3.4 37.3 C2.7 36.4 2.5 35.8 2 35.1 C1.6 34.5 0.7 33.9 0.7 33.3 C0.7 32.7 1.8 32.2 2.1 31.4 C2.5 30.6 3 29.6 2.9 28.4 C2.7 27.3 1.4 25.9 1.4 24.6 C1.4 23.2 2.4 21.7 3 20.4 C3.6 19.2 4.3 18 5 17 C5.7 16 6.1 15.4 7.3 14.4 C8.4 13.4 11.3 11.7 12 10.9 C12.7 10 11.2 10.1 11.7 9.3 C12.2 8.5 14.1 6.9 14.9 6.3 C15.6 5.7 15.6 6.2 16 5.7 C16.4 5.2 16.3 3.4 17.4 3.1Z" fill="url(#dj-terres)"/><path d="M96.1 71.4 C96.7 71.9 97.8 75 97.9 76.4 C97.9 77.9 96.9 78.5 96.3 80 C95.7 81.5 94.9 84 94.3 85.7 C93.7 87.4 93.6 89.2 92.9 90 C92.1 90.8 90.8 91.1 90 90.7 C89.2 90.3 88.5 88.7 88.1 87.7 C87.7 86.8 87.4 85.9 87.6 85 C87.7 84.1 88.8 83.2 89 82.1 C89.2 81.1 88.2 79.5 88.6 78.6 C89 77.7 90.5 77.5 91.4 76.7 C92.4 75.9 93.5 74.5 94.3 73.6 C95.1 72.7 95.5 71 96.1 71.4Z" fill="url(#dj-terres)"/></g><circle cx="43" cy="47" r="2.6" fill="currentColor"/></g></g><path d="" fill="currentColor"/></svg>';

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
window.DjalumoAnalytics = analytics;

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
  const banner = opts.compact ? '<p class="small faint" data-preview hidden style="font-size:12px"><span style="color:var(--warn)">●</span> ' + esc(F.previewShort) + '</p>' : '<div class="preview-banner full" data-preview hidden><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" style="flex:none;margin-top:2px"><circle cx="8" cy="8" r="7" fill="none" stroke="#A26A16"/><path d="M8 4.5v4.2M8 11v.5" stroke="#A26A16" stroke-width="1.6" stroke-linecap="round"/></svg><div><b>' + esc(F.previewBanner) + '</b>' + esc(F.previewText) + '</div></div>';
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
