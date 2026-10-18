/* ---------- Season Planner v2 (interface). Calculations live in engine.cjs, data in data/kb.json ---------- */
const tl = (x) => (x && typeof x === 'object' && !Array.isArray(x)) ? (x[LANG] || x.en || '') : (x == null ? '' : String(x));
const PL_CUR = ['USD', 'XAF', 'EUR', 'RWF', 'KES', 'NGN'];
const PL_WATER = ['rainfed', 'manual', 'existing', 'pump', 'drip'];
const nextMonthStart = () => { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)).toISOString().slice(0, 10); };
const PLAN = { capital: 5000, currency: 'USD', mode: 'budget', area: 0.25, crop: 'tomato', water: 'pump', start: nextMonthStart(), land: 'rent', market: 'local', familyLabour: 0, ownTools: false, tab: 'return', prices: {} };
const plPrice = () => PLAN.prices[PLAN.crop] || null;
const priceHint = (k) => { const c = KB.crops[k]; return tl(c.price.note) + (c.price.observed ? ' ' + tl(c.price.observed) : '') + (c.price.reference_xaf_kg ? ' ' + L().planner.priceOptional : ''); };

const fmtXaf = (v) => money(Math.round(v), 'XAF');
const fmtCur = (xaf) => { const c = PLAN.currency; if (c === 'XAF') return fmtXaf(xaf); return money(xaf / KB.fx.XAF * KB.fx[c], c); };
const fmtBoth = (xaf) => PLAN.currency === 'XAF' ? fmtXaf(xaf) : fmtCur(xaf) + ' <span class="faint">· ' + fmtXaf(xaf) + '</span>';
const plArea = (ha) => { if (!(ha > 0)) return '0 m²'; if (ha < 0.1) return nf(ha * 10000, 0) + ' m²'; return nf(ha, ha < 10 ? 2 : 1) + ' ha'; };
const fmtDateS = (d) => new Intl.DateTimeFormat(L().meta.locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d);
const fmtQty = (q, unit) => { const u = tl((KB.units || {})[unit]) || unit; return (q >= 100 ? nf(q, 0) : q >= 10 ? nf(q, 1) : nf(q, 2)) + ' ' + u; };
const pct = (v) => (v >= 0 ? '+' : '') + nf(v * 100, 0) + '%';
const LV = () => L().planner.levels;

