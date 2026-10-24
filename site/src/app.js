/* ---------- Android application shell ----------
   A native style interface over the same engine, knowledge base and content as the website:
   a home built around one question, a season plan in three steps, plans saved on the phone,
   markets, field evidence and the rest of the project under More. Everything works offline,
   only the forms and the report requests use the network. */
const AP = () => L().app;
const AS = { stack: ['home'], scroll: {}, role: store.get('dj.role') || '', toastT: 0, cleanups: [] };
const SNAP_KEYS = ['capital', 'currency', 'mode', 'area', 'crop', 'water', 'start', 'land', 'market', 'familyLabour', 'ownTools', 'prices', 'products', 'horizons'];
const clone = (o) => JSON.parse(JSON.stringify(o));
const snapPlan = () => clone(SNAP_KEYS.reduce((o, k) => { o[k] = PLAN[k]; return o; }, {}));
const usePlan = (s) => { SNAP_KEYS.forEach(k => { if (s && s[k] !== undefined) PLAN[k] = clone(s[k]); }); };
const saveDraft = () => store.set('dj.draft', JSON.stringify(snapPlan()));
const loadPlans = () => { try { const v = JSON.parse(store.get('dj.plans') || '[]'); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
const writePlans = (a) => store.set('dj.plans', JSON.stringify(a.slice(0, 60)));
const withCur = (cur, fn) => { const c = PLAN.currency; PLAN.currency = cur; try { return fn(); } finally { PLAN.currency = c; } };
const capXaf = () => PLAN.capital / curRate();
const QUICK = { USD: [100, 500, 2000, 10000], EUR: [100, 500, 2000, 10000], XAF: [60000, 300000, 1200000, 6000000], RWF: [150000, 700000, 2800000, 14000000], KES: [13000, 65000, 260000, 1300000], NGN: [160000, 800000, 3200000, 16000000] };

/* Line icons, 24 px grid */
const ic = (d, extra) => '<svg class="a-ic" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false"' + (extra || '') + '>' + d + '</svg>';
const I = {
  home: ic('<path d="M3.5 10.6 12 4l8.5 6.6V19a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.8H9.2v5.8H5A1.5 1.5 0 0 1 3.5 19Z"/>'),
  plans: ic('<path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v15.5L12 16.6l-6.5 3.9V5A1.5 1.5 0 0 1 7 3.5Z"/>'),
  markets: ic('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5Z"/>'),
  field: ic('<path d="M4 19.5h16M7 19.5c0-5 2-8.6 5-11.2 3 2.6 5 6.2 5 11.2M12 8.3V4.5M12 13c-1.6-1-3.2-1.4-5-1.3M12 13c1.6-1 3.2-1.4 5-1.3"/>'),
  more: ic('<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  chev: ic('<path d="M9.5 6l6 6-6 6"/>'),
  edit: ic('<path d="M4.5 19.5h4l10-10-4-4-10 10Z M13 7l4 4"/>'),
  save: ic('<path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v15.5L12 16.6l-6.5 3.9V5A1.5 1.5 0 0 1 7 3.5Z"/>'),
  saved: ic('<path d="M7 3.5h10A1.5 1.5 0 0 1 18.5 5v15.5L12 16.6l-6.5 3.9V5A1.5 1.5 0 0 1 7 3.5Z" fill="currentColor"/>'),
  pdf: ic('<path d="M6.5 3.5h8l4 4v12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z M14 3.5v4.5h4.5 M9 13h6M9 16.5h6"/>'),
  trash: ic('<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>'),
  arrow: ic('<path d="M5 12h13M13 6.5 18.5 12 13 17.5"/>'),
  ext: ic('<path d="M10 5.5H6a1 1 0 0 0-1 1V18a1 1 0 0 0 1 1h11.5a1 1 0 0 0 1-1v-4M14 4.5h5.5V10M19.5 4.5 11 13"/>'),
  check: ic('<path d="M5 12.5 10 17.5 19 7"/>'),
  star: ic('<path d="M12 4.2l2.3 4.8 5.2.7-3.8 3.6.9 5.2L12 16l-4.6 2.5.9-5.2-3.8-3.6 5.2-.7Z" fill="currentColor" stroke="none"/>')
};
const ROLE_IC = {
  farmer: ic('<path d="M4 20h16M8 20c0-4 1.4-7 4-9 2.6 2 4 5 4 9M12 11V6M12 6c-1.5-1.6-3.3-2.2-5.2-2 .2 2 1 3.6 2.6 4.6M12 6c1.5-1.6 3.3-2.2 5.2-2-.2 2-1 3.6-2.6 4.6"/>'),
  coop: ic('<circle cx="8" cy="9" r="2.6"/><circle cx="16" cy="9" r="2.6"/><path d="M3.5 19c.6-3 2.3-4.6 4.5-4.6s3.9 1.6 4.5 4.6M11.5 19c.6-3 2.3-4.6 4.5-4.6s3.9 1.6 4.5 4.6"/>'),
  investor: ic('<path d="M4 19.5h16M6.5 16.5v-4M11 16.5V9M15.5 16.5V11.5M20 6l-5.5 4-3.5-2.5L4 12"/>'),
  buyer: ic('<path d="M3.5 6.5h17l-1.6 8.6a1.5 1.5 0 0 1-1.5 1.2H7.6a1.5 1.5 0 0 1-1.5-1.2L4.2 4.5H2.5M9 20.3h.01M16 20.3h.01"/>')
};

/* ---------- Navigation: an in app stack, tabs reset it ---------- */
const TAB_OF = (r) => r === 'plans' ? 'plans' : r === 'markets' ? 'markets' : r === 'field' ? 'field' : r === 'more' || r.indexOf('m-') === 0 ? 'more' : 'home';
const ALIAS = { planner: 'plan-1', home: 'home', field: 'field', simulator: 'plan-1' };
const SUBPAGES = ['about', 'platform', 'impact', 'intelligence', 'solutions', 'data', 'contact', 'demo', 'newsletter', 'privacy', 'terms'];
const routeFromHref = (h) => { const k = String(h || '').replace(/^#/, '').split(/[?&]/)[0]; if (!k) return null; if (ALIAS[k]) return ALIAS[k]; if (SUBPAGES.includes(k)) return 'm-' + k; if (k.indexOf('plate-') === 0) return null; return SCREENS[k] || k.indexOf('m-') === 0 ? k : null; };
const cur = () => AS.stack[AS.stack.length - 1];
function nav(r, mode) {
  AS.scroll[cur()] = window.scrollY;
  if (mode === 'tab') AS.stack = r === 'home' ? ['home'] : ['home', r];
  else if (mode === 'replace') AS.stack[AS.stack.length - 1] = r;
  else if (cur() !== r) AS.stack.push(r);
  appRender(false);
}
function back() {
  if (AS.stack.length > 1) { AS.scroll[cur()] = 0; AS.stack.pop(); appRender(true); return true; }
  return false;
}

/* ---------- Building blocks ---------- */
const topBar = (title, opts) => {
  opts = opts || {};
  return '<header class="a-bar' + (opts.solid ? ' solid' : '') + '">' + (opts.back !== false ? '<button type="button" class="a-icb" data-back aria-label="' + esc(AP().back) + '">' + I.back + '</button>' : '<span class="a-icb-sp"></span>') +
    '<h1 class="a-bar-t" tabindex="-1">' + esc(title) + '</h1>' + (opts.action || '<span class="a-icb-sp"></span>') + '</header>';
};
const bigTitle = (title, lead) => '<div class="a-big"><h1 tabindex="-1">' + esc(title) + '</h1>' + (lead ? '<p>' + esc(lead) + '</p>' : '') + '</div>';
const langSeg = () => '<div class="a-lang" role="group" aria-label="' + esc(AP().language) + '"><button type="button" data-alang="en" aria-pressed="' + (LANG === 'en') + '">EN</button><button type="button" data-alang="fr" aria-pressed="' + (LANG === 'fr') + '">FR</button></div>';
const brand = () => '<a class="a-brand" href="#home" aria-label="Djalumo Agro">' + LOGO + '<span>Agro</span></a>';
const curSelect = (id) => '<select class="a-cur" id="' + id + '" aria-label="' + esc(L().planner.currency) + '">' + PL_CUR.map(c => '<option value="' + c + '"' + (PLAN.currency === c ? ' selected' : '') + '>' + (c === 'XAF' ? 'FCFA' : c) + '</option>').join('') + '</select>';
const amountShort = (v) => { const c = PLAN.currency; try { return new Intl.NumberFormat(L().meta.locale, { notation: v >= 100000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(v) + ' ' + (c === 'XAF' ? 'FCFA' : c); } catch (e) { return nf(v) + ' ' + c; } };
const monogram = (k) => { const n = tl(KB.crops[k].name); return '<span class="a-mono g-' + cropGroup(KB.crops[k]) + '" aria-hidden="true">' + esc(n.slice(0, 2)) + '</span>'; };
const parseAmount = (v) => { const s = String(v).replace(/[^\d.,]/g, '').replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.'); return Math.max(0, Math.min(1e12, parseFloat(s) || 0)); };
function setCurrency(c) { const from = curRate(); PLAN.currency = c; const v = PLAN.capital / from * curRate(); PLAN.capital = v >= 1000 ? Math.round(v / 10) * 10 : Math.round(v); saveDraft(); }
function toast(msg, action) {
  const t = $('#a-toast'); if (!t) return;
  t.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button" data-toast-act>' + esc(action[0]) + '</button>' : '');
  t.hidden = false; t.classList.remove('out'); clearTimeout(AS.toastT);
  const b = $('[data-toast-act]', t); if (b) b.onclick = () => { action[1](); t.hidden = true; };
  AS.toastT = setTimeout(() => { t.classList.add('out'); setTimeout(() => { t.hidden = true; }, 260); }, 3200);
}
function planSummary(r) {
  const sc = r.scenarios.average, priced = !!r.priceSource;
  const status = !priced ? 'price' : sc.margin < 0 ? 'loss' : sc.roi < 0.15 ? 'thin' : 'good';
  return { status, areaHa: r.areaHa, margin: priced ? sc.margin : null, roi: priced ? sc.roi : null, capitalXaf: PLAN.mode === 'crop' ? r.requiredXaf : r.budget.total };
}
function planCard(p) {
  const P = L().planner, s = p.summary || {};
  return withCur(p.plan.currency, () => '<article class="a-plan"><button type="button" class="a-plan-main" data-openplan="' + esc(p.id) + '">' + monogram(p.plan.crop) +
    '<span class="a-plan-b"><b>' + esc(tl(KB.crops[p.plan.crop].name)) + '</b><small>' + esc(plArea(s.areaHa) + ' · ' + txtCur(s.capitalXaf || 0)) + '</small><small class="faint">' + esc(AP().savedOn(fmtDateS(new Date(p.savedAt)))) + '</small></span>' +
    '<span class="a-plan-v"><span class="a-st st-' + s.status + '">' + esc(P.status[s.status] || '') + '</span>' + (s.margin !== null && s.margin !== undefined ? '<b class="' + (s.margin >= 0 ? 'pos' : 'neg') + '">' + esc(txtCur(s.margin)) + '</b>' : '') + '</span></button>' +
    '<button type="button" class="a-icb a-plan-del" data-delplan="' + esc(p.id) + '" aria-label="' + esc(AP().delete) + '">' + I.trash + '</button></article>');
}

/* ---------- Screens ---------- */
const SCREENS = {
  home: {
    tab: true,
    html() {
      const A = AP(), plans = loadPlans().slice(0, 2), q = QUICK[PLAN.currency] || QUICK.USD;
      const roles = Object.keys(A.roles).map(k => '<button type="button" class="a-role" data-role="' + k + '" aria-pressed="' + (AS.role === k) + '"><span class="a-role-ic">' + ROLE_IC[k] + '</span><b>' + esc(A.roles[k][0]) + '</b><small>' + esc(A.roles[k][1]) + '</small></button>').join('');
      return '<header class="a-top">' + brand() + langSeg() + '</header>' +
        '<section class="a-hero"><div class="a-hero-in"><p class="a-hello">' + esc(A.hello(new Date().getHours())) + '</p><h1 tabindex="-1">' + esc(A.askH) + '</h1><p class="a-hero-d">' + esc(A.askD) + '</p>' +
        '<form class="a-ask" data-ask novalidate><div class="a-amt"><input id="a-amt" class="tnum" inputmode="decimal" autocomplete="off" enterkeyhint="go" aria-label="' + esc(L().planner.capital) + '" value="' + esc(nf(PLAN.capital)) + '">' + curSelect('a-cur-h') + '</div>' +
        '<div class="a-quick" role="group">' + q.map(v => '<button type="button" data-quick="' + v + '"' + (PLAN.capital === v ? ' aria-pressed="true"' : '') + '>' + esc(amountShort(v)) + '</button>').join('') + '</div>' +
        '<button type="submit" class="a-btn a-btn-light a-btn-block">' + esc(A.askCta) + I.arrow + '</button></form>' +
        '<p class="a-off"><i></i>' + esc(A.offlineChip) + '</p></div></section>' +
        '<section class="a-sec"><h2 class="a-h2">' + esc(A.roleH) + '</h2><div class="a-roles">' + roles + '</div>' + (AS.role ? '<p class="a-tip">' + esc(A.roleTip[AS.role]) + '</p>' : '') + '</section>' +
        '<section class="a-sec"><div class="a-sec-h"><h2 class="a-h2">' + esc(A.recentH) + '</h2>' + (plans.length ? '<a href="#plans" data-tab="plans">' + esc(A.seeAll) + '</a>' : '') + '</div>' +
        (plans.length ? '<div class="a-plans">' + plans.map(planCard).join('') + '</div>' : '<div class="a-empty"><b>' + esc(A.emptyH) + '</b><p>' + esc(A.emptyD) + '</p><a class="a-btn a-btn-ghost" href="#plan-1">' + esc(A.emptyCta) + I.arrow + '</a></div>') + '</section>' +
        '<section class="a-sec a-promos"><a class="a-promo a-promo-photo" href="#field" data-tab="field">' + img('founder-tomato', '') + '<span><b>' + esc(A.pilotH) + '</b><small>' + esc(A.pilotD) + '</small></span></a>' +
        '<a class="a-promo a-promo-map" href="#markets" data-tab="markets"><span class="a-promo-art" aria-hidden="true">' + I.markets + '</span><span><b>' + esc(A.marketsH) + '</b><small>' + esc(A.marketsD) + '</small></span></a></section>';
    },
    mount(root) {
      const amt = $('#a-amt', root);
      amt.addEventListener('input', () => { PLAN.capital = parseAmount(amt.value); $$('[data-quick]', root).forEach(b => b.removeAttribute('aria-pressed')); saveDraft(); });
      amt.addEventListener('change', () => { amt.value = nf(PLAN.capital); });
      $('#a-cur-h', root).addEventListener('change', e => { setCurrency(e.target.value); appRender(true); });
      $('[data-ask]', root).addEventListener('submit', e => { e.preventDefault(); amt.blur(); if (!(PLAN.capital > 0)) { amt.focus(); return; } PLAN.mode = 'budget'; saveDraft(); analytics.track('app_ask', { cur: PLAN.currency }); nav('plan-2'); });
      root.addEventListener('click', e => {
        const q = e.target.closest('[data-quick]'); if (q) { PLAN.capital = +q.dataset.quick; amt.value = nf(PLAN.capital); $$('[data-quick]', root).forEach(b => { if (b === q) b.setAttribute('aria-pressed', 'true'); else b.removeAttribute('aria-pressed'); }); saveDraft(); return; }
        const r = e.target.closest('[data-role]'); if (r) { AS.role = AS.role === r.dataset.role ? '' : r.dataset.role; store.set('dj.role', AS.role); analytics.track('app_role', { role: AS.role }); appRender(true); }
      });
    }
  },

  'plan-1': {
    flow: 1,
    html() {
      const A = AP(), q = QUICK[PLAN.currency] || QUICK.USD;
      return stepHead(1, A.s1H, A.s1D) +
        '<div class="a-card a-big-amt"><label for="a-amt1">' + esc(L().planner.capital) + '</label><input id="a-amt1" class="tnum" inputmode="decimal" autocomplete="off" value="' + esc(nf(PLAN.capital)) + '"><span class="a-unit">' + esc(curCode()) + '</span></div>' +
        '<div class="a-field"><span class="a-lbl">' + esc(L().planner.currency) + '</span><div class="a-chips" role="group">' + PL_CUR.map(c => '<button type="button" data-cur="' + c + '" aria-pressed="' + (PLAN.currency === c) + '">' + (c === 'XAF' ? 'FCFA' : c) + '</button>').join('') + '</div></div>' +
        '<div class="a-field"><div class="a-chips a-chips-q" role="group">' + q.map(v => '<button type="button" data-quick="' + v + '">' + esc(amountShort(v)) + '</button>').join('') + '</div><p class="a-hint">' + esc(L().planner.capitalHint) + '</p></div>';
    },
    foot() { return '<button type="button" class="a-btn a-btn-primary a-btn-block" data-go="plan-2">' + esc(AP().next) + I.arrow + '</button>'; },
    mount(root) {
      const amt = $('#a-amt1', root);
      amt.addEventListener('input', () => { PLAN.capital = parseAmount(amt.value); saveDraft(); });
      amt.addEventListener('change', () => { amt.value = nf(PLAN.capital); });
      root.addEventListener('click', e => {
        const c = e.target.closest('[data-cur]'); if (c) { setCurrency(c.dataset.cur); appRender(true); return; }
        const q = e.target.closest('[data-quick]'); if (q) { PLAN.capital = +q.dataset.quick; amt.value = nf(PLAN.capital); saveDraft(); }
      });
    }
  },

  'plan-2': {
    flow: 2,
    html() {
      const A = AP(), P = L().planner;
      PLAN.mode = 'budget';
      const prices = {}, products = {};
      Object.keys(KB.crops).forEach(k => { const v = PLAN.prices[priceKey(k)]; if (v) prices[k] = v; const pr = plProduct(k); if (pr) products[k] = pr; });
      let rows = [];
      try { rows = AFEngine.compare(KB, Object.assign({}, PLAN, { prices, products })); } catch (e) { return stepHead(2, A.s2H, '') + '<p class="notice">' + esc(P.engineError) + '</p>'; }
      const by = {}; rows.forEach(x => { (by[cropGroup(KB.crops[x.crop])] = by[cropGroup(KB.crops[x.crop])] || []).push(x); });
      const card = (x) => {
        const c = KB.crops[x.crop], unit = x.unit ? tl(x.unit) : 'kg', ok = x.areaHa > 0 && x.state !== 'below_min' && x.state !== 'upfront_exceeds';
        const lv = riskLvl(x.risk);
        return '<button type="button" class="a-crop' + (ok ? '' : ' off') + '" data-crop="' + x.crop + '" aria-pressed="' + (PLAN.crop === x.crop) + '">' +
          '<span class="a-crop-h">' + monogram(x.crop) + '<span class="a-crop-n"><b>' + esc(tl(c.name)) + '</b><small>' + esc(chipText(c)) + '</small></span><span class="a-radio" aria-hidden="true">' + I.check + '</span></span>' +
          (ok ? '<span class="a-crop-s"><span><small>' + esc(A.covers) + '</small><b>' + esc(plArea(x.areaHa)) + '</b></span>' +
            (x.marginPerMonth !== null ? '<span><small>' + esc(A.margin) + '</small><b class="' + (x.marginPerMonth >= 0 ? 'pos' : 'neg') + '">' + esc(txtCur(x.marginPerMonth)) + '</b></span>' : '<span><small>' + esc(A.breakEven) + '</small><b>' + (x.breakEvenPerUnit ? esc(fmtUnit(x.breakEvenPerUnit)) + '<em> / ' + esc(unit) + '</em>' : '·') + '</b></span>') +
            '<span><small>' + esc(A.risk) + '</small><b class="a-risk lv' + lv + '"><i></i>' + esc(P.riskLevel[lv]) + '</b></span></span>'
            : '<span class="a-crop-x">' + esc(A.offState[x.state] || A.offState.below_min) + '</span>') + '</button>';
      };
      const allOff = rows.every(x => !(x.areaHa > 0));
      const water = allOff ? '<div class="a-notice"><p>' + esc(A.allOff) + '</p><div class="a-chips" role="group">' + PL_WATER.map(w => '<button type="button" data-w2="' + w + '" aria-pressed="' + (PLAN.water === w) + '">' + esc(P.water[w][0]) + '</button>').join('') + '</div></div>' : '';
      return stepHead(2, A.s2H, A.s2D(txtCur(capXaf()))) + water + ['season', 'long', 'orchard'].filter(g => by[g]).map(g => '<h2 class="a-h3">' + esc(A.groups[g]) + '</h2><div class="a-crops">' + by[g].map(card).join('') + '</div>').join('');
    },
    foot() { return '<button type="button" class="a-btn a-btn-primary a-btn-block" data-go="plan-3">' + esc(AP().next) + I.arrow + '</button>'; },
    mount(root) {
      root.addEventListener('click', e => { const w = e.target.closest('[data-w2]'); if (w) { PLAN.water = w.dataset.w2; saveDraft(); appRender(true); return; } const c = e.target.closest('[data-crop]'); if (!c || c.classList.contains('off')) return; PLAN.crop = c.dataset.crop; saveDraft(); $$('[data-crop]', root).forEach(b => b.setAttribute('aria-pressed', String(b === c))); analytics.track('app_crop', { crop: PLAN.crop }); });
    }
  },

  'plan-3': {
    flow: 3,
    html() {
      const A = AP(), P = L().planner, S = PLAN;
      let r = null; try { r = AFEngine.plan(KB, plannerInput()); } catch (e) { r = null; }
      const water = PL_WATER.map(w => '<label class="a-opt"><input type="radio" name="awater" value="' + w + '"' + (S.water === w ? ' checked' : '') + '><span><b>' + esc(P.water[w][0]) + '</b><small>' + esc(P.water[w][1]) + '</small></span><i aria-hidden="true">' + I.check + '</i></label>').join('');
      const curM = new Date(S.start + 'T00:00:00Z').getUTCMonth();
      const months = r && r.windows ? '<div class="a-months" role="group" aria-label="' + esc(A.monthH) + '">' + r.windows.map(w => '<button type="button" data-month="' + w.month + '" class="lv' + Math.min(2, Math.floor(w.risk.score / 2)) + '" aria-pressed="' + (w.month === curM) + '"><span>' + esc(monthName(w.month, 'short')) + '</span>' + (w.month === r.bestMonth ? '<em>' + I.star + '</em>' : '') + '</button>').join('') + '</div>' : '';
      const ps = plProducts(S.crop), pi = prodInfo(S.crop);
      const prods = ps && Object.keys(ps).length > 1 ? '<div class="a-field"><span class="a-lbl">' + esc(P.product) + '</span><div class="a-chips" role="group">' + Object.keys(ps).map(k => '<button type="button" data-prod="' + k + '" aria-pressed="' + (pi.key === k) + '">' + esc(tl(ps[k].label)) + '</button>').join('') + '</div></div>' : '';
      const hopts = KB.crops[S.crop].horizon_options || [], hcur = plHorizon(S.crop), ratoon = KB.crops[S.crop].profile === 'ratoon';
      const hsel = hopts.length > 1 ? '<div class="a-field"><span class="a-lbl">' + esc(P.horizonL) + '</span><div class="a-chips" role="group">' + hopts.map((o, i) => '<button type="button" data-hor="' + o.months + '" aria-pressed="' + (o.months === hcur) + '">' + esc(ratoon ? P.horizonCycles(i + 1, o.months) : P.horizonYears(o.months / 12)) + '</button>').join('') + '</div></div>' : '';
      const ref = KB.crops[S.crop].price.reference_xaf_kg;
      return stepHead(3, A.s3H, A.s3D) +
        '<div class="a-selcrop">' + monogram(S.crop) + '<span><b>' + esc(tl(KB.crops[S.crop].name)) + '</b><small>' + esc(txtCur(capXaf())) + '</small></span><button type="button" class="a-lnk" data-go="plan-2">' + esc(A.edit) + '</button></div>' +
        prods + hsel +
        '<div class="a-field"><span class="a-lbl">' + esc(A.waterH) + '</span><div class="a-opts">' + water + '</div></div>' +
        '<div class="a-field"><span class="a-lbl">' + esc(A.monthH) + '</span>' + months + '<p class="a-hint">' + esc(A.monthD) + '</p></div>' +
        '<div class="a-field"><label class="a-lbl" for="a-price">' + esc(priceLabel(S.crop)) + '</label><input class="a-inp tnum" id="a-price" inputmode="decimal" autocomplete="off" placeholder="' + esc(ref ? priceShown(ref) : P.pricePh) + '" value="' + esc(priceShown(plPrice())) + '"><p class="a-hint">' + esc(priceHint(S.crop)) + '</p></div>';
    },
    foot() { return '<button type="button" class="a-btn a-btn-primary a-btn-block" data-go="result">' + esc(AP().see) + I.arrow + '</button>'; },
    mount(root) {
      root.addEventListener('change', e => { if (e.target.name === 'awater') { PLAN.water = e.target.value; saveDraft(); appRender(true); } });
      const price = $('#a-price', root);
      price.addEventListener('input', () => { const v = parseAmount(price.value); PLAN.prices[priceKey(PLAN.crop)] = v > 0 ? v / curRate() : null; saveDraft(); });
      price.addEventListener('change', () => { price.value = priceShown(plPrice()); });
      root.addEventListener('click', e => {
        const m = e.target.closest('[data-month]');
        if (m) { const mm = +m.dataset.month, now = new Date(), y = now.getUTCFullYear() + (mm < now.getUTCMonth() ? 1 : 0); PLAN.start = new Date(Date.UTC(y, mm, 1)).toISOString().slice(0, 10); saveDraft(); $$('[data-month]', root).forEach(b => b.setAttribute('aria-pressed', String(b === m))); return; }
        const p = e.target.closest('[data-prod]'); if (p) { PLAN.products[PLAN.crop] = p.dataset.prod; saveDraft(); appRender(true); return; }
        const h = e.target.closest('[data-hor]'); if (h) { PLAN.horizons[PLAN.crop] = +h.dataset.hor; saveDraft(); appRender(true); }
      });
    }
  },

  result: {
    html() {
      const A = AP(), P = L().planner;
      let r;
      try { r = AFEngine.plan(KB, plannerInput()); } catch (e) { return topBar(A.resultH) + '<div class="a-pad"><p class="notice">' + esc(P.engineError) + '</p></div>'; }
      PLAN.last = r;
      const tabs = ['return', 'budget', 'cashflow', 'itinerary', 'shopping', 'water', 'compare', 'sources'];
      if (!tabs.includes(PLAN.tab)) PLAN.tab = 'return';
      if (r.state === 'below_min' || r.state === 'upfront_exceeds') return topBar(A.resultH, { action: editBtn() }) + '<div class="a-pad a-result">' + plannerOutHTML(r, false) + '</div>';
      const bar = '<div class="a-seg-scroll" role="tablist" aria-label="' + esc(P.title) + '">' + tabs.map(t => '<button type="button" role="tab" aria-selected="' + (PLAN.tab === t) + '" data-ptab="' + t + '">' + esc(P.tabs[t]) + '</button>').join('') + '</div>';
      const panel = { return: tabReturn, budget: tabBudget, cashflow: tabCashflow, itinerary: tabItinerary, shopping: tabShopping, water: tabWater, compare: tabCompare, sources: tabSources }[PLAN.tab](r);
      return topBar(A.resultH, { action: editBtn() }) + '<div class="a-pad a-result">' + verdictHTML(r) + kpiHTML(r) + unpricedNote(r) + bar + '<div class="ptab a-ptab" role="tabpanel">' + panel + '</div></div>';
    },
    foot() {
      const A = AP(), saved = AS.savedId && loadPlans().some(p => p.id === AS.savedId);
      return '<button type="button" class="a-btn a-btn-ghost" data-saveplan' + (saved ? ' disabled' : '') + '>' + (saved ? I.saved + esc(A.saved) : I.save + esc(A.save)) + '</button>' +
        (CFG.siteUrl ? '<button type="button" class="a-btn a-btn-primary" data-preport>' + I.pdf + esc(A.report) + '</button>' : '');
    },
    mount(root) {
      $$('[data-ptips]', root).forEach(b => bindTips(b));
      root.addEventListener('click', e => {
        const tb = e.target.closest('[data-ptab]');
        if (tb) { PLAN.tab = tb.dataset.ptab; analytics.track('planner_tab', { tab: PLAN.tab }); const y = window.scrollY; appRender(true); window.scrollTo(0, y); const nb = $('[data-ptab="' + PLAN.tab + '"]'); if (nb && nb.scrollIntoView) nb.scrollIntoView({ block: 'nearest', inline: 'center' }); return; }
        const go = e.target.closest('[data-pgo]'); if (go) { PLAN.crop = go.dataset.pgo; PLAN.tab = 'return'; AS.savedId = null; saveDraft(); appRender(false); return; }
        const wn = e.target.closest('[data-pwin]'); if (wn) { const mm = +wn.dataset.pwin, now = new Date(), y = now.getUTCFullYear() + (mm < now.getUTCMonth() ? 1 : 0); PLAN.start = new Date(Date.UTC(y, mm, 1)).toISOString().slice(0, 10); AS.savedId = null; saveDraft(); const sy = window.scrollY; appRender(true); window.scrollTo(0, sy); }
      });
    }
  },

  plans: {
    tab: true,
    html() {
      const A = AP(), plans = loadPlans();
      return '<header class="a-top">' + brand() + '</header>' + bigTitle(A.plansH, A.plansD) + '<div class="a-pad">' +
        (plans.length ? '<div class="a-plans">' + plans.map(planCard).join('') + '</div>' : '<div class="a-empty"><b>' + esc(A.emptyH) + '</b><p>' + esc(A.emptyD) + '</p><a class="a-btn a-btn-primary" href="#plan-1">' + esc(A.emptyCta) + I.arrow + '</a></div>') + '</div>';
    }
  },

  markets: {
    tab: true,
    html() { const A = AP(); return '<header class="a-top">' + brand() + '</header>' + bigTitle(A.marketsTitle, A.marketsLead) + '<div class="a-markets">' + worldHeroHTML() + '</div>'; },
    mount(root) { AS.cleanups.push(worldMount(root)); }
  },

  field: {
    tab: true,
    html() { return '<header class="a-top">' + brand() + '</header><div class="a-fieldpage">' + fieldPageHTML() + '</div>'; },
    mount(root) { AS.cleanups.push(fieldPageMount(root)); }
  },

  more: {
    tab: true,
    html() {
      const A = AP(), Lk = A.links;
      const row = (k, href, ext) => '<a class="a-row" href="' + href + '"' + (ext ? ' data-ext' : '') + '><span><b>' + esc(Lk[k][0]) + '</b><small>' + esc(Lk[k][1]) + '</small></span>' + (ext ? I.ext : I.chev) + '</a>';
      const group = (t, rows) => '<h2 class="a-h3">' + esc(t) + '</h2><div class="a-list">' + rows.join('') + '</div>';
      return '<header class="a-top">' + brand() + '</header>' + bigTitle(A.moreTitle) + '<div class="a-pad">' +
        '<div class="a-list"><div class="a-row a-row-static"><span><b>' + esc(A.language) + '</b><small>' + (LANG === 'fr' ? 'Français' : 'English') + '</small></span>' + langSeg() + '</div></div>' +
        group(A.sections.project, [row('about', '#m-about'), row('platform', '#m-platform'), row('impact', '#m-impact')]) +
        group(A.sections.contact, [row('contact', '#m-contact'), row('demo', '#m-demo'), row('newsletter', '#m-newsletter')]) +
        group(A.sections.legal, [row('privacy', '#m-privacy'), row('terms', '#m-terms')].concat(CFG.siteUrl ? [row('site', SITE_LINK('home'), true)] : [])) +
        '<div class="a-colophon"><div class="a-colo-logo">' + LOGO + '<span>Agro</span></div><p>' + esc(A.tagline) + '</p><p class="faint">' + esc(A.version(CFG.appVersion || '1.0.0')) + '</p><p class="faint">' + esc(A.offline) + '</p></div></div>';
    }
  }
};
const editBtn = () => '<button type="button" class="a-icb" data-go="plan-3" aria-label="' + esc(AP().edit) + '">' + I.edit + '</button>';
function stepHead(i, h, d) {
  const A = AP();
  return topBar(A.stepOf(i, 3)) + '<div class="a-steps" aria-hidden="true">' + [1, 2, 3].map(n => '<i class="' + (n <= i ? 'on' : '') + '"></i>').join('') + '</div>' +
    '<div class="a-pad a-step">' + '<div class="a-step-h"><h2>' + esc(h) + '</h2>' + (d ? '<p>' + esc(d) + '</p>' : '') + '</div>';
}
/* sub pages under More reuse the website pages */
function subScreen(k) {
  const P = PAGES[k];
  return {
    html() { return topBar((AP().links[k] || [L().meta.pages[k] || ''])[0], { solid: true }) + '<div class="a-sub" data-page="' + k + '">' + P.html() + '</div>'; },
    mount(root) { if (P.mount) P.mount(root); $$('form.nlf', root).forEach(f => bindForm(f, { compact: true })); }
  };
}

/* ---------- Rendering ---------- */
function screenOf(r) {
  if (SCREENS[r]) return SCREENS[r];
  if (r.indexOf('m-') === 0 && PAGES[r.slice(2)]) return subScreen(r.slice(2));
  return SCREENS.home;
}
function appRender(restoreScroll) {
  AS.cleanups.forEach(f => { try { f && f(); } catch (e) { /* cleanup */ } }); AS.cleanups = [];
  const r = cur(), S = screenOf(r), tab = TAB_OF(r);
  Router.current = r;
  const main = D.getElementById('main');
  const foot = S.foot ? S.foot() : '';
  main.innerHTML = '<div class="a-screen' + (S.tab ? ' is-tab' : '') + (S.flow ? ' is-flow' : '') + (foot ? ' has-foot' : '') + '" data-screen="' + esc(r) + '">' + S.html() + '</div>';
  const root = main.firstChild;
  if (S.mount) S.mount(root);
  const bottom = D.getElementById('chrome-bottom');
  bottom.innerHTML = (foot ? '<div class="a-foot">' + foot + '</div>' : '') +
    (S.tab ? '<nav class="a-tabs" aria-label="Djalumo Agro">' + ['home', 'plans', 'markets', 'field', 'more'].map(t => '<a href="#' + t + '" data-tab="' + t + '"' + (t === tab ? ' aria-current="page"' : '') + '>' + I[t] + '<span>' + esc(AP().tabs[t]) + '</span></a>').join('') + '</nav>' : '') +
    '<div id="a-toast" class="a-toast" role="status" hidden></div>';
  D.title = 'Djalumo Agro';
  window.scrollTo(0, restoreScroll ? (AS.scroll[r] || 0) : 0);
  const h = $('h1', root); if (h && !restoreScroll) h.focus({ preventScroll: true });
  analytics.track('page_view', { page: r });
}
function appSetLang(l) { if (l === LANG) return; LANG = l; store.set('af.lang', l); D.documentElement.lang = l; appRender(true); }
function savePlan() {
  const r = PLAN.last || AFEngine.plan(KB, plannerInput());
  const plans = loadPlans(), id = 'p' + Date.now().toString(36);
  plans.unshift({ id, savedAt: new Date().toISOString(), plan: snapPlan(), summary: planSummary(r) });
  writePlans(plans); AS.savedId = id; analytics.track('app_save', { crop: PLAN.crop });
  appRender(true); toast(AP().savedToast);
}
function deletePlan(id) {
  const plans = loadPlans(), i = plans.findIndex(p => p.id === id); if (i < 0) return;
  const [gone] = plans.splice(i, 1); writePlans(plans); appRender(true);
  toast(AP().deleted, [AP().undo, () => { const a = loadPlans(); a.splice(i, 0, gone); writePlans(a); appRender(true); }]);
}

function appBack() {
  const dlg = D.querySelector('dialog[open]'); if (dlg) { try { dlg.close(); } catch (e) { /* closed */ } dlg.remove(); return true; }
  const lb = D.querySelector('.lb [data-lb-x]'); if (lb) { lb.click(); return true; }
  return back();
}
function appBoot() {
  D.documentElement.classList.add('js', 'app');
  D.getElementById('chrome-top').innerHTML = '';
  try { const d = JSON.parse(store.get('dj.draft') || 'null'); if (d) usePlan(d); } catch (e) { /* no draft */ }
  const today = new Date().toISOString().slice(0, 10); if (!PLAN.start || PLAN.start < today.slice(0, 8) + '01') PLAN.start = nextMonthStart();
  if (!KB.crops[PLAN.crop]) PLAN.crop = 'tomato';
  if (!PL_CUR.includes(PLAN.currency)) PLAN.currency = 'USD';
  if (location.hash) history.replaceState(null, '', location.pathname);
  D.addEventListener('click', e => {
    const lg = e.target.closest('[data-alang]'); if (lg) { appSetLang(lg.dataset.alang); return; }
    if (e.target.closest('[data-back]')) { if (!back()) nav('home', 'tab'); return; }
    const sv = e.target.closest('[data-saveplan]'); if (sv) { if (!sv.disabled) savePlan(); return; }
    const rp = e.target.closest('[data-preport]'); if (rp && typeof openReportDialog === 'function') { openReportDialog(plannerInput(), PLAN.last); return; }
    const op = e.target.closest('[data-openplan]'); if (op) { const p = loadPlans().find(x => x.id === op.dataset.openplan); if (p) { usePlan(p.plan); AS.savedId = p.id; PLAN.tab = AS.role === 'investor' ? 'cashflow' : 'return'; saveDraft(); nav('result'); } return; }
    const dl = e.target.closest('[data-delplan]'); if (dl) { deletePlan(dl.dataset.delplan); return; }
    const go = e.target.closest('[data-go]'); if (go) { const t = go.dataset.go; if (t === 'result') { AS.savedId = null; PLAN.tab = AS.role === 'investor' ? 'cashflow' : 'return'; } const i = AS.stack.indexOf(t); if (i >= 0) { AS.stack = AS.stack.slice(0, i + 1); appRender(true); } else nav(t); return; }
    const tb = e.target.closest('[data-tab]'); if (tb) { e.preventDefault(); if (TAB_OF(cur()) === tb.dataset.tab && AS.stack.length <= 2 && cur() === tb.dataset.tab) window.scrollTo({ top: 0, behavior: 'smooth' }); else nav(tb.dataset.tab, 'tab'); return; }
    const xa = e.target.closest('a[href^="http"]'); if (xa) { e.preventDefault(); openExternal(xa.href); return; }
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      const h = a.getAttribute('href'); if (h.indexOf('#plate-') === 0) return;
      e.preventDefault();
      const r = routeFromHref(h); if (r) nav(r === 'home' ? 'home' : r, r === 'home' ? 'tab' : undefined);
    }
  });
  const C = window.Capacitor, Ap = C && C.Plugins && C.Plugins.App;
  if (Ap && typeof Ap.addListener === 'function') Ap.addListener('backButton', () => { if (!appBack()) Ap.exitApp(); });
  appRender(false);
}
appBoot();
