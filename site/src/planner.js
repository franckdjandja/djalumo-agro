/* ---------- Season Planner v3 (interface). Calculations live in engine.cjs, data in data/kb.json ----------
   Short cycles, long cycles, successive cycles and orchards share one form; the output adds the cash flow
   and the crop comparison. */
const tl = (x) => (x && typeof x === 'object' && !Array.isArray(x)) ? (x[LANG] || x.en || '') : (x == null ? '' : String(x));
const PL_CUR = ['USD', 'XAF', 'EUR', 'RWF', 'KES', 'NGN'];
const PL_WATER = ['rainfed', 'manual', 'existing', 'pump', 'drip'];
const nextMonthStart = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10); };
const PLAN = { capital: 5000, currency: 'USD', mode: 'budget', area: 0.25, crop: 'tomato', water: 'pump', start: nextMonthStart(), land: 'rent', market: 'local', familyLabour: 0, ownTools: false, tab: 'return', prices: {}, products: {} };
const isLong = (k) => { const c = KB.crops[k]; return !!(c.profile && c.profile !== 'season'); };
const cropGroup = (c) => !c.profile || c.profile === 'season' ? 'season' : c.profile === 'orchard' ? 'orchard' : 'long';
const cropMonths = (c) => !c.profile || c.profile === 'season' ? Math.round(((c.cycle.nursery_days || 0) + c.cycle.to_first_harvest_days + c.cycle.harvest_days) / 30.4) : c.horizon_months;
const durLabel = (m) => { const D = L().planner.dur; return m >= 24 && m % 12 === 0 ? D.years(m / 12) : D.months(m); };
const plProducts = (k) => KB.crops[k].products || null;
const plProduct = (k) => { const ps = plProducts(k); if (!ps) return null; return ps[PLAN.products[k]] ? PLAN.products[k] : Object.keys(ps)[0]; };
const prodInfo = (k) => { const ps = plProducts(k), key = plProduct(k), p = ps ? ps[key] : null; return { key, label: p ? p.label : null, unit: p && p.unit_label ? tl(p.unit_label) : 'kg', unitKg: (p && p.unit_kg) || 1, ratio: p ? p.ratio || 1 : 1, price: p && p.price ? p.price : null }; };
const priceKey = (k) => { const key = plProduct(k); return key && key !== Object.keys(plProducts(k))[0] ? k + ':' + key : k; };
const plPrice = () => PLAN.prices[priceKey(PLAN.crop)] || null;
const priceHint = (k) => { const c = KB.crops[k], pi = prodInfo(k), obs = pi.price && pi.price.observed ? pi.price.observed : c.price.observed; return tl(c.price.note) + (obs ? ' ' + tl(obs) : '') + (c.price.reference_xaf_kg ? ' ' + L().planner.priceOptional : ''); };
const priceLabel = (k) => { const pi = prodInfo(k); return pi.unit === 'kg' && !isLong(k) ? L().planner.price : L().planner.priceUnit(pi.unit); };
const groupSpan = (keys) => { const D = L().planner.dur, ms = keys.map(k => cropMonths(KB.crops[k])), a = Math.min(...ms), b = Math.max(...ms); if (a === b) return durLabel(a); return b < 24 ? D.monthsRange(a, b) : D.range(durLabel(a), durLabel(b)); };
const riskLvl = (score) => score <= 1 ? 0 : score <= 3 ? 1 : 2;