function plannerFormHTML(compact) {
  const P = L().planner, S = PLAN;
  const cur = PL_CUR.map(c => '<option' + (S.currency === c ? ' selected' : '') + '>' + c + '</option>').join('');
  const crops = Object.keys(KB.crops).map(k => '<button type="button" data-pcrop="' + k + '" aria-pressed="' + (S.crop === k) + '">' + esc(tl(KB.crops[k].name)) + '<span class="mono" style="display:block;font-size:10px;color:var(--fg-3);letter-spacing:.06em;margin-top:2px">' + esc(tl(KB.crops[k].badge).toUpperCase()) + '</span></button>').join('');
  const ref = KB.crops[S.crop].price.reference_xaf_kg;
  const water = PL_WATER.map(w => '<label class="wopt"><input type="radio" name="pwater" value="' + w + '"' + (S.water === w ? ' checked' : '') + '><span><b>' + esc(P.water[w][0]) + '</b><small>' + esc(P.water[w][1]) + '</small></span></label>').join('');
  return '<form class="sim-in planner-in" data-planner novalidate onsubmit="return false">' +
    '<div class="blk-t"><h4>' + esc(P.inputsT) + '</h4><span class="badge plan">' + esc(P.badge) + '</span></div>' +
    '<div class="row2"><div class="f"><label for="pl-cap">' + esc(P.capital) + '</label><input class="inp tnum" id="pl-cap" inputmode="decimal" autocomplete="off" value="' + esc(nf(S.capital)) + '"><span class="hint">' + esc(P.capitalHint) + '</span></div>' +
    '<div class="f"><label for="pl-cur">' + esc(P.currency) + '</label><select class="inp" id="pl-cur">' + cur + '</select></div></div>' +
    '<div class="f"><span class="lbl" id="pl-mode-l">' + esc(P.approach) + '</span><div class="seg" role="group" aria-labelledby="pl-mode-l"><button type="button" data-pmode="budget" aria-pressed="' + (S.mode === 'budget') + '">' + esc(P.budgetFirst) + '</button><button type="button" data-pmode="crop" aria-pressed="' + (S.mode === 'crop') + '">' + esc(P.areaFirst) + '</button></div></div>' +
    '<div class="f" data-parea' + (S.mode === 'crop' ? '' : ' hidden') + '><label for="pl-area">' + esc(P.area) + '</label><input class="inp tnum" id="pl-area" type="number" min="0.001" step="0.01" inputmode="decimal" value="' + S.area + '"></div>' +
    '<div class="f"><span class="lbl" id="pl-crop-l">' + esc(P.crop) + '</span><div class="crops" role="group" aria-labelledby="pl-crop-l">' + crops + '</div></div>' +
    '<div class="f"><label for="pl-price">' + esc(P.price) + '</label><input class="inp tnum" id="pl-price" inputmode="decimal" autocomplete="off" placeholder="' + esc(ref ? nf(ref) : P.pricePh) + '" value="' + esc(plPrice() ? nf(plPrice()) : '') + '"><span class="hint" data-phint>' + esc(priceHint(S.crop)) + '</span></div>' +
    '<fieldset class="f" style="border:0;padding:0;margin:0"><legend class="lbl" style="font-size:13px;color:var(--fg-2);font-weight:500;margin-bottom:7px">' + esc(P.waterT) + '</legend><div class="wopts">' + water + '</div></fieldset>' +
    '<div class="f"><label for="pl-start">' + esc(P.start) + '</label><input class="inp" id="pl-start" type="date" value="' + S.start + '"><span class="hint">' + esc(P.startHint) + '</span></div>' +
    (compact ? '' :
    '<details class="adv"' + (S.advOpen ? ' open' : '') + '><summary>' + esc(P.advanced) + '</summary><div class="stack" style="--s:14px;margin-top:14px">' +
    '<div class="f"><label for="pl-land">' + esc(P.land) + '</label><select class="inp" id="pl-land"><option value="rent"' + (S.land === 'rent' ? ' selected' : '') + '>' + esc(P.landRent) + '</option><option value="own"' + (S.land === 'own' ? ' selected' : '') + '>' + esc(P.landOwn) + '</option></select></div>' +
    '<div class="f"><label for="pl-fam">' + esc(P.family) + '</label><select class="inp" id="pl-fam">' + [0, 0.25, 0.5, 0.75].map(v => '<option value="' + v + '"' + (S.familyLabour === v ? ' selected' : '') + '>' + (v * 100) + '%</option>').join('') + '</select><span class="hint">' + esc(P.familyHint) + '</span></div>' +
    '<label class="chk"><input type="checkbox" id="pl-tools"' + (S.ownTools ? ' checked' : '') + '> ' + esc(P.ownTools) + '</label></div></details>') +
    '</form>';
}

