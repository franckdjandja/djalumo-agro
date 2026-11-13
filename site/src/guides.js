/* ---------- Crop guides: a hub and one page per crop, from the figures computed at build time (GUIDES) ---------- */
const GUIDE_IDS = typeof GUIDES !== 'undefined' ? Object.keys(GUIDES) : [];
/* Amounts of a budget are rounded to the thousand, prices are kept to the franc. */
const gFcfa = (v) => nf(Math.round(v), 0) + (LANG === 'fr' ? ' FCFA' : ' FCFA');
const gAmt = (v) => gFcfa(Math.abs(v) >= 1e4 ? Math.round(v / 1000) * 1000 : v);
const gUsd = (v) => money(v / KB.fx.XAF, 'USD');
const gPct = (v) => nf(v * 100, 0) + (LANG === 'fr' ? ' %' : '%');
const gShare = (v) => (v > 0 && v < 0.005 ? (LANG === 'fr' ? '<\u00a01\u00a0%' : '<1%') : gPct(v));
const gSigned = (v) => (v > 0 ? '+' : '') + gPct(v);
const gUnit = (g) => (g.unit ? tl(g.unit) : 'kg');
const gName = (id) => tl(KB.crops[id].name);
const gHref = (id) => '#crops/' + id;
const gFirst = (g) => (g.season ? L().planner.when(Math.max(1, Math.round(g.firstDays / 30.4))) : L().planner.when(g.firstMonths));