const fmtXaf = (v) => money(Math.round(v), 'XAF');
const fmtCur = (xaf) => { const c = PLAN.currency; if (c === 'XAF') return fmtXaf(xaf); return money(xaf / KB.fx.XAF * KB.fx[c], c); };
const txtCur = (xaf) => fmtCur(xaf).replace(/<[^>]+>/g, '');
const fmtBoth = (xaf) => PLAN.currency === 'XAF' ? fmtXaf(xaf) : fmtCur(xaf) + ' <span class="faint">· ' + fmtXaf(xaf) + '</span>';
const plArea = (ha) => { if (!(ha > 0)) return '0 m²'; if (ha < 0.1) return nf(ha * 10000, 0) + ' m²'; return nf(ha, ha < 10 ? 2 : 1) + ' ha'; };
const fmtDateS = (d) => new Intl.DateTimeFormat(L().meta.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
const fmtQty = (q, unit) => { const u = tl((KB.units || {})[unit]) || unit; if (unit === 'unit' || unit === 'stake') return nf(Math.round(q), 0) + ' ' + u; return (q >= 100 ? nf(q, 0) : q >= 10 ? nf(q, 1) : nf(q, 2)) + ' ' + u; };
const pct = (v) => (v >= 0 ? '+' : '') + nf(v * 100, 0) + '%';
const LV = () => L().planner.levels;

function plannerFormHTML(compact) {
  return '<form class="sim-in planner-in" data-planner novalidate onsubmit="return false">' + plannerFormInner(compact) + '</form>';
}

function plannerFormInner(compact) {
  const P = L().planner, S = PLAN;
  const cur = PL_CUR.map(c => '<option' + (S.currency === c ? ' selected' : '') + '>' + c + '</option>').join('');
  const groups = {};
  Object.keys(KB.crops).forEach(k => { const g = cropGroup(KB.crops[k]); (groups[g] = groups[g] || []).push(k); });
  const crops = '<div class="cgroups">' + ['season', 'long', 'orchard'].filter(g => groups[g]).map(g => '<div class="cg"><div class="cg-h"><b>' + esc(P.groups[g][0]) + '</b><span>' + esc(groupSpan(groups[g]) || P.groups[g][1]) + '</span></div><div class="crops" role="group" aria-label="' + esc(P.groups[g][0]) + '">' +
    groups[g].map(k => '<button type="button" data-pcrop="' + k + '" aria-pressed="' + (S.crop === k) + '">' + esc(tl(KB.crops[k].name)) + '<span class="cd">' + esc(durLabel(cropMonths(KB.crops[k]))) + '</span></button>').join('') + '</div></div>').join('') + '</div>';
  const ps = plProducts(S.crop), pi = prodInfo(S.crop);
  const prods = ps && Object.keys(ps).length > 1 ? '<div class="f"><span class="lbl" id="pl-prod-l">' + esc(P.product) + '</span><div class="seg seg' + Math.min(4, Object.keys(ps).length) + '" role="group" aria-labelledby="pl-prod-l">' +
    Object.keys(ps).map(k => '<button type="button" data-pprod="' + k + '" aria-pressed="' + (pi.key === k) + '">' + esc(tl(ps[k].label)) + '</button>').join('') + '</div>' + (pi.ratio < 1 ? '<span class="hint">' + esc(P.productRatio(nf(pi.ratio, 2))) + '</span>' : '') + '</div>' : '';
  const ref = KB.crops[S.crop].price.reference_xaf_kg;
  const water = PL_WATER.map(w => '<label class="wopt"><input type="radio" name="pwater" value="' + w + '"' + (S.water === w ? ' checked' : '') + '><span><b>' + esc(P.water[w][0]) + '</b><small>' + esc(P.water[w][1]) + '</small></span></label>').join('');
  return '<div class="blk-t"><h4>' + esc(P.inputsT) + '</h4><span class="badge plan">' + esc(P.badge) + '</span></div>' +
    '<div class="row2"><div class="f"><label for="pl-cap">' + esc(P.capital) + '</label><input class="inp tnum" id="pl-cap" inputmode="decimal" autocomplete="off" value="' + esc(nf(S.capital)) + '"><span class="hint">' + esc(P.capitalHint) + '</span></div>' +
    '<div class="f"><label for="pl-cur">' + esc(P.currency) + '</label><select class="inp" id="pl-cur">' + cur + '</select></div></div>' +
    '<div class="f"><span class="lbl" id="pl-mode-l">' + esc(P.approach) + '</span><div class="seg" role="group" aria-labelledby="pl-mode-l"><button type="button" data-pmode="budget" aria-pressed="' + (S.mode === 'budget') + '">' + esc(P.budgetFirst) + '</button><button type="button" data-pmode="crop" aria-pressed="' + (S.mode === 'crop') + '">' + esc(P.areaFirst) + '</button></div></div>' +
    '<div class="f" data-parea' + (S.mode === 'crop' ? '' : ' hidden') + '><label for="pl-area">' + esc(P.area) + '</label><input class="inp tnum" id="pl-area" type="number" min="0.001" step="0.01" inputmode="decimal" value="' + S.area + '"></div>' +
    '<div class="f"><span class="lbl" id="pl-crop-l">' + esc(P.crop) + '</span>' + crops + '</div>' + prods +
    '<div class="f"><label for="pl-price">' + esc(priceLabel(S.crop)) + '</label><input class="inp tnum" id="pl-price" inputmode="decimal" autocomplete="off" placeholder="' + esc(ref ? nf(ref) : P.pricePh) + '" value="' + esc(plPrice() ? nf(plPrice()) : '') + '"><span class="hint" data-phint>' + esc(priceHint(S.crop)) + '</span></div>' +
    '<fieldset class="f" style="border:0;padding:0;margin:0"><legend class="lbl" style="font-size:13px;color:var(--fg-2);font-weight:500;margin-bottom:7px">' + esc(P.waterT) + '</legend><div class="wopts">' + water + '</div></fieldset>' +
    '<div class="f"><label for="pl-start">' + esc(isLong(S.crop) ? P.choosePlant : P.start) + '</label><input class="inp" id="pl-start" type="date" value="' + S.start + '"><span class="hint">' + esc(isLong(S.crop) ? P.choosePlantHint : P.startHint) + '</span></div>' +
    (compact ? '' :
    '<details class="adv"' + (S.advOpen ? ' open' : '') + '><summary>' + esc(P.advanced) + '</summary><div class="stack" style="--s:14px;margin-top:14px">' +
    '<div class="f"><label for="pl-land">' + esc(P.land) + '</label><select class="inp" id="pl-land"><option value="rent"' + (S.land === 'rent' ? ' selected' : '') + '>' + esc(P.landRent) + '</option><option value="own"' + (S.land === 'own' ? ' selected' : '') + '>' + esc(P.landOwn) + '</option></select></div>' +
    '<div class="f"><label for="pl-fam">' + esc(P.family) + '</label><select class="inp" id="pl-fam">' + [0, 0.25, 0.5, 0.75].map(v => '<option value="' + v + '"' + (S.familyLabour === v ? ' selected' : '') + '>' + (v * 100) + '%</option>').join('') + '</select><span class="hint">' + esc(P.familyHint) + '</span></div>' +
    '<label class="chk"><input type="checkbox" id="pl-tools"' + (S.ownTools ? ' checked' : '') + '> ' + esc(P.ownTools) + '</label></div></details>');
}

function plannerOutHTML(r, compact) {
  const P = L().planner, crop = KB.crops[PLAN.crop], long = r.profile && r.profile !== 'season';
  const pi = prodInfo(PLAN.crop), unit = pi.unit;
  const priced = !!r.priceSource;
  const be = long ? r.breakEven.pricePerUnit : r.breakEven.priceXafKg;
  const msg = (k) => P.states[k] ? P.states[k](fmtCur(r.minXaf), plArea(r.water.maxAreaHa || 0), be ? nf(be, 0) : '·') : '';
  let state = r.state !== 'ok' && r.state !== 'needs_price' ? '<p class="notice" style="border-left-color:var(--warn)">' + esc(msg(r.state)) + '</p>' : '';
  if (r.state === 'manual_limit' && PLAN.mode === 'budget' && r.capitalXaf > r.budget.total) state += '<p class="small muted">' + esc(P.unusedCapital(fmtCur(r.capitalXaf - r.budget.total).replace(/<[^>]+>/g, ''))) + '</p>';
  if (!priced) state += '<p class="notice info">' + esc(long || unit !== 'kg' ? P.needsPriceU(be ? nf(be, 0) : '·', unit) : msg('needs_price')) + '</p>';
  if (r.state === 'below_min' || r.state === 'upfront_exceeds') {
    if (r.state === 'below_min') return state;
    const up = r.budget.lines.filter(l => l.upfront);
    return state + '<div class="tbl-wrap" style="margin-top:12px"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.item) + '</th><th>' + esc(P.th.cost) + '</th></tr></thead><tbody>' + up.map(l => '<tr><td>' + esc(tl(l.label)) + '</td><td class="tnum">' + fmtCur(l.total) + '</td></tr>').join('') + '</tbody></table></div><p class="small muted" style="margin-top:10px">' + esc(P.upfrontHint) + '</p>';
  }
  const sc = r.scenarios, area = r.areaHa;
  const dur = durLabel(r.horizonMonths);
  const pb = r.cashflow.paybackIndex;
  const kpis = long ? '<div class="kpis kpis4">' +
    '<div><div class="k">' + esc(P.kArea) + '</div><div class="v">' + plArea(area) + '</div><div class="s">' + esc(P.trees(nf(r.plants))) + '</div></div>' +
    '<div><div class="k">' + esc(PLAN.mode === 'crop' ? P.kRequired : P.kNeed) + '</div><div class="v vsm">' + fmtCur(PLAN.mode === 'crop' ? r.requiredXaf : r.budget.total) + '</div><div class="s">' + esc(P.kNeedSub) + '</div></div>' +
    (priced ? '<div><div class="k">' + esc(P.kMarginH(dur)) + '</div><div class="v vsm" style="color:' + (sc.average.margin >= 0 ? 'var(--green)' : 'var(--crit)') + '">' + fmtCur(sc.average.margin) + '</div><div class="s">' + P.perYear(fmtCur(sc.average.marginPerYear)) + '</div></div>'
      : '<div><div class="k">' + esc(P.kBreakEvenU(unit)) + '</div><div class="v vsm">' + (be ? nf(be, 0) + '<small> FCFA</small>' : '·') + '</div><div class="s">' + esc(P.atAvgYield) + '</div></div>') +
    '<div><div class="k">' + esc(P.kHorizon) + '</div><div class="v vsm">' + esc(dur) + '</div><div class="s">' + esc(priced ? (pb !== null ? P.payback(pb + 1) : P.noPayback) : fmtDateS(r.calendar.start) + ' → ' + fmtDateS(r.calendar.horizonEnd)) + '</div></div></div>'
    : '<div class="kpis kpis4">' +
    '<div><div class="k">' + esc(P.kArea) + '</div><div class="v">' + plArea(area) + '</div><div class="s">' + esc(P.plants(nf(r.plants))) + '</div></div>' +
    '<div><div class="k">' + esc(PLAN.mode === 'crop' ? P.kRequired : P.kBudget) + '</div><div class="v vsm">' + fmtCur(PLAN.mode === 'crop' ? r.requiredXaf : r.budget.total) + '</div><div class="s">' + esc(P.inclReserve) + '</div></div>' +
    (priced ? '<div><div class="k">' + esc(P.kMargin) + '</div><div class="v vsm" style="color:' + (sc.average.margin >= 0 ? 'var(--green)' : 'var(--crit)') + '">' + fmtCur(sc.average.margin) + '</div><div class="s">' + esc(P.roiAvg(pct(sc.average.roi))) + '</div></div>'
      : '<div><div class="k">' + esc(P.kBreakEven) + '</div><div class="v vsm">' + (be ? nf(be, 0) + '<small> FCFA/kg</small>' : '·') + '</div><div class="s">' + esc(P.atAvgYield) + '</div></div>') +
    '<div><div class="k">' + esc(P.kSeason) + '</div><div class="v vsm">' + Math.round(r.calendar.totalDays / 7) + '<small>' + esc(L().sim.weeks) + '</small></div><div class="s">' + esc(fmtDateS(r.calendar.start) + ' → ' + fmtDateS(r.calendar.lastHarvest)) + '</div></div></div>';
  if (compact) {
    return state + kpis + (priced ? scenarioCards(r, true) : '') + unpricedNote(r) + '<p class="small muted" style="margin-top:12px">' + esc(P.compactNote) + '</p><div><a class="btn btn-primary" href="#planner" data-cta="home_planner">' + esc(P.openFull) + ARROW + '</a></div>';
  }
  const tabs = ['return', 'budget', 'cashflow', 'itinerary', 'shopping', 'water', 'compare', 'sources'];
  if (!tabs.includes(PLAN.tab)) PLAN.tab = 'return';
  const tabBar = '<div class="tabs" role="tablist" aria-label="' + esc(P.title) + '">' + tabs.map(t => '<button type="button" role="tab" id="pt-' + t + '" aria-selected="' + (PLAN.tab === t) + '" aria-controls="pt-panel" tabindex="' + (PLAN.tab === t ? 0 : -1) + '" data-ptab="' + t + '">' + esc(P.tabs[t]) + '</button>').join('') + '</div>';
  const panel = { return: tabReturn, budget: tabBudget, cashflow: tabCashflow, itinerary: tabItinerary, shopping: tabShopping, water: tabWater, compare: tabCompare, sources: tabSources }[PLAN.tab](r);
  return state + kpis + reportCta() + tabBar + '<div id="pt-panel" role="tabpanel" aria-labelledby="pt-' + PLAN.tab + '" class="ptab">' + panel + '</div>';
}

function reportCta() {
  const R = L().planner.report;
  if (!R || !(window.AF_CONFIG && window.AF_CONFIG.reports)) return '';
  return '<div class="rep-cta"><div><b>' + esc(R.cta) + '</b><p class="small muted">' + esc(R.ctaSub) + '</p></div><button type="button" class="btn btn-primary btn-sm" data-preport>' + esc(R.cta) + ARROW + '</button></div>';
}

function scenarioCards(r, compact) {
  const P = L().planner, sc = r.scenarios, long = r.profile && r.profile !== 'season';
  const pi = prodInfo(PLAN.crop);
  const cls = { good: 'ok', average: 'mid', poor: 'warn', failure: 'bad' };
  return '<div class="scen' + (compact ? ' compact' : '') + '">' + ['good', 'average', 'poor', 'failure'].map(k => {
    const s = sc[k];
    const body = long
      ? '<dl><dt>' + esc(r.profile === 'orchard' ? P.yieldYear : P.yieldCycle) + '</dt><dd>' + nf(s.yieldTHa, 1) + ' t/ha</dd><dt>' + esc(P.priceU(pi.unit)) + '</dt><dd>' + nf(s.price * pi.unitKg, 0) + ' FCFA</dd><dt>' + esc(P.soldU) + '</dt><dd>' + (pi.unit === 'kg' ? fmtQty(s.soldKg, 'kg') : nf(s.soldKg / pi.unitKg, 0) + ' ' + esc(pi.unit)) + '</dd><dt>' + esc(P.revenueL) + '</dt><dd>' + fmtCur(s.revenue) + '</dd><dt>' + esc(P.costsPlan) + '</dt><dd>' + fmtCur(s.costs) + '</dd><dt>' + esc(P.marginYear) + '</dt><dd>' + fmtCur(s.marginPerYear) + '</dd></dl>'
      : '<dl><dt>' + esc(P.yieldL) + '</dt><dd>' + nf(s.yieldTHa, 1) + ' t/ha</dd><dt>' + esc(P.priceL) + '</dt><dd>' + nf(s.price, 0) + ' FCFA/kg</dd><dt>' + esc(P.soldL) + '</dt><dd>' + fmtQty(s.soldKg, 'kg') + '</dd><dt>' + esc(P.revenueL) + '</dt><dd>' + fmtCur(s.revenue) + '</dd><dt>' + esc(P.costsL) + '</dt><dd>' + fmtCur(s.costs) + '</dd></dl>';
    return '<div class="sc ' + cls[k] + '"><div class="sc-h"><span>' + esc(P.scen[k][0]) + '</span>' + (compact ? '' : '<span class="mono faint">' + esc(P.weight(nf(r.weights[k] * 100, 0))) + '</span>') + '</div>' +
      '<div class="sc-m">' + fmtCur(s.margin) + '</div><div class="sc-r">' + esc(P.roi) + ' ' + pct(s.roi) + '</div>' +
      (compact ? '' : body + '<p class="small faint">' + esc(P.scen[k][1]) + '</p>') + '</div>';
  }).join('') + '</div>';
}

function unpricedNote(r) {
  if (!r.unpriced || !r.unpriced.length) return '';
  const names = r.unpriced.map(k => tl((KB.items[k] || KB.services[k] || {}).label) || k);
  return '<p class="small notice" style="margin-top:12px">' + esc(L().planner.unpricedNote(names.join(', '))) + '</p>';
}

function tabReturn(r) {
  const P = L().planner, sc = r.scenarios, long = r.profile && r.profile !== 'season', pi = prodInfo(PLAN.crop);
  const be = r.breakEven, bePrice = long ? be.pricePerUnit : be.priceXafKg, beUnit = long || pi.unit !== 'kg' ? ' FCFA / ' + pi.unit : ' FCFA/kg';
  if (!r.priceSource) {
    return '<div class="card"><div class="blk-t"><h4>' + esc(P.breakEvenT) + '</h4></div><dl class="kv2"><dt>' + esc(P.bePrice) + '</dt><dd>' + (bePrice ? nf(bePrice, 0) + esc(beUnit) : '·') + '</dd><dt>' + esc(long && r.profile === 'orchard' ? P.yieldYear : P.yieldL) + '</dt><dd>' + nf(sc.average.yieldTHa, 1) + ' t/ha</dd></dl><p class="small faint" style="margin-top:10px">' + esc(P.enterPrice) + '</p></div>';
  }
  const max = Math.max(...Object.values(sc).map(s => Math.abs(s.margin)), 1);
  const W = 640, H = 210, X0 = 150, mid = X0 + (W - X0 - 20) / 2, half = (W - X0 - 20) / 2;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(P.chartMargins) + '"><line x1="' + mid + '" x2="' + mid + '" y1="6" y2="' + (H - 18) + '" stroke="#C0D7CB"/>';
  ['good', 'average', 'poor', 'failure'].forEach((k, i) => {
    const s = sc[k], y = 14 + i * 46, w = Math.abs(s.margin) / max * half, x = s.margin >= 0 ? mid : mid - w;
    svg += '<text x="0" y="' + (y + 16) + '" font-size="12.5" fill="#3B564A">' + esc(P.scen[k][0]) + '</text><rect class="grow" data-tip="' + esc(P.scen[k][0] + ' · ' + fmtCur(s.margin).replace(/<[^>]+>/g, '')) + '" x="' + x + '" y="' + y + '" width="' + Math.max(2, w) + '" height="24" rx="4" fill="' + (s.margin >= 0 ? '#127A5B' : '#B0402D') + '" opacity="' + (k === 'average' ? 1 : .75) + '"/>';
  });
  svg += '<text x="' + mid + '" y="' + (H - 4) + '" font-size="10.5" text-anchor="middle" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">0</text></svg>';
  return scenarioCards(r) +
    '<div class="stack" style="--s:12px;margin-top:12px"><div class="card"><div class="blk-t"><h4>' + esc(P.chartMargins) + '</h4><span>' + esc(long ? P.overPlan : P.perSeason) + '</span></div><div class="chart-box nomin" data-ptips>' + svg + '</div></div>' +
    '<div class="card"><div class="blk-t"><h4>' + esc(P.breakEvenT) + '</h4></div><dl class="kv2"><dt>' + esc(P.beYield) + '</dt><dd>' + (be.yieldTHa ? nf(be.yieldTHa, 1) + ' t/ha' : '·') + '</dd><dt>' + esc(P.bePrice) + '</dt><dd>' + (bePrice ? nf(bePrice, 0) + esc(beUnit) : '·') + '</dd><dt>' + esc(P.expected) + '</dt><dd>' + fmtCur(r.expectedMargin) + '</dd></dl><p class="small faint" style="margin-top:10px">' + esc(P.expectedNote) + '</p></div></div>' +
    '<p class="notice" style="margin-top:14px">' + P.scenNote + '</p>';
}

function tabBudget(r) {
  const P = L().planner, B = r.budget, long = r.profile && r.profile !== 'season';
  const groups = {};
  B.lines.forEach(l => { const g = l.upfront ? 'equipment' : l.cat; (groups[g] = groups[g] || []).push(l); });
  const order = ['land', 'land_preparation', 'planting', 'seed', 'nursery', 'fertilizer', 'amendment', 'foliar', 'fungicide', 'insecticide', 'herbicide', 'stakes', 'trellis', 'irrigation', 'labour', 'advice', 'harvest', 'processing', 'equipment'];
  const keys = Object.keys(groups).sort((a, b) => (order.indexOf(a) + 99 * (order.indexOf(a) < 0)) - (order.indexOf(b) + 99 * (order.indexOf(b) < 0)));
  const totals = keys.map(k => [k, groups[k].reduce((a, l) => a + l.total, 0)]).concat(long ? [] : [['reserve', B.reserve]]);
  const colors = ['#0A3D2E', '#127A5B', '#2B7A8F', '#B0832A', '#1A9E73', '#3F95AC', '#D2A84A', '#0D5C44', '#9ACFDC', '#6E9A8A', '#9BD0B3', '#3E6B5A', '#C7893A', '#B9D3C7', '#5E7C6B', '#2C6F7F', '#E3CB8C', '#7A9488', '#A35D3A'];
  const tot = (long ? B.horizonCosts : B.total) || 1;
  const cat = (k) => P.cats[k] || k;
  const bar = '<div class="split" role="img" aria-label="' + esc(P.tabs.budget) + '">' + totals.map(([k, v], i) => '<span style="width:' + (v / tot * 100).toFixed(2) + '%;background:' + colors[i % colors.length] + '" title="' + esc(cat(k)) + '"></span>').join('') + '</div>' +
    '<div class="split-legend">' + totals.map(([k, v], i) => '<div><span><i style="background:' + colors[i % colors.length] + '"></i>' + esc(cat(k)) + '</span><b>' + fmtCur(v) + ' <em>' + nf(v / tot * 100, 0) + '%</em></b></div>').join('') + '</div>';
  const life = (l) => l.upfront ? (l.purchases > 1 ? ' <span class="faint small">· ' + esc(P.buys(l.purchases)) + '</span>' : l.lifeSeasons > 1 && !long ? ' <span class="faint small">· ' + esc(P.lifeSeasons(l.lifeSeasons)) + '</span>' : '') : '';
  const rows = keys.map(k => '<tr class="grp"><td colspan="4">' + esc(cat(k)) + '</td><td class="tnum">' + fmtCur(groups[k].reduce((a, l) => a + l.total, 0)) + '</td></tr>' +
    groups[k].map(l => '<tr><td>' + esc(tl(l.label)) + life(l) + '</td><td class="tnum">' + fmtQty(l.qty, l.unit) + '</td><td class="tnum">' + (l.unpriced ? '<span class="badge demo">' + esc(P.toQuote) + '</span>' : nf(l.price, l.price < 10 ? 1 : 0)) + '</td><td class="small faint">' + srcLinks(l.src) + '</td><td class="tnum">' + (l.unpriced ? '·' : fmtCur(l.total)) + '</td></tr>').join('')).join('') +
    (long
      ? '<tr class="tot"><td colspan="4">' + esc(P.horizonCosts) + '</td><td class="tnum">' + fmtCur(B.horizonCosts) + '</td></tr><tr class="grp"><td colspan="4">' + esc(P.totalNeed) + '</td><td class="tnum">' + fmtCur(B.total) + '</td></tr>'
      : '<tr class="grp"><td colspan="4">' + esc(P.cats.reserve) + '</td><td class="tnum">' + fmtCur(B.reserve) + '</td></tr><tr class="tot"><td colspan="4">' + esc(P.totalBudget) + '</td><td class="tnum">' + fmtCur(B.total) + '</td></tr>');
  return '<div class="card" style="padding:18px">' + bar + '</div>' + unpricedNote(r) + '<div class="tbl-wrap" style="margin-top:12px"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.line) + '</th><th>' + esc(P.th.qty) + '</th><th>' + esc(P.th.unitPrice) + '</th><th>' + esc(P.th.src) + '</th><th>' + esc(P.th.total) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="small faint" style="margin-top:10px">' + esc(long ? P.budgetNoteLong : P.budgetNote) + '</p>';
}

/** Cash position month by month: costs below zero, sales above, and the cumulative line. */
function tabCashflow(r) {
  const P = L().planner, cf = r.cashflow, M = cf.months;
  const W = 680, H = 240, X0 = 64, X1 = W - 10, T = 14, B = H - 26;
  const cv = PLAN.currency === 'XAF' ? 1 : KB.fx[PLAN.currency] / KB.fx.XAF; // axis in the display currency
  const hi0 = Math.max(1e-6, ...M.map(m => Math.max(m.revenue, m.cum))) * cv, lo0 = Math.min(-1e-6, ...M.map(m => Math.min(-m.costs, m.cum))) * cv;
  const raw = (hi0 - lo0) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), stp = [1, 2, 2.5, 5, 10].map(f => f * mag).find(s => s >= raw) || raw;
  const hi = Math.ceil(hi0 / stp) * stp, lo = Math.floor(lo0 / stp) * stp;
  const y = (xaf) => T + (hi - xaf * cv) / (hi - lo) * (B - T), bw = (X1 - X0) / M.length;
  const lbl = (v) => { const a = Math.abs(v); return (v < 0 ? '-' : '') + (a >= 1e6 ? nf(a / 1e6, a % 1e6 ? 1 : 0) + ' M' : a >= 1e3 ? nf(a / 1e3, a % 1e3 ? 1 : 0) + ' k' : nf(a, 0)); };
  const mName = (m) => monthName(m.m, 'short') + ' ' + m.y;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(P.cashT) + '">';
  const ticks = []; for (let v = lo; v <= hi + stp / 2; v += stp) ticks.push(Math.round(v / stp) * stp);
  ticks.forEach(v => { svg += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y(v / cv) + '" y2="' + y(v / cv) + '" stroke="#E2ECE6"/><text x="' + (X0 - 6) + '" y="' + (y(v / cv) + 4) + '" font-size="10" text-anchor="end" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(lbl(v)) + '</text>'; });
  svg += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#9DB8AA"/>';
  M.forEach((m, i) => {
    const x = X0 + i * bw + bw * 0.15, w = Math.max(1, bw * 0.7);
    const tip = esc(mName(m) + ' · ' + P.cashOut + ' ' + txtCur(m.costs) + ' · ' + P.cashIn + ' ' + txtCur(m.revenue) + ' · ' + P.cashCum + ' ' + txtCur(m.cum));
    if (m.costs > 0) svg += '<rect data-tip="' + tip + '" x="' + x + '" y="' + y(0) + '" width="' + w + '" height="' + Math.max(1, y(-m.costs) - y(0)) + '" fill="#C7893A" opacity=".85" rx="1"/>';
    if (m.revenue > 0) svg += '<rect data-tip="' + tip + '" x="' + x + '" y="' + y(m.revenue) + '" width="' + w + '" height="' + Math.max(1, y(0) - y(m.revenue)) + '" fill="#127A5B" rx="1"/>';
  });
  svg += '<polyline fill="none" stroke="#0A3D2E" stroke-width="2" points="' + M.map((m, i) => (X0 + (i + 0.5) * bw).toFixed(1) + ',' + y(m.cum).toFixed(1)).join(' ') + '"/>';
  const step = M.length <= 14 ? 1 : M.length <= 40 ? 3 : 12;
  M.forEach((m, i) => { if (i % step === 0) svg += '<text x="' + (X0 + (i + 0.5) * bw) + '" y="' + (H - 8) + '" font-size="10" text-anchor="middle" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(step === 12 ? P.yearShort(i / 12 + 1) : monthName(m.m, 'short')) + '</text>'; });
  svg += '</svg>';
  const peakI = M.reduce((b, m, i) => m.cum < M[b].cum ? i : b, 0);
  const kv = '<dl class="kv2"><dt>' + esc(P.peakL) + '</dt><dd>' + fmtCur(cf.peakNeed) + ' <span class="faint small">' + esc(P.peakAt(mName(M[peakI]))) + '</span></dd>' +
    '<dt>' + esc(P.paybackL) + '</dt><dd>' + esc(cf.paybackIndex !== null ? mName(M[cf.paybackIndex]) : P.never) + '</dd><dt>' + esc(P.endL) + '</dt><dd>' + fmtCur(cf.end) + '</dd></dl>';
  let years = '';
  if (M.length > 14) {
    const ys = [];
    M.forEach((m, i) => { const k = Math.floor(i / 12); ys[k] = ys[k] || { costs: 0, revenue: 0, cum: 0 }; ys[k].costs += m.costs; ys[k].revenue += m.revenue; ys[k].cum = m.cum; });
    years = '<h5 class="sub">' + esc(P.yearT) + '</h5><div class="tbl-wrap"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.year) + '</th><th>' + esc(P.th.costs) + '</th><th>' + esc(P.th.sales) + '</th><th>' + esc(P.th.net) + '</th><th>' + esc(P.th.cum) + '</th></tr></thead><tbody>' +
      ys.map((v, k) => '<tr><td>' + esc(P.yearN(k + 1)) + '</td><td class="tnum">' + fmtCur(v.costs) + '</td><td class="tnum">' + fmtCur(v.revenue) + '</td><td class="tnum">' + fmtCur(v.revenue - v.costs) + '</td><td class="tnum">' + fmtCur(v.cum) + '</td></tr>').join('') + '</tbody></table></div>';
  }
  return (r.priceSource ? '' : '<p class="notice info" style="margin-bottom:12px">' + esc(P.cashNoPrice) + '</p>') + '<div class="card"><div class="blk-t"><h4>' + esc(P.cashT) + '</h4><span>' + esc(P.cashSub) + '</span></div><div class="chart-box nomin" data-ptips>' + svg + '</div>' +
    '<div class="risk-legend"><span><i style="background:#C7893A"></i>' + esc(P.cashOut) + '</span><span><i style="background:#127A5B"></i>' + esc(P.cashIn) + '</span><span><i style="background:#0A3D2E"></i>' + esc(P.cashCum) + '</span></div></div>' +
    '<div class="card">' + kv + '<p class="small faint" style="margin-top:10px">' + esc(P.cashNote) + '</p></div>' + years;
}

/** Every crop with the same capital, start date and water option. */
function tabCompare(r) {
  const P = L().planner;
  const prices = {}, products = {};
  Object.keys(KB.crops).forEach(k => { const v = PLAN.prices[priceKey(k)]; if (v) prices[k] = v; const pr = plProduct(k); if (pr) products[k] = pr; });
  let rows;
  try { rows = AFEngine.compare(KB, Object.assign({}, PLAN, { prices, products })); } catch (e) { return '<p class="notice">' + esc(P.engineError) + '</p>'; }
  rows.sort((a, b) => ((b.marginPerMonth !== null) - (a.marginPerMonth !== null)) || ((b.marginPerMonth || 0) - (a.marginPerMonth || 0)) || (a.risk - b.risk));
  const lv = P.riskLevel;
  const body = rows.map(x => {
    const unit = x.unit ? tl(x.unit) : 'kg', cur = x.crop === PLAN.crop;
    const name = cur ? '<b>' + esc(tl(x.name)) + '</b> <span class="badge plan">' + esc(P.current) + '</span>' : '<button type="button" class="lnk" data-pgo="' + x.crop + '" title="' + esc(P.simulate) + '">' + esc(tl(x.name)) + '</button>';
    return '<tr' + (cur ? ' class="cur"' : '') + '><td class="c-n">' + name + '<span class="cmp-s">' + esc(durLabel(x.months)) + '</span></td><td class="tnum" data-l="' + esc(P.th.area) + '">' + plArea(x.areaHa) + '<span class="cmp-s">' + (x.needPerHa ? txtCur(x.needPerHa) + ' / ha' : '·') + '</span></td>' +
      '<td class="tnum" data-l="' + esc(P.th.breakEven) + '">' + (x.breakEvenPerUnit ? nf(x.breakEvenPerUnit, 0) + '<span class="cmp-s">' + esc(P.perUnit(unit)) + '</span>' : '·') + '</td><td data-l="' + esc(P.th.risk) + '"><span class="rkb lv' + riskLvl(x.risk) + '">' + esc(lv[riskLvl(x.risk)]) + '</span><span class="cmp-s">' + esc(monthName(x.bestMonth)) + '</span></td>' +
      '<td class="tnum" data-l="' + esc(P.th.marginMonth) + '">' + (x.marginPerMonth !== null ? '<b style="color:' + (x.marginPerMonth >= 0 ? 'var(--green)' : 'var(--crit)') + '">' + fmtCur(x.marginPerMonth) + '</b>' : '<span class="faint">·</span>') + '</td></tr>';
  }).join('');
  return '<div class="card"><div class="blk-t"><h4>' + esc(P.compareT) + '</h4><span>' + esc(P.compareSub) + '</span></div></div>' +
    '<div class="tbl-wrap"><table class="tbl ptbl cmp"><thead><tr><th>' + esc(P.th.crop) + '<span class="cmp-s">' + esc(P.th.cycle) + '</span></th><th>' + esc(P.th.area) + '<span class="cmp-s">' + esc(P.th.needHa) + '</span></th><th>' + esc(P.th.breakEven) + '</th><th>' + esc(P.th.risk) + '<span class="cmp-s">' + esc(P.th.best) + '</span></th><th>' + esc(P.th.marginMonth) + '</th></tr></thead><tbody>' + body + '</tbody></table></div>' +
    '<p class="small faint" style="margin-top:10px">' + esc(P.compareNote) + '</p>';
}

function tabItinerary(r) {
  const P = L().planner, phases = {};
  r.itinerary.forEach(s => { (phases[s.phase] = phases[s.phase] || []).push(s); });
  return '<div class="itin">' + Object.keys(phases).map(ph => '<section><h5>' + esc(tl(KB.phases[ph])) + '</h5>' + phases[ph].map(s => '<article class="it"><div class="it-d mono">' + esc(fmtDateS(s.from) + (s.to - s.from > 864e5 ? ' → ' + fmtDateS(s.to) : '')) + (s.occurrences > 1 ? '<span class="it-o">' + esc(P.occurrences(s.occurrences, s.every)) + '</span>' : '') + '</div><div><h6>' + esc(tl(s.label)) + '</h6><p>' + esc(tl(s.detail)) + '</p>' +
    (s.harvest && r.profile === 'orchard' ? '<p class="small faint">' + esc(P.harvestShare(nf(s.share * 100, 0))) + '</p>' : '') +
    (s.inputs.length ? '<ul class="it-in">' + s.inputs.map(i => '<li><span>' + esc(tl(i.label)) + (i.apps > 1 ? ' <span class="faint">· ' + esc(P.apps(i.apps)) + '</span>' : '') + '</span><b class="tnum">' + fmtQty(i.qty, i.unit) + '</b></li>').join('') + '</ul>' : '') +
    (s.labourDays ? '<p class="small faint">' + esc(P.labourDays(nf(s.labourDays, s.labourDays < 10 ? 1 : 0))) + '</p>' : '') + '<p class="small faint">' + srcLinks(s.src) + '</p></div></article>').join('') + '</section>').join('') + '</div>';
}

function tabShopping(r) {
  const P = L().planner;
  const rows = r.shopping.sort((a, b) => a.category.localeCompare(b.category)).map(s => '<tr><td>' + esc(tl(s.label)) + '</td><td class="small faint">' + esc(P.cats[s.category] || s.category) + '</td><td class="tnum">' + fmtQty(s.qty, s.unit) + '</td><td class="tnum">' + (s.packs ? s.packs + ' × ' + esc(tl(s.packLabel)) : '·') + '</td><td class="tnum">' + (s.unpriced ? '<span class="badge demo">' + esc(P.toQuote) + '</span>' : fmtCur(s.packCost || s.cost)) + '</td></tr>').join('');
  const up = r.budget.lines.filter(l => l.upfront).map(l => '<tr><td>' + esc(tl(l.label)) + '</td><td class="small faint">' + esc(P.cats.equipment) + '</td><td class="tnum">' + fmtQty(l.qty, l.unit) + '</td><td class="tnum">·</td><td class="tnum">' + (l.unpriced ? '<span class="badge demo">' + esc(P.toQuote) + '</span>' : fmtCur(l.unitTotal || l.total)) + '</td></tr>').join('');
  return '<div class="tbl-wrap"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.item) + '</th><th>' + esc(P.th.cat) + '</th><th>' + esc(P.th.need) + '</th><th>' + esc(P.th.packs) + '</th><th>' + esc(P.th.cost) + '</th></tr></thead><tbody>' + rows + up + '</tbody></table></div><p class="small faint" style="margin-top:10px">' + esc(r.shoppingScope === 'first_year' ? P.shopFirstYear : P.shopNote) + '</p>';
}

function tabWater(r) {
  const P = L().planner, wb = r.water.balance, lv = LV(), long = r.profile && r.profile !== 'season', crop = KB.crops[PLAN.crop];
  const rows = wb.rows.slice(0, 12), W = 640, H = 200, X0 = 40, X1 = W - 10, max = Math.max(...rows.map(x => Math.max(x.etc, x.peff)), 1), bw = (X1 - X0) / rows.length;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + (H + 26) + '" role="img" aria-label="' + esc(P.waterChart) + '">';
  [0, 0.5, 1].forEach(f => { const y = H - f * (H - 10); svg += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y + '" y2="' + y + '" stroke="#D5E6DD"/><text x="' + (X0 - 6) + '" y="' + (y + 4) + '" font-size="10" text-anchor="end" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + nf(max * f, 0) + '</text>'; });
  rows.forEach((x, i) => {
    const xe = X0 + i * bw + bw * 0.12, w = bw * 0.36, he = x.etc / max * (H - 10), hp = x.peff / max * (H - 10);
    svg += '<rect data-tip="' + esc(monthName(x.month) + ' · ETc ' + nf(x.etc, 0) + ' mm · ' + P.rainEff + ' ' + nf(x.peff, 0) + ' mm · ' + P.deficit + ' ' + nf(x.deficit, 0) + ' mm') + '" x="' + xe + '" y="' + (H - he) + '" width="' + w + '" height="' + he + '" fill="#127A5B" rx="2"/><rect x="' + (xe + w + 2) + '" y="' + (H - hp) + '" width="' + w + '" height="' + hp + '" fill="#2B7A8F" opacity=".75" rx="2"/>' +
      '<text x="' + (X0 + i * bw + bw / 2) + '" y="' + (H + 16) + '" font-size="10.5" text-anchor="middle" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(monthName(x.month, 'short')) + '</text>';
  });
  svg += '</svg>';
  const rk = r.risk, item = (k, lvl, text) => '<div class="rk lv' + lvl + '"><div class="rk-h"><span>' + esc(P.riskNames[k]) + '</span><b>' + esc(lv[lvl]) + '</b></div><p>' + esc(text) + '</p></div>';
  const months = (arr) => arr.map(m => monthName(m, 'short')).join(', ');
  const heatOk = crop.heat_c && rk.flowerMonths && rk.flowerMonths.length && rk.tmaxFlower !== null;
  const risks = '<div class="rks">' +
    item('water', rk.water, long ? P.waterLong(nf((r.water.establishment || 0) * 100, 0), nf(r.water.coverage * 100, 0), r.input.water) : P.riskText.water(nf(r.water.coverage * 100, 0), nf(wb.deficit, 0), r.input.water)) +
    item('heat', rk.heat, heatOk ? P.riskText.heat(months(rk.flowerMonths), nf(rk.tmaxFlower, 0), crop.heat_c) : P.heatNA) +
    item('disease', rk.disease, P.riskText.disease(nf(rk.wetRain, 0), tl(crop.disease_note))) +
    item('market', rk.market, P.riskText.market(months(rk.harvestMonths), nf(rk.priceIndex * 100, 0))) +
    '<div class="rk"><div class="rk-h"><span>' + esc(P.riskNames.context) + '</span><b>' + esc(P.check) + '</b></div><p>' + esc(P.riskText.context) + '</p></div></div>';
  const win = '<div class="wins" role="group" aria-label="' + esc(P.windowsT) + '">' + r.windows.map(w => '<button type="button" data-pwin="' + w.month + '" class="win lv' + Math.min(2, Math.floor(w.risk.score / 2)) + (w.month === r.bestMonth ? ' best' : '') + (new Date(PLAN.start + 'T00:00:00Z').getUTCMonth() === w.month ? ' cur' : '') + '" title="' + esc(monthName(w.month) + ' · ' + P.riskScore + ' ' + w.risk.score + '/8') + '"><span>' + esc(monthName(w.month, 'short')) + '</span><small>' + w.risk.score + '</small></button>').join('') + '</div><p class="small muted" style="margin-top:8px">' + esc(P.bestLine(monthName(r.bestMonth))) + '</p>';
  const wl = r.water.grossM3 > 0 ? '<p class="small muted">' + esc(P.waterVolume(nf(r.water.grossM3, 0), nf(r.water.balance.deficit, 0))) + '</p>' : '';
  return '<div class="card"><div class="blk-t"><h4>' + esc(P.waterChart) + '</h4><span>' + esc(long ? P.waterSubLong : P.waterSub) + '</span></div><div class="chart-box nomin" data-ptips>' + svg + '</div><div class="risk-legend"><span><i style="background:#127A5B"></i>' + esc(P.cropNeed) + '</span><span><i style="background:#2B7A8F"></i>' + esc(P.rainEff) + '</span></div>' + wl + '</div>' +
    '<h5 class="sub">' + esc(P.risksT) + '</h5>' + risks + '<h5 class="sub">' + esc(P.windowsT) + '</h5>' + win;
}

function srcLinks(ids) {
  const u = Array.from(new Set(ids || [])).filter(id => KB.sources[id]);
  return u.map(id => '<a href="' + esc(KB.sources[id].url || '#') + '" target="_blank" rel="noopener" title="' + esc(KB.sources[id].title) + '">[' + esc(id) + ']</a>').join(' ');
}
function tabSources(r) {
  const P = L().planner, crop = KB.crops[PLAN.crop];
  const conf = (crop.confidence || KB.confidence || []).map(c => '<tr><td>' + esc(tl(c.block)) + '</td><td><span class="badge ' + (c.level === 'medium' ? 'plan' : c.level === 'high' ? 'real' : 'demo') + '">' + esc(P.conf[c.level]) + '</span></td><td class="small">' + esc(tl(c.note)) + '</td></tr>').join('');
  const used = new Set();
  r.budget.lines.forEach(l => (l.src || []).forEach(s => used.add(s)));
  r.itinerary.forEach(s => (s.src || []).forEach(x => used.add(x)));
  [crop.src, crop.price.src, crop.harvest_src, KB.climate.src, KB.fx_src, (KB.water.options[PLAN.water] || {}).src, PLAN.water !== 'rainfed' && PLAN.water !== 'manual' ? KB.water.src_fuel : null].forEach(a => (a || []).forEach(s => used.add(s)));
  const key = id => { const m = /^([A-Z]+)(\d+)$/.exec(id) || [id, id, 0]; return [m[1], +m[2]]; };
  const list = Array.from(used).filter(id => KB.sources[id]).sort((a, b) => { const x = key(a), y = key(b); return x[0] === y[0] ? x[1] - y[1] : (x[0] < y[0] ? -1 : 1); }).map(id => { const s = KB.sources[id]; return '<li><span class="mono faint">[' + esc(id) + ']</span> ' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + ' ↗</a>' : esc(s.title)) + (s.publisher ? ' <span class="faint">· ' + esc(s.publisher) + (s.year ? ', ' + s.year : '') + '</span>' : '') + '</li>'; }).join('');
  const assume = (KB.assumptions || []).map(a => '<li>' + esc(tl(a)) + '</li>').join('');
  return '<div class="tbl-wrap"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.block) + '</th><th>' + esc(P.th.conf) + '</th><th>' + esc(P.th.note) + '</th></tr></thead><tbody>' + conf + '</tbody></table></div>' +
    '<h5 class="sub">' + esc(P.assumptionsT) + '</h5><ul class="list-check">' + assume + '</ul><h5 class="sub">' + esc(P.sourcesT) + '</h5><ol class="srcs">' + list + '</ol>';
}

function plannerInput() {
  return Object.assign({}, PLAN, { capital: PLAN.capital, priceXafKg: plPrice(), product: plProduct(PLAN.crop) });
}

function plannerRender(root, compact) {
  const out = $('[data-pout]', root);
  if (!out) return;
  let r;
  try { r = AFEngine.plan(KB, plannerInput()); }
  catch (e) { out.innerHTML = '<p class="notice">' + esc(L().planner.engineError) + '</p>'; return; }
  PLAN.last = r;
  out.innerHTML = plannerOutHTML(r, compact);
  $$('[data-ptips]', out).forEach(b => bindTips(b));
}

function plannerMount(root, compact) {
  const form = $('[data-planner]', root); if (!form) return () => {};
  let t = 0;
  const parseAmt = v => { const s = String(v).replace(/[^\d.,]/g, '').replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.'); return Math.max(0, Math.min(1e12, parseFloat(s) || 0)); };
  const changed = () => { plannerRender(root, compact); clearTimeout(t); t = setTimeout(() => analytics.track('planner_run', { crop: PLAN.crop, water: PLAN.water, mode: PLAN.mode, cur: PLAN.currency }), 900); };
  const reform = (focusSel) => { form.innerHTML = plannerFormInner(compact); const f = focusSel && $(focusSel, form); if (f) f.focus(); };
  const pickCrop = (k, focus) => { PLAN.crop = k; reform(focus ? '[data-pcrop="' + k + '"]' : null); changed(); };
  form.addEventListener('input', e => {
    const id = e.target.id;
    if (id === 'pl-cap') PLAN.capital = parseAmt(e.target.value);
    else if (id === 'pl-area') PLAN.area = Math.max(0, parseFloat(e.target.value) || 0);
    else if (id === 'pl-cur') PLAN.currency = e.target.value;
    else if (id === 'pl-start') { if (e.target.value) PLAN.start = e.target.value; }
    else if (id === 'pl-land') PLAN.land = e.target.value;
    else if (id === 'pl-market') PLAN.market = e.target.value;
    else if (id === 'pl-fam') PLAN.familyLabour = parseFloat(e.target.value) || 0;
    else if (id === 'pl-tools') PLAN.ownTools = e.target.checked;
    else if (id === 'pl-price') { const v = parseAmt(e.target.value); PLAN.prices[priceKey(PLAN.crop)] = v > 0 ? v : null; }
    else if (e.target.name === 'pwater') PLAN.water = e.target.value;
    changed();
  });
  form.addEventListener('change', e => { if (e.target.id === 'pl-cap') e.target.value = nf(PLAN.capital); if (e.target.id === 'pl-price') e.target.value = plPrice() ? nf(plPrice()) : ''; });
  form.addEventListener('click', e => {
    const m = e.target.closest('[data-pmode]'), c = e.target.closest('[data-pcrop]'), pr = e.target.closest('[data-pprod]');
    if (m) { PLAN.mode = m.dataset.pmode; $$('[data-pmode]', form).forEach(b => b.setAttribute('aria-pressed', String(b === m))); const a = $('[data-parea]', form); if (a) a.hidden = PLAN.mode !== 'crop'; changed(); }
    if (c) pickCrop(c.dataset.pcrop, true);
    if (pr) { PLAN.products[PLAN.crop] = pr.dataset.pprod; reform('[data-pprod="' + pr.dataset.pprod + '"]'); changed(); }
  });
  form.addEventListener('toggle', e => { if (e.target.matches && e.target.matches('details.adv')) PLAN.advOpen = e.target.open; }, true);
  const out = $('[data-pout]', root);
  out.addEventListener('click', e => {
    const tb = e.target.closest('[data-ptab]');
    if (tb) { PLAN.tab = tb.dataset.ptab; plannerRender(root, compact); const nb = $('[data-ptab="' + PLAN.tab + '"]', out); if (nb) nb.focus(); analytics.track('planner_tab', { tab: PLAN.tab }); return; }
    const go = e.target.closest('[data-pgo]');
    if (go) { PLAN.tab = 'return'; pickCrop(go.dataset.pgo, false); const f = $('[data-pcrop="' + PLAN.crop + '"]', form); if (f) f.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' }); analytics.track('planner_compare_pick', { crop: PLAN.crop }); return; }
    const rp = e.target.closest('[data-preport]');
    if (rp && typeof openReportDialog === 'function') { openReportDialog(plannerInput(), PLAN.last); return; }
    const wn = e.target.closest('[data-pwin]');
    if (wn) { const y = new Date(PLAN.start + 'T00:00:00Z').getUTCFullYear(); const m = +wn.dataset.pwin; const now = new Date(); const yy = (y === now.getUTCFullYear() && m < now.getUTCMonth()) ? y + 1 : y; PLAN.start = new Date(Date.UTC(yy, m, 1)).toISOString().slice(0, 10); const si = $('#pl-start', form); if (si) si.value = PLAN.start; plannerRender(root, compact); analytics.track('planner_window', { month: m }); }
  });
  out.addEventListener('keydown', e => {
    const tb = e.target.closest('[data-ptab]'); if (!tb || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const all = $$('[data-ptab]', out), i = all.indexOf(tb), n = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
    e.preventDefault(); PLAN.tab = n.dataset.ptab; plannerRender(root, compact); const nb = $('[data-ptab="' + PLAN.tab + '"]', out); if (nb) nb.focus();
  });
  plannerRender(root, compact);
  return () => clearTimeout(t);
}