function plannerOutHTML(r, compact) {
  const P = L().planner, crop = KB.crops[PLAN.crop];
  const priced = !!r.priceSource;
  const be = r.breakEven.priceXafKg;
  const msg = (k) => P.states[k] ? P.states[k](fmtCur(r.minXaf), plArea(r.water.maxAreaHa || 0), be ? nf(be, 0) : '·') : '';
  let state = r.state !== 'ok' && r.state !== 'needs_price' ? '<p class="notice" style="border-left-color:var(--warn)">' + esc(msg(r.state)) + '</p>' : '';
  if (r.state === 'manual_limit' && PLAN.mode === 'budget' && r.capitalXaf > r.budget.total) state += '<p class="small muted">' + esc(P.unusedCapital(fmtCur(r.capitalXaf - r.budget.total).replace(/<[^>]+>/g, ''))) + '</p>';
  if (!priced) state += '<p class="notice info">' + esc(msg('needs_price')) + '</p>';
  if (r.state === 'below_min' || r.state === 'upfront_exceeds') {
    if (r.state === 'below_min') return state;
    const up = r.budget.lines.filter(l => l.upfront);
    return state + '<div class="tbl-wrap" style="margin-top:12px"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.item) + '</th><th>' + esc(P.th.cost) + '</th></tr></thead><tbody>' + up.map(l => '<tr><td>' + esc(tl(l.label)) + '</td><td class="tnum">' + fmtCur(l.total) + '</td></tr>').join('') + '</tbody></table></div><p class="small muted" style="margin-top:10px">' + esc(P.upfrontHint) + '</p>';
  }
  const sc = r.scenarios, area = r.areaHa;
  const kpis = '<div class="kpis kpis4">' +
    '<div><div class="k">' + esc(P.kArea) + '</div><div class="v">' + plArea(area) + '</div><div class="s">' + esc(P.plants(nf(r.plants))) + '</div></div>' +
    '<div><div class="k">' + esc(PLAN.mode === 'crop' ? P.kRequired : P.kBudget) + '</div><div class="v vsm">' + fmtCur(PLAN.mode === 'crop' ? r.requiredXaf : r.budget.total) + '</div><div class="s">' + esc(P.inclReserve) + '</div></div>' +
    (priced ? '<div><div class="k">' + esc(P.kMargin) + '</div><div class="v vsm" style="color:' + (sc.average.margin >= 0 ? 'var(--green)' : 'var(--crit)') + '">' + fmtCur(sc.average.margin) + '</div><div class="s">' + esc(P.roiAvg(pct(sc.average.roi))) + '</div></div>'
      : '<div><div class="k">' + esc(P.kBreakEven) + '</div><div class="v vsm">' + (be ? nf(be, 0) + '<small> FCFA/kg</small>' : '·') + '</div><div class="s">' + esc(P.atAvgYield) + '</div></div>') +
    '<div><div class="k">' + esc(P.kSeason) + '</div><div class="v vsm">' + Math.round(r.calendar.totalDays / 7) + '<small>' + esc(L().sim.weeks) + '</small></div><div class="s">' + esc(fmtDateS(r.calendar.start) + ' → ' + fmtDateS(r.calendar.lastHarvest)) + '</div></div></div>';
  if (compact) {
    return state + kpis + (priced ? scenarioCards(r, true) : '') + unpricedNote(r) + '<p class="small muted" style="margin-top:12px">' + esc(P.compactNote) + '</p><div><a class="btn btn-primary" href="#planner" data-cta="home_planner">' + esc(P.openFull) + ARROW + '</a></div>';
  }
  const tabs = ['return', 'budget', 'itinerary', 'shopping', 'water', 'sources'];
  const tabBar = '<div class="tabs" role="tablist" aria-label="' + esc(P.title) + '">' + tabs.map(t => '<button type="button" role="tab" id="pt-' + t + '" aria-selected="' + (PLAN.tab === t) + '" aria-controls="pt-panel" tabindex="' + (PLAN.tab === t ? 0 : -1) + '" data-ptab="' + t + '">' + esc(P.tabs[t]) + '</button>').join('') + '</div>';
  const panel = { return: tabReturn, budget: tabBudget, itinerary: tabItinerary, shopping: tabShopping, water: tabWater, sources: tabSources }[PLAN.tab](r);
  return state + kpis + tabBar + '<div id="pt-panel" role="tabpanel" aria-labelledby="pt-' + PLAN.tab + '" class="ptab">' + panel + '</div>';
}