function guideHub() {
  const G = L().guides, H = G.hub;
  const card = (id) => {
    const g = GUIDES[id];
    return '<a class="card gcard" href="' + gHref(id) + '"><h3>' + esc(gName(id)) + '</h3>' +
      '<dl class="gdl"><dt>' + esc(g.season ? H.budget : H.capital) + '</dt><dd class="tnum">' + gAmt(g.cost) + '</dd>' +
      '<dt>' + esc(H.first) + '</dt><dd>' + esc(gFirst(g)) + '</dd></dl><span class="glink">' + esc(H.read) + ARROW + '</span></a>';
  };
  return pageHero('', H.h1, H.lead) +
    ['season', 'long', 'orchard'].map((grp) => sec(head('', H.groups[grp]) + '<div class="g3 rv">' + GUIDE_IDS.filter((id) => GUIDES[id].group === grp).map(card).join('') + '</div>')).join('') +
    sec(head('', H.assumH) + '<div class="prose rv">' + H.assum.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>');
}

function guidePage(id) {
  const G = L().guides, K = G.k, g = GUIDES[id], C = G.crops[id], P = L().planner;
  const name = gName(id), unit = gUnit(g);
  const crumbs = '<nav class="crumbs small" aria-label="' + esc(G.crumb) + '"><a href="#crops">' + esc(G.crumb) + '</a><span aria-hidden="true"> · </span><span aria-current="page">' + esc(name) + '</span></nav>';
  const hero = '<section class="page-hero"><div class="wrap" style="position:relative">' + crumbs + '<h1 class="display" tabindex="-1">' + esc(C.h1) + '</h1><p class="lead">' + esc(C.intro) + '</p></div></section>';

  const ys = g.yields, y0 = ys.reduce((a, y) => (y.average > a.average ? y : a), ys[0]);
  const kpi = (k, v, s) => '<div><div class="k">' + esc(k) + '</div><div class="v vsm">' + v + '</div><div class="s">' + esc(s) + '</div></div>';
  const kpis = '<div class="kpis kpis4 gkpis rv">' +
    kpi(g.season ? K.budget : K.capital, gAmt(g.cost), G.usd(gUsd(g.cost)) + ' · ' + (g.season ? K.budgetSub : K.capitalSub(durLabel(g.horizon)))) +
    kpi(K.yield, nf(g.season ? g.refYield : y0.average, 1) + '<small> t/ha</small>', g.season ? K.yieldRef(monthLow(g.bestMonth)) : g.group === 'orchard' ? K.yieldMature : K.yieldSub) +
    kpi(K.be, gFcfa(g.be), K.beSub(unit)) +
    kpi(K.first, esc(gFirst(g)), g.season ? K.firstSeason : K.firstLong) + '</div>';

  const water = G.water[g.water.option], month = monthLow(g.bestMonth);
  const cats = g.cats.map(([k, v]) => ['<b>' + esc(P.cats[k] || k) + '</b>', '<span class="tnum">' + gAmt(v) + '</span>', '<span class="tnum">' + gShare(v / g.cost) + '</span>']);
  if (g.season && g.reserve) cats.push(['<b>' + esc(G.reserve) + '</b>', '<span class="tnum">' + gAmt(g.reserve) + '</span>', '<span class="tnum">' + gShare(g.reserve / g.cost) + '</span>']);
  cats.push(['<b>' + esc(G.total) + '</b>', '<b class="tnum">' + gAmt(g.cost) + '</b>', '']);
  const sum = g.cats.reduce((a, c) => a + c[1], 0);
  const longRows = g.cats.map(([k, v]) => ['<b>' + esc(P.cats[k] || k) + '</b>', '<span class="tnum">' + gAmt(v) + '</span>', '<span class="tnum">' + gShare(v / sum) + '</span>']).concat([['<b>' + esc(G.total) + '</b>', '<b class="tnum">' + gAmt(sum) + '</b>', '']]);
  const cost = sec(head('', g.season ? G.costH : G.costHLong(durLabel(g.horizon)), g.season ? G.costLead(water, month) : G.costLeadLong(water, month, durLabel(g.horizon))) + table(G.cols, g.season ? cats : longRows, 'gtbl'));

  const when = (s) => {
    if (s.to < 0) return g.season ? G.before : G.beforeLong;
    if (g.season) return G.weeks(Math.max(1, Math.floor(s.from / 7) + 1), Math.max(1, Math.ceil(s.to / 7)));
    // Tree crops run over ten years: their recurring work reads better in years.
    if (g.horizon > 36) return G.years(Math.max(1, Math.floor(s.from / 365) + 1), Math.min(Math.round(g.horizon / 12), Math.max(1, Math.ceil(s.to / 365))));
    return G.months(Math.max(1, Math.floor(s.from / 30.4) + 1), Math.min(g.horizon, Math.max(1, Math.ceil(s.to / 30.4))));
  };
  const cal = sec(head('', G.calH, g.season ? G.calLead : G.calLeadLong) + table(G.calCols, g.steps.map((s) => ['<b>' + esc(tl(s.label)) + '</b>', esc(when(s))]), 'gtbl'));

  const yrows = ys.map((y) => '<li><span><b>' + esc(y.k === 'wet' ? G.wet : y.k === 'dry' ? G.dry : y.k === 'mature' ? G.mature : y.k === 'cycle' ? G.cycle : G.any) + '</b> · ' + esc(G.range(nf(y.poor, 1), nf(y.average, 1), nf(y.good, 1))) + '</span></li>').join('');
  const priceTxt = g.price ? tl(g.price) : '';
  const yieldSec = sec(head('', G.yieldH) + '<div class="prose rv"><ul class="list-check">' + yrows + '</ul>' +
    (g.refPrice ? '<p>' + esc(priceTxt) + '</p>' + (g.margin ? '<p>' + esc(G.margin(gAmt(g.margin.margin), gSigned(g.margin.roi))) + '</p>' : '')
      : '<p>' + esc(G.noSeries + (priceTxt ? ' ' + priceTxt : '')) + '</p>') +
    '<p>' + esc(G.beLine(gFcfa(g.be), unit)) + '</p></div>');

  const w = g.water, waterTxt = g.season && w.need ? G.waterNeed(nf(w.need, 0), nf(w.rain, 0)) + (w.m3 > 0 ? G.waterPump(nf(w.m3, 0)) : g.water.option === 'pump' ? G.waterCoveredPump : G.waterCovered) : '';
  const risk = sec(head('', G.riskH) + '<div class="prose rv">' + (waterTxt ? '<p>' + esc(waterTxt) + '</p>' : '') + '<p>' + esc(G.best(month)) + (g.heat ? ' ' + esc(G.heat(g.heat)) : '') + '</p>' +
    '<p>' + esc(tl(g.disease)) + '</p>' + (g.harvestDetail ? '<p>' + esc(tl(g.harvestDetail)) + '</p>' : '') + '</div>');

  const srcs = g.sources.map((k) => { const s = KB.sources[k]; return '<li><span class="mono faint">[' + esc(k) + ']</span> ' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>' : esc(s.title)) + (s.publisher ? ' · ' + esc(s.publisher) : '') + (s.year ? ', ' + esc(s.year) : '') + '</li>'; }).join('');
  const sources = sec(head('', G.srcH) + '<ul class="gsrc small rv">' + srcs + '</ul><div class="notice rv" style="margin-top:18px"><b>' + esc(G.methodH) + '.</b> ' + esc(G.method(fmtBuilt())) + '</div>');

  const plan = PATH_MODE ? pathOf('planner') + '?crop=' + id : '#planner';
  const cta = sec('<div class="cta-band rv"><div><h2 class="h2" style="max-width:20ch">' + esc(g.season ? G.ctaH : G.ctaHLong) + '</h2><p class="lead" style="margin-top:16px">' + esc(G.ctaLead) + '</p></div><div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><a class="btn btn-primary" href="' + esc(plan) + '" data-gcrop="' + id + '">' + esc(G.cta) + ARROW + '</a></div></div>');
  const related = sec(head('', G.related) + '<div class="gchips rv">' + GUIDE_IDS.filter((x) => x !== id).map((x) => '<a class="gchip" href="' + gHref(x) + '">' + esc(gName(x)) + '</a>').join('') + '</div>');
  return hero + sec(kpis) + cost + cal + yieldSec + risk + cta + sources + related;
}

const fmtBuilt = () => new Intl.DateTimeFormat(L().meta.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(KB.built + 'T00:00:00Z'));

/** The pages added to the router: the hub at crops and each guide at crops/<crop>. */
function guidePages() {
  const pages = { crops: { html: guideHub } };
  GUIDE_IDS.forEach((id) => {
    pages['crops/' + id] = {
      html: () => guidePage(id),
      mount(root) { $$('[data-gcrop]', root).forEach((a) => a.addEventListener('click', () => { PLAN.crop = a.dataset.gcrop; })); }
    };
  });
  return pages;
}