function scenarioCards(r, compact) {
  const P = L().planner, sc = r.scenarios;
  const cls = { good: 'ok', average: 'mid', poor: 'warn', failure: 'bad' };
  return '<div class="scen' + (compact ? ' compact' : '') + '">' + ['good', 'average', 'poor', 'failure'].map(k => {
    const s = sc[k];
    return '<div class="sc ' + cls[k] + '"><div class="sc-h"><span>' + esc(P.scen[k][0]) + '</span>' + (compact ? '' : '<span class="mono faint">' + esc(P.weight(nf(r.weights[k] * 100, 0))) + '</span>') + '</div>' +
      '<div class="sc-m">' + fmtCur(s.margin) + '</div><div class="sc-r">' + esc(P.roi) + ' ' + pct(s.roi) + '</div>' +
      (compact ? '' : '<dl><dt>' + esc(P.yieldL) + '</dt><dd>' + nf(s.yieldTHa, 1) + ' t/ha</dd><dt>' + esc(P.priceL) + '</dt><dd>' + nf(s.price, 0) + ' FCFA/kg</dd><dt>' + esc(P.soldL) + '</dt><dd>' + fmtQty(s.soldKg, 'kg') + '</dd><dt>' + esc(P.revenueL) + '</dt><dd>' + fmtCur(s.revenue) + '</dd><dt>' + esc(P.costsL) + '</dt><dd>' + fmtCur(s.costs) + '</dd></dl><p class="small faint">' + esc(P.scen[k][1]) + '</p>') + '</div>';
  }).join('') + '</div>';
}

function unpricedNote(r) {
  if (!r.unpriced || !r.unpriced.length) return '';
  const names = r.unpriced.map(k => tl((KB.items[k] || KB.services[k] || {}).label) || k);
  return '<p class="small notice" style="margin-top:12px">' + esc(L().planner.unpricedNote(names.join(', '))) + '</p>';
}

function tabReturn(r) {
  const P = L().planner, sc = r.scenarios;
  if (!r.priceSource) {
    const be = r.breakEven;
    return '<div class="card"><div class="blk-t"><h4>' + esc(P.breakEvenT) + '</h4></div><dl class="kv2"><dt>' + esc(P.bePrice) + '</dt><dd>' + (be.priceXafKg ? nf(be.priceXafKg, 0) + ' FCFA/kg' : '·') + '</dd><dt>' + esc(P.yieldL) + '</dt><dd>' + nf(sc.average.yieldTHa, 1) + ' t/ha</dd></dl><p class="small faint" style="margin-top:10px">' + esc(P.enterPrice) + '</p></div>';
  }
  const max = Math.max(...Object.values(sc).map(s => Math.abs(s.margin)), 1);
  const W = 640, H = 210, X0 = 150, mid = X0 + (W - X0 - 20) / 2, half = (W - X0 - 20) / 2;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(P.chartMargins) + '"><line x1="' + mid + '" x2="' + mid + '" y1="6" y2="' + (H - 18) + '" stroke="#CED8E4"/>';
  ['good', 'average', 'poor', 'failure'].forEach((k, i) => {
    const s = sc[k], y = 14 + i * 46, w = Math.abs(s.margin) / max * half, x = s.margin >= 0 ? mid : mid - w;
    svg += '<text x="0" y="' + (y + 16) + '" font-size="12.5" fill="#3D5169">' + esc(P.scen[k][0]) + '</text><rect class="grow" data-tip="' + esc(P.scen[k][0] + ' · ' + fmtCur(s.margin).replace(/<[^>]+>/g, '')) + '" x="' + x + '" y="' + y + '" width="' + Math.max(2, w) + '" height="24" rx="4" fill="' + (s.margin >= 0 ? '#17794D' : '#B23A2A') + '" opacity="' + (k === 'average' ? 1 : .75) + '"/>';
  });
  svg += '<text x="' + mid + '" y="' + (H - 4) + '" font-size="10.5" text-anchor="middle" fill="#66788E" font-family="IBM Plex Mono, monospace">0</text></svg>';
  const be = r.breakEven;
  return scenarioCards(r) +
    '<div class="g2" style="margin-top:12px"><div class="card"><div class="blk-t"><h4>' + esc(P.chartMargins) + '</h4><span>' + esc(P.perSeason) + '</span></div><div class="chart-box nomin" data-ptips>' + svg + '</div></div>' +
    '<div class="card"><div class="blk-t"><h4>' + esc(P.breakEvenT) + '</h4></div><dl class="kv2"><dt>' + esc(P.beYield) + '</dt><dd>' + (be.yieldTHa ? nf(be.yieldTHa, 1) + ' t/ha' : '·') + '</dd><dt>' + esc(P.bePrice) + '</dt><dd>' + (be.priceXafKg ? nf(be.priceXafKg, 0) + ' FCFA/kg' : '·') + '</dd><dt>' + esc(P.expected) + '</dt><dd>' + fmtCur(r.expectedMargin) + '</dd></dl><p class="small faint" style="margin-top:10px">' + esc(P.expectedNote) + '</p></div></div>' +
    '<p class="notice" style="margin-top:14px">' + P.scenNote + '</p>';
}

function tabBudget(r) {
  const P = L().planner, B = r.budget;
  const groups = {};
  B.lines.forEach(l => { const g = l.upfront ? 'equipment' : l.cat; (groups[g] = groups[g] || []).push(l); });
  const order = ['land', 'land_preparation', 'seed', 'nursery', 'fertilizer', 'amendment', 'foliar', 'fungicide', 'insecticide', 'herbicide', 'stakes', 'trellis', 'irrigation', 'labour', 'advice', 'harvest', 'equipment'];
  const keys = Object.keys(groups).sort((a, b) => (order.indexOf(a) + 99 * (order.indexOf(a) < 0)) - (order.indexOf(b) + 99 * (order.indexOf(b) < 0)));
  const totals = keys.map(k => [k, groups[k].reduce((a, l) => a + l.total, 0)]).concat([['reserve', B.reserve]]);
  const colors = ['#0B2E59', '#17794D', '#1F5FAD', '#A87A1E', '#3E9B6C', '#3B7DD8', '#D2A84A', '#0F5F3C', '#8DB9E8', '#6E8BAA', '#9BD0B3', '#46607F', '#C7893A', '#B9C9DA', '#5E7C6B', '#2C5F8F', '#E3CB8C', '#7A8BA0'];
  const tot = B.total || 1;
  const bar = '<div class="split" role="img" aria-label="' + esc(P.tabs.budget) + '">' + totals.map(([k, v], i) => '<span style="width:' + (v / tot * 100).toFixed(2) + '%;background:' + colors[i % colors.length] + '" title="' + esc(P.cats[k] || k) + '"></span>').join('') + '</div>' +
    '<div class="split-legend">' + totals.map(([k, v], i) => '<div><span><i style="background:' + colors[i % colors.length] + '"></i>' + esc(P.cats[k] || k) + '</span><b>' + fmtCur(v) + ' <em>' + nf(v / tot * 100, 0) + '%</em></b></div>').join('') + '</div>';
  const rows = keys.map(k => '<tr class="grp"><td colspan="4">' + esc(P.cats[k] || k) + '</td><td class="tnum">' + fmtCur(groups[k].reduce((a, l) => a + l.total, 0)) + '</td></tr>' +
    groups[k].map(l => '<tr><td>' + esc(tl(l.label)) + (l.upfront && l.lifeSeasons > 1 ? ' <span class="faint small">· ' + esc(P.lifeSeasons(l.lifeSeasons)) + '</span>' : '') + '</td><td class="tnum">' + fmtQty(l.qty, l.unit) + '</td><td class="tnum">' + (l.unpriced ? '<span class="badge demo">' + esc(P.toQuote) + '</span>' : nf(l.price, l.price < 10 ? 1 : 0)) + '</td><td class="small faint">' + srcLinks(l.src) + '</td><td class="tnum">' + (l.unpriced ? '·' : fmtCur(l.total)) + '</td></tr>').join('')).join('') +
    '<tr class="grp"><td colspan="4">' + esc(P.cats.reserve) + '</td><td class="tnum">' + fmtCur(B.reserve) + '</td></tr><tr class="tot"><td colspan="4">' + esc(P.totalBudget) + '</td><td class="tnum">' + fmtCur(B.total) + '</td></tr>';
  return '<div class="card" style="padding:18px">' + bar + '</div>' + unpricedNote(r) + '<div class="tbl-wrap" style="margin-top:12px"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.line) + '</th><th>' + esc(P.th.qty) + '</th><th>' + esc(P.th.unitPrice) + '</th><th>' + esc(P.th.src) + '</th><th>' + esc(P.th.total) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div><p class="small faint" style="margin-top:10px">' + esc(P.budgetNote) + '</p>';
}

function tabItinerary(r) {
  const P = L().planner, phases = {};
  r.itinerary.forEach(s => { (phases[s.phase] = phases[s.phase] || []).push(s); });
  return '<div class="itin">' + Object.keys(phases).map(ph => '<section><h5>' + esc(tl(KB.phases[ph])) + '</h5>' + phases[ph].map(s => '<article class="it"><div class="it-d mono">' + esc(fmtDateS(s.from) + (s.to - s.from > 864e5 ? ' → ' + fmtDateS(s.to) : '')) + '</div><div><h6>' + esc(tl(s.label)) + '</h6><p>' + esc(tl(s.detail)) + '</p>' +
    (s.inputs.length ? '<ul class="it-in">' + s.inputs.map(i => '<li><span>' + esc(tl(i.label)) + (i.apps > 1 ? ' <span class="faint">· ' + esc(P.apps(i.apps)) + '</span>' : '') + '</span><b class="tnum">' + fmtQty(i.qty, i.unit) + '</b></li>').join('') + '</ul>' : '') +
    (s.labourDays ? '<p class="small faint">' + esc(P.labourDays(nf(s.labourDays, s.labourDays < 10 ? 1 : 0))) + '</p>' : '') + '<p class="small faint">' + srcLinks(s.src) + '</p></div></article>').join('') + '</section>').join('') + '</div>';
}

function tabShopping(r) {
  const P = L().planner;
  const rows = r.shopping.sort((a, b) => a.category.localeCompare(b.category)).map(s => '<tr><td>' + esc(tl(s.label)) + '</td><td class="small faint">' + esc(P.cats[s.category] || s.category) + '</td><td class="tnum">' + fmtQty(s.qty, s.unit) + '</td><td class="tnum">' + (s.packs ? s.packs + ' × ' + esc(tl(s.packLabel)) : '·') + '</td><td class="tnum">' + (s.unpriced ? '<span class="badge demo">' + esc(P.toQuote) + '</span>' : fmtCur(s.packCost || s.cost)) + '</td></tr>').join('');
  const up = r.budget.lines.filter(l => l.upfront).map(l => '<tr><td>' + esc(tl(l.label)) + '</td><td class="small faint">' + esc(P.cats.equipment) + '</td><td class="tnum">' + fmtQty(l.qty, l.unit) + '</td><td class="tnum">·</td><td class="tnum">' + (l.unpriced ? '<span class="badge demo">' + esc(P.toQuote) + '</span>' : fmtCur(l.total)) + '</td></tr>').join('');
  return '<div class="tbl-wrap"><table class="tbl ptbl"><thead><tr><th>' + esc(P.th.item) + '</th><th>' + esc(P.th.cat) + '</th><th>' + esc(P.th.need) + '</th><th>' + esc(P.th.packs) + '</th><th>' + esc(P.th.cost) + '</th></tr></thead><tbody>' + rows + up + '</tbody></table></div><p class="small faint" style="margin-top:10px">' + esc(P.shopNote) + '</p>';
}

function tabWater(r) {
  const P = L().planner, wb = r.water.balance, lv = LV();
  const rows = wb.rows, W = 640, H = 200, X0 = 40, X1 = W - 10, max = Math.max(...rows.map(x => Math.max(x.etc, x.peff)), 1), bw = (X1 - X0) / rows.length;
  let svg = '<svg viewBox="0 0 ' + W + ' ' + (H + 26) + '" role="img" aria-label="' + esc(P.waterChart) + '">';
  [0, 0.5, 1].forEach(f => { const y = H - f * (H - 10); svg += '<line x1="' + X0 + '" x2="' + X1 + '" y1="' + y + '" y2="' + y + '" stroke="#E2E8F0"/><text x="' + (X0 - 6) + '" y="' + (y + 4) + '" font-size="10" text-anchor="end" fill="#66788E" font-family="IBM Plex Mono, monospace">' + nf(max * f, 0) + '</text>'; });
  rows.forEach((x, i) => {
    const xe = X0 + i * bw + bw * 0.12, w = bw * 0.36, he = x.etc / max * (H - 10), hp = x.peff / max * (H - 10);
    svg += '<rect data-tip="' + esc(monthName(x.month) + ' · ETc ' + nf(x.etc, 0) + ' mm · ' + P.rainEff + ' ' + nf(x.peff, 0) + ' mm · ' + P.deficit + ' ' + nf(x.deficit, 0) + ' mm') + '" x="' + xe + '" y="' + (H - he) + '" width="' + w + '" height="' + he + '" fill="#17794D" rx="2"/><rect x="' + (xe + w + 2) + '" y="' + (H - hp) + '" width="' + w + '" height="' + hp + '" fill="#1F5FAD" opacity=".75" rx="2"/>' +
      '<text x="' + (X0 + i * bw + bw / 2) + '" y="' + (H + 16) + '" font-size="10.5" text-anchor="middle" fill="#66788E" font-family="IBM Plex Mono, monospace">' + esc(monthName(x.month, 'short')) + '</text>';
  });
  svg += '</svg>';
  const rk = r.risk, item = (k, lvl, text) => '<div class="rk lv' + lvl + '"><div class="rk-h"><span>' + esc(P.riskNames[k]) + '</span><b>' + esc(lv[lvl]) + '</b></div><p>' + esc(text) + '</p></div>';
  const months = (arr) => arr.map(m => monthName(m, 'short')).join(', ');
  const risks = '<div class="rks">' +
    item('water', rk.water, P.riskText.water(nf(r.water.coverage * 100, 0), nf(wb.deficit, 0), r.input.water)) +
    item('heat', rk.heat, P.riskText.heat(months(rk.flowerMonths), nf(rk.tmaxFlower, 0), KB.crops[PLAN.crop].heat_c)) +
    item('disease', rk.disease, P.riskText.disease(nf(rk.wetRain, 0), tl(KB.crops[PLAN.crop].disease_note))) +
    item('market', rk.market, P.riskText.market(months(rk.harvestMonths), nf(rk.priceIndex * 100, 0))) +
    '<div class="rk"><div class="rk-h"><span>' + esc(P.riskNames.context) + '</span><b>' + esc(P.check) + '</b></div><p>' + esc(P.riskText.context) + '</p></div></div>';
  const win = '<div class="wins" role="group" aria-label="' + esc(P.windowsT) + '">' + r.windows.map(w => '<button type="button" data-pwin="' + w.month + '" class="win lv' + Math.min(2, Math.floor(w.risk.score / 2)) + (w.month === r.bestMonth ? ' best' : '') + (new Date(PLAN.start + 'T00:00:00Z').getUTCMonth() === w.month ? ' cur' : '') + '" title="' + esc(monthName(w.month) + ' · ' + P.riskScore + ' ' + w.risk.score + '/8') + '"><span>' + esc(monthName(w.month, 'short')) + '</span><small>' + w.risk.score + '</small></button>').join('') + '</div><p class="small muted" style="margin-top:8px">' + esc(P.bestLine(monthName(r.bestMonth))) + '</p>';
  const wl = r.water.grossM3 > 0 ? '<p class="small muted">' + esc(P.waterVolume(nf(r.water.grossM3, 0), nf(r.water.balance.deficit, 0))) + '</p>' : '';
  return '<div class="card"><div class="blk-t"><h4>' + esc(P.waterChart) + '</h4><span>' + esc(P.waterSub) + '</span></div><div class="chart-box nomin" data-ptips>' + svg + '</div><div class="risk-legend"><span><i style="background:#17794D"></i>' + esc(P.cropNeed) + '</span><span><i style="background:#1F5FAD"></i>' + esc(P.rainEff) + '</span></div>' + wl + '</div>' +
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

function plannerRender(root, compact) {
  const out = $('[data-pout]', root);
  if (!out) return;
  let r;
  try { r = AFEngine.plan(KB, Object.assign({}, PLAN, { capital: PLAN.capital, priceXafKg: plPrice() })); }
  catch (e) { out.innerHTML = '<p class="notice">' + esc(L().planner.engineError) + '</p>'; return; }
  out.innerHTML = plannerOutHTML(r, compact);
  $$('[data-ptips]', out).forEach(b => bindTips(b));
  $$('.chart-box .grow', out).forEach(() => {});
}

function plannerMount(root, compact) {
  const form = $('[data-planner]', root); if (!form) return () => {};
  let t = 0;
  const parseAmt = v => { const s = String(v).replace(/[^\d.,]/g, '').replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.'); return Math.max(0, Math.min(1e12, parseFloat(s) || 0)); };
  const changed = () => { plannerRender(root, compact); clearTimeout(t); t = setTimeout(() => analytics.track('planner_run', { crop: PLAN.crop, water: PLAN.water, mode: PLAN.mode, cur: PLAN.currency }), 900); };
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
    else if (id === 'pl-price') { const v = parseAmt(e.target.value); PLAN.prices[PLAN.crop] = v > 0 ? v : null; }
    else if (e.target.name === 'pwater') PLAN.water = e.target.value;
    changed();
  });
  form.addEventListener('change', e => { if (e.target.id === 'pl-cap') e.target.value = nf(PLAN.capital); if (e.target.id === 'pl-price') e.target.value = plPrice() ? nf(plPrice()) : ''; });
  form.addEventListener('click', e => {
    const m = e.target.closest('[data-pmode]'), c = e.target.closest('[data-pcrop]');
    if (m) { PLAN.mode = m.dataset.pmode; $$('[data-pmode]', form).forEach(b => b.setAttribute('aria-pressed', String(b === m))); const a = $('[data-parea]', form); if (a) a.hidden = PLAN.mode !== 'crop'; changed(); }
    if (c) {
      PLAN.crop = c.dataset.pcrop; $$('[data-pcrop]', form).forEach(b => b.setAttribute('aria-pressed', String(b === c)));
      const pi = $('#pl-price', form), ph = $('[data-phint]', form), ref = KB.crops[PLAN.crop].price.reference_xaf_kg;
      if (pi) { pi.value = plPrice() ? nf(plPrice()) : ''; pi.placeholder = ref ? nf(ref) : L().planner.pricePh; }
      if (ph) ph.textContent = priceHint(PLAN.crop);
      changed();
    }
  });
  const adv = $('details.adv', form); if (adv) adv.addEventListener('toggle', () => { PLAN.advOpen = adv.open; });
  const out = $('[data-pout]', root);
  out.addEventListener('click', e => {
    const tb = e.target.closest('[data-ptab]');
    if (tb) { PLAN.tab = tb.dataset.ptab; plannerRender(root, compact); const nb = $('[data-ptab="' + PLAN.tab + '"]', out); if (nb) nb.focus(); analytics.track('planner_tab', { tab: PLAN.tab }); return; }
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
