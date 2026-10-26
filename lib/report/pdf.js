// Premium PDF report of a simulator plan (A4, English or French).
// The plan is recomputed on the server from the stored settings with the same engine and data as the website.
import PDFDocument from 'pdfkit';
import { drawLogo } from './logo.js';
import { loadSite, tr } from './site.js';
import { formatter } from './format.js';
import { T } from './strings.js';

const FONT_FILES = { R: 'Manrope-Regular.ttf', M: 'Manrope-Medium.ttf', SB: 'Manrope-SemiBold.ttf', B: 'Manrope-Bold.ttf', XB: 'Manrope-ExtraBold.ttf' };
const C = {
  ink: '#1F2A24', deep: '#0A3D2E', green: '#127A5B', green2: '#0D5C44', mint: '#DDF2E7', soft: '#EEF4F0', soft2: '#F6F9F7', line: '#D8E3DC',
  muted: '#5B6F65', faint: '#8B9A93', gold: '#B0832A', goldSoft: '#F6EEDB', red: '#B0402D', redSoft: '#F7E2DC', amber: '#C7893A', teal: '#2B7A8F', white: '#FFFFFF'
};
const PAGE = { w: 595.28, h: 841.89, l: 56, r: 56, top: 92, bottom: 70 };
const W = PAGE.w - PAGE.l - PAGE.r;
const LEVEL_COL = [[C.green2, C.mint], ['#86621A', C.goldSoft], [C.red, C.redSoft]];
const CAT_ORDER = ['land', 'land_preparation', 'machinery', 'planting', 'seed', 'nursery', 'fertilizer', 'amendment', 'foliar', 'fungicide', 'insecticide', 'herbicide', 'stakes', 'trellis', 'irrigation', 'labour', 'advice', 'harvest', 'processing', 'structure', 'equipment'];

/**
 * Builds the report. input: simulator settings (same shape as the website), request: { name, profile, place },
 * lang: 'en' | 'fr', ref: report number, issued: Date. Returns { buffer, plan, pages }.
 */
export async function buildReportPdf({ input, request, lang = 'fr', ref, issued = new Date() }) {
  const { engine, kb, I18N } = loadSite();
  const r = engine.plan(kb, input);
  const t = T[lang], S = I18N[lang].planner, f = formatter(lang, input.currency, kb.fx);
  const L = (x) => tr(x, lang);
  const crop = kb.crops[input.crop];
  const long = r.profile && r.profile !== 'season';
  const prod = r.product || null;
  const unit = prod && prod.unitLabel ? L(prod.unitLabel) : 'kg';
  const unitKg = (prod && prod.unitKg) || 1;
  const priced = !!r.priceSource;
  const sc = r.scenarios, cf = r.cashflow;
  const cropName = L(crop.name);
  const multiProduct = crop.products && Object.keys(crop.products).length > 1;
  const name = request.name;

  const doc = new PDFDocument({
    size: 'A4', autoFirstPage: false, bufferPages: true, font: new URL('./fonts/' + FONT_FILES.R, import.meta.url).pathname, margins: { top: PAGE.top, bottom: PAGE.bottom, left: PAGE.l, right: PAGE.r },
    lang: lang === 'fr' ? 'fr-FR' : 'en-US', displayTitle: true, pdfVersion: '1.7',
    info: { Title: t.kicker + ' · ' + cropName + ' · ' + ref, Author: 'Djalumo Agro', Subject: t.kicker, Keywords: 'Djalumo Agro, ' + cropName, Creator: 'Djalumo Agro', Producer: 'Djalumo Agro' }
  });
  for (const [k, file] of Object.entries(FONT_FILES)) doc.registerFont(k, new URL('./fonts/' + file, import.meta.url).pathname);
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => { doc.on('end', resolve); doc.on('error', reject); });

  // ---------- primitives ----------
  const maxY = () => PAGE.h - PAGE.bottom;
  let cover = true;
  doc.on('pageAdded', () => {
    if (cover) return;
    const x = doc.x, y = doc.y;
    drawLogo(doc, PAGE.l, 36, 92);
    doc.font('M').fontSize(7.4).fillColor(C.faint).text(t.headerTitle.toUpperCase(), PAGE.l, 37, { width: W, align: 'right', characterSpacing: 0.9, lineBreak: false });
    doc.font('SB').fontSize(7.8).fillColor(C.muted).text(t.reportNo + ' ' + ref, PAGE.l, 49, { width: W, align: 'right', lineBreak: false });
    doc.moveTo(PAGE.l, 66).lineTo(PAGE.l + W, 66).lineWidth(0.6).strokeColor(C.line).stroke();
    doc.x = x; doc.y = y;
  });
  const newPage = () => { doc.addPage(); doc.x = PAGE.l; doc.y = PAGE.top; };
  const ensure = (h) => { if (doc.y + h > maxY()) newPage(); };
  const gap = (h) => { doc.y += h; };
  const para = (text, o = {}) => {
    doc.font(o.font || 'R').fontSize(o.size || 9.6).fillColor(o.color || C.ink);
    const h = doc.heightOfString(text, { width: o.width || W, lineGap: o.lineGap ?? 3 });
    if (o.keep !== false) ensure(Math.min(h, 60));
    doc.text(text, o.x ?? PAGE.l, doc.y, { width: o.width || W, lineGap: o.lineGap ?? 3, align: o.align || 'left' });
    doc.x = PAGE.l;
    if (o.after !== 0) gap(o.after ?? 8);
  };
  const bullets = (items, o = {}) => {
    items.forEach((it) => {
      doc.font('R').fontSize(o.size || 9.6);
      const h = doc.heightOfString(it, { width: W - 16, lineGap: 3 });
      ensure(h + 4);
      const y = doc.y;
      doc.circle(PAGE.l + 3.2, y + 5.6, 2.1).fill(o.dot || C.green);
      doc.fillColor(C.ink).text(it, PAGE.l + 16, y, { width: W - 16, lineGap: 3 });
      doc.x = PAGE.l; gap(o.after ?? 5);
    });
  };
  let secN = 0;
  const section = (title, o = {}) => {
    if (o.page === 'auto' ? doc.y > PAGE.h * 0.52 : o.page !== false) newPage(); else { ensure(140); if (doc.y > PAGE.top + 4) gap(18); }
    secN += 1;
    doc.font('SB').fontSize(8).fillColor(C.gold).text(String(secN).padStart(2, '0'), PAGE.l, doc.y, { characterSpacing: 1.2, lineBreak: false });
    gap(13);
    doc.font('XB').fontSize(19).fillColor(C.deep).text(title, PAGE.l, doc.y, { width: W });
    gap(4);
    doc.moveTo(PAGE.l, doc.y).lineTo(PAGE.l + 36, doc.y).lineWidth(1.6).strokeColor(C.gold).stroke();
    gap(14);
  };
  const subTitle = (title) => { ensure(60); doc.font('B').fontSize(11.5).fillColor(C.deep).text(title, PAGE.l, doc.y, { width: W }); gap(6); };

  /** Tables with repeated headers across pages. cols: [{ h, w (share of width), a: 'left' | 'right' }]. */
  const table = (cols, rows, o = {}) => {
    const fs = o.fs || 8.4, px = 6, py = 5, ws = cols.map((c) => c.w * W);
    const cell = (c) => (c && typeof c === 'object' ? c : { t: c == null ? '' : String(c) });
    const cellH = (c, w, kind, a) => {
      const v = Object.assign({ num: a === 'right' }, cell(c));
      doc.font(v.font || (kind === 'group' || kind === 'total' ? 'SB' : 'R')).fontSize(v.size || fs);
      let h = v.t ? doc.heightOfString(v.t, Object.assign({ width: w - 2 * px, lineGap: 1.6 }, v.num ? { features: ['tnum'] } : {})) : 0;
      if (v.sub) { doc.font('R').fontSize(fs - 1.2); h += 2 + doc.heightOfString(v.sub, { width: w - 2 * px, lineGap: 1.4 }); }
      if (v.pill) h = Math.max(h, 13);
      return h;
    };
    const headH = () => { doc.font('SB').fontSize(7.4); return Math.max(...cols.map((c, i) => doc.heightOfString(c.h, { width: ws[i] - 2 * px }))) + 2 * py + 1; };
    const drawHead = () => {
      const h = headH(), y = doc.y;
      doc.rect(PAGE.l, y, W, h).fill(C.soft);
      let x = PAGE.l;
      cols.forEach((c, i) => { doc.font('SB').fontSize(7.4).fillColor(C.muted).text(c.h, x + px, y + py + 0.5, { width: ws[i] - 2 * px, align: c.a || 'left', characterSpacing: 0.2 }); x += ws[i]; });
      doc.y = y + h;
    };
    const first = rows.length ? Math.max(...rows[0].cells.map((c, i) => cellH(c, ws[i], rows[0].kind, cols[i].a))) + 2 * py : 0;
    ensure(headH() + first + 4);
    if (o.head !== false) drawHead();
    rows.forEach((row) => {
      const h = Math.max(...row.cells.map((c, i) => cellH(c, ws[i], row.kind, (cell(c).a || cols[i].a)))) + 2 * py;
      if (doc.y + h > maxY()) { newPage(); if (o.head !== false) drawHead(); }
      const y = doc.y;
      if (row.kind === 'group') doc.rect(PAGE.l, y, W, h).fill(C.soft2);
      if (row.kind === 'total') doc.rect(PAGE.l, y, W, h).fill(C.deep);
      if (row.kind === 'sub') doc.rect(PAGE.l, y, W, h).fill(C.soft);
      if (row.fill) doc.rect(PAGE.l, y, W, h).fill(row.fill);
      let x = PAGE.l;
      row.cells.forEach((c, i) => {
        const v = cell(c), a = v.a || cols[i].a || 'left';
        if (v.pill) {
          const [fg, bg] = LEVEL_COL[v.pill[0]];
          doc.font('SB').fontSize(7.4);
          const tw = doc.widthOfString(v.pill[1]) + 12;
          doc.roundedRect(x + px, y + py - 0.5, tw, 13, 6.5).fill(bg);
          doc.fillColor(fg).text(v.pill[1], x + px + 6, y + py + 2.4, { width: tw, lineBreak: false });
        } else {
          const color = row.kind === 'total' ? C.white : (v.color || (row.kind === 'group' ? C.deep : C.ink));
          doc.font(v.font || (row.kind === 'group' || row.kind === 'total' ? 'SB' : 'R')).fontSize(v.size || fs).fillColor(color)
            .text(v.t, x + px, y + py, Object.assign({ width: ws[i] - 2 * px, align: a, lineGap: 1.6 }, a === 'right' ? { features: ['tnum'] } : {}));
          if (v.sub) doc.font('R').fontSize(fs - 1.2).fillColor(row.kind === 'total' ? C.mint : C.muted).text(v.sub, x + px, doc.y + 2, { width: ws[i] - 2 * px, align: a, lineGap: 1.4 });
        }
        x += ws[i];
      });
      if (row.kind !== 'total') doc.moveTo(PAGE.l, y + h).lineTo(PAGE.l + W, y + h).lineWidth(0.5).strokeColor(C.line).stroke();
      doc.x = PAGE.l; doc.y = y + h;
    });
    gap(o.after ?? 10);
  };

  const tiles = (items, perRow = 3) => {
    const g = 8, tw = (W - g * (perRow - 1)) / perRow, th = 66;
    for (let i = 0; i < items.length; i += perRow) {
      ensure(th + g);
      const y = doc.y;
      items.slice(i, i + perRow).forEach((it, j) => {
        const x = PAGE.l + j * (tw + g);
        doc.roundedRect(x, y, tw, th, 7).fill(it.accent ? C.deep : C.soft2);
        doc.font('SB').fontSize(7.4).fillColor(it.accent ? '#A9D8C2' : C.muted).text(it.k.toUpperCase(), x + 11, y + 10, { width: tw - 22, characterSpacing: 0.5, lineBreak: false, ellipsis: true });
        doc.font('XB').fontSize(it.v.length > 16 ? 12.5 : 15).fillColor(it.accent ? C.white : (it.color || C.deep)).text(it.v, x + 11, y + 24, { width: tw - 22, lineBreak: false, ellipsis: true, features: ['tnum'] });
        if (it.s) doc.font('R').fontSize(7.3).fillColor(it.accent ? '#CFE7DB' : C.muted).text(it.s, x + 11, y + 45, { width: tw - 22, lineGap: 0.8, height: 18, ellipsis: true });
      });
      doc.x = PAGE.l; doc.y = y + th + g;
    }
    gap(6);
  };

  // ---------- values used in several places ----------
  const durText = (m) => (m >= 24 && m % 12 === 0 ? t.dur.years(m / 12) : t.dur.months(m));
  const planLength = long ? durText(r.horizonMonths) : t.dur.weeks(Math.round(r.calendar.totalDays / 7));
  const price = (s) => f.unit(s.price * unitKg);
  const be = long ? r.breakEven.pricePerUnit : r.breakEven.priceXafKg;
  const startMonth = new Date(input.start + 'T00:00:00Z').getUTCMonth();
  const win = (m) => r.windows.find((w) => w.month === m) || { risk: { score: 0 } };
  const bestScore = win(r.bestMonth).risk.score, curScore = win(startMonth).risk.score;
  const mPeak = cf.months.reduce((b, m, i) => (m.cum < cf.months[b].cum ? i : b), 0);
  const monthOf = (i) => { const m = cf.months[i]; return f.monthYear(m.y, m.m); };
  const capitalNeed = input.mode === 'crop' ? r.requiredXaf : r.budget.total;
  const cropPhrase = lang === 'fr'
    ? (/^[aeiouyàâéèêîôû]/i.test(cropName) ? 'd’' : 'de ') + cropName.toLowerCase()
    : (/^[aeiou]/i.test(cropName) ? 'an ' : 'a ') + cropName.toLowerCase();
  const levelName = (l) => t.levels[l];
  const whenText = (m) => (m < 24 ? t.dur.months(m) : t.dur.yearsHalf(m));
  const curName = (c) => { try { const s = new Intl.DisplayNames([lang === 'fr' ? 'fr-FR' : 'en-US'], { type: 'currency' }).of(c); return s.charAt(0).toUpperCase() + s.slice(1); } catch { return c; } };

  // ---------- 1. cover ----------
  doc.addPage({ margins: { top: 0, bottom: 0, left: 0, right: 0 } });
  doc.rect(0, 0, PAGE.w, PAGE.h).fill('#FCFBF7');
  drawLogo(doc, PAGE.l, 62, 210, { background: '#FCFBF7' });
  doc.font('SB').fontSize(9).fillColor(C.green).text(t.kicker.toUpperCase(), PAGE.l, 214, { characterSpacing: 1.8, lineBreak: false });
  doc.font('XB').fontSize(40).fillColor(C.deep).text(cropName, PAGE.l, 236, { width: W, lineGap: -4 });
  const subLine = [multiProduct && prod ? L(prod.label) : null, f.area(r.areaHa), long ? planLength : t.dur.weeks(Math.round(r.calendar.totalDays / 7))].filter(Boolean).join('   ·   ');
  doc.font('M').fontSize(12.5).fillColor(C.muted).text(subLine, PAGE.l, doc.y + 8, { width: W });
  let cy = doc.y + 26;
  doc.moveTo(PAGE.l, cy).lineTo(PAGE.l + 44, cy).lineWidth(2).strokeColor(C.gold).stroke();
  cy += 24;
  const colW = (W - 30) / 2;
  doc.font('SB').fontSize(7.6).fillColor(C.faint).text(t.preparedFor.toUpperCase(), PAGE.l, cy, { characterSpacing: 1, lineBreak: false });
  doc.font('B').fontSize(16).fillColor(C.ink).text(name, PAGE.l, cy + 14, { width: colW });
  const who = [t.profiles[request.profile] || null, request.place || null].filter(Boolean).join(', ');
  if (who) doc.font('R').fontSize(10).fillColor(C.muted).text(who, PAGE.l, doc.y + 3, { width: colW });
  const meta = [[t.reportNo, ref], [t.issued, f.date(issued)], [t.dataVersion, f.date(new Date(kb.built + 'T00:00:00Z'))]];
  let my = cy;
  meta.forEach(([k, v]) => {
    doc.font('SB').fontSize(7.6).fillColor(C.faint).text(k.toUpperCase(), PAGE.l + colW + 30, my, { characterSpacing: 1, lineBreak: false });
    doc.font('SB').fontSize(10.5).fillColor(C.ink).text(v, PAGE.l + colW + 30, my + 13, { width: colW });
    my += 38;
  });
  // band of key figures
  const bandY = 560;
  doc.rect(0, bandY, PAGE.w, PAGE.h - bandY).fill(C.deep);
  doc.rect(0, bandY, PAGE.w, 3).fill(C.gold);
  const coverFigs = [
    [t.tiles.area, f.area(r.areaHa)],
    [long || input.mode === 'crop' ? t.tiles.capital : t.tiles.budget, f.money(capitalNeed)],
    priced ? [t.tiles.margin + ' ' + (long ? t.tiles.marginPlan(planLength) : t.tiles.marginSeason), f.money(sc.average.margin)] : [t.tiles.breakEven, f.unit(be) + ' / ' + unit],
    long && priced ? [t.tiles.payback, cf.paybackIndex !== null ? f.monthYear(cf.months[cf.paybackIndex].y, cf.months[cf.paybackIndex].m) : t.tiles.never] : [long ? t.tiles.length : t.tiles.season, planLength]
  ];
  const fw = W / 2;
  coverFigs.forEach(([k, v], i) => {
    const x = PAGE.l + (i % 2) * fw, y = bandY + 44 + Math.floor(i / 2) * 74;
    doc.font('SB').fontSize(7.6).fillColor('#A9D8C2').text(k.toUpperCase(), x, y, { width: fw - 20, characterSpacing: 0.9, lineBreak: false, ellipsis: true });
    doc.font('XB').fontSize(22).fillColor(C.white).text(v, x, y + 15, { width: fw - 20, lineBreak: false, ellipsis: true, features: ['tnum'] });
  });
  doc.font('M').fontSize(11).fillColor('#E9D6A8').text(t.tagline, PAGE.l, PAGE.h - 104, { width: W, lineBreak: false });
  doc.font('R').fontSize(7.6).fillColor('#9FC3B3').text(t.confidential(name), PAGE.l, PAGE.h - 84, { width: W, lineGap: 1.5 });
  cover = false;

  // ---------- 2. summary ----------
  section(t.s.summary);
  para(t.intro({
    cropPhrase, area: f.area(r.areaHa), plants: long ? f.num(r.plants) : null, place: request.place || '', long,
    start: f.date(r.calendar.field || r.calendar.start), duration: planLength, end: f.date(r.calendar.lastHarvest), mode: input.mode,
    first: long && r.firstHarvestMonths ? { date: f.monthYear(r.calendar.firstHarvest.getUTCFullYear(), r.calendar.firstHarvest.getUTCMonth()), when: whenText(r.firstHarvestMonths) } : null,
    capital: f.money(input.mode === 'crop' ? r.requiredXaf : r.capitalXaf), product: multiProduct && prod ? L(prod.label).toLowerCase() : null
  }));
  if (priced) {
    para(t.resultPriced({ price: price(sc.average), unit, long, margin: f.money(sc.average.margin), roi: f.pct(sc.average.roi), be: be ? f.unit(be) : '·' }));
    if (long) para(t.resultCash({ peak: f.money(cf.peakNeed), peakMonth: monthOf(mPeak), payback: cf.paybackIndex !== null ? monthOf(cf.paybackIndex) : null }));
  } else {
    para(t.resultUnpriced({ be: be ? f.unit(be) : '·', unit }));
  }
  const rk = r.risk;
  const heatScored = !!(crop.heat_c && rk.flowerMonths && rk.flowerMonths.length && rk.tmaxFlower !== null);
  const riskList = [['water', rk.water], ['heat', heatScored ? rk.heat : -1], ['disease', rk.disease], ['market', rk.market]].sort((a, b) => b[1] - a[1]);
  const lc = (s) => (lang === 'fr' ? s.charAt(0).toLowerCase() + s.slice(1) : s.toLowerCase());
  para(riskList[0][1] >= 1 ? t.resultRisk({ risk: lc(S.riskNames[riskList[0][0]]), level: levelName(riskList[0][1]).toLowerCase() }) : t.resultLowRisk, { after: 14 });

  const tl = [];
  tl.push({ k: t.tiles.area, v: f.area(r.areaHa), s: t.tiles.plants(f.num(r.plants)) });
  tl.push({ k: long || input.mode === 'crop' ? t.tiles.capital : t.tiles.budget, v: f.money(capitalNeed), s: long ? t.tiles.capitalSub : t.tiles.budgetSub, accent: true });
  if (priced) tl.push({ k: t.tiles.margin, v: f.money(sc.average.margin), s: long ? t.tiles.perYear(f.money(sc.average.marginPerYear)) : t.tiles.roi(f.pct(sc.average.roi)), color: sc.average.margin >= 0 ? C.green : C.red });
  tl.push({ k: t.tiles.breakEven, v: be ? f.unit(be) : '·', s: t.perUnit(unit) + ', ' + t.tiles.breakEvenSub });
  if (long && priced) tl.push({ k: t.tiles.payback, v: cf.paybackIndex !== null ? monthOf(cf.paybackIndex) : t.tiles.never, s: cf.paybackIndex !== null ? t.tiles.paybackSub : t.tiles.neverSub });
  else tl.push({ k: long ? t.tiles.length : t.tiles.season, v: planLength, s: f.dateShort(r.calendar.start) + (lang === 'fr' ? ' au ' : ' to ') + f.dateShort(long ? new Date(r.calendar.horizonEnd - 864e5) : r.calendar.lastHarvest) });
  tl.push({ k: t.tiles.best, v: f.month(r.bestMonth), s: t.tiles.bestSub(bestScore) });
  tiles(tl);

  subTitle(t.s.outcomes);
  const scKeys = ['good', 'average', 'poor', 'failure'];
  const soldOf = (s) => (unit === 'kg' ? f.num(s.soldKg) + ' kg' : f.num(s.soldKg / unitKg) + ' ' + (Math.round(s.soldKg / unitKg) > 1 ? f.plural(unit) : unit));
  const neg = (v) => (v < 0 ? C.red : C.ink);
  const yUnit = long ? (r.profile === 'orchard' ? t.yieldUnitYear : t.yieldUnitCycle) : t.yieldUnit;
  table([
    { h: t.th.outcome, w: 0.2 }, { h: t.th.yield + ' (' + yUnit + ')', w: 0.13, a: 'right' }, { h: t.th.price + ' (' + t.perUnit(unit) + ')', w: 0.14, a: 'right' },
    { h: t.th.revenue, w: 0.18, a: 'right' }, { h: t.th.costs, w: 0.17, a: 'right' }, { h: t.th.margin, w: 0.18, a: 'right' }
  ], scKeys.map((k) => {
    const s = sc[k];
    return {
      fill: k === 'average' ? '#F3F8F5' : null,
      cells: [{ t: S.scen[k][0], font: 'SB', sub: lang === 'fr' ? 'probabilité ' + f.share(r.weights[k]) : f.share(r.weights[k]) + ' chance' }, f.num(s.yieldTHa, 1),
        priced ? f.unit(s.price * unitKg) : '·', { t: priced ? f.money(s.revenue) : '·', sub: priced ? soldOf(s) : null }, f.money(s.costs),
        { t: priced ? f.money(s.margin) : '·', font: 'SB', color: neg(s.margin), sub: priced ? t.roiSub(f.pct(s.roi)) + (long ? '\n' + t.perYearShort(f.money(s.marginPerYear)) : '') : null }]
    };
  }), { fs: 8.3 });
  para(t.outcomeNote, { size: 8, color: C.muted, lineGap: 2, after: 12 });

  subTitle(t.s.next);
  const next = [t.next.price(unit)];
  if (r.unpriced && r.unpriced.length) next.push(t.next.quotes(r.unpriced.map((k) => L((kb.items[k] || kb.services[k] || {}).label) || k).join(', ')));
  const cover0 = long ? (r.water.establishment ?? r.water.coverage) : r.water.coverage;
  if (cover0 < 0.8) next.push(t.next.water(f.share(cover0)));
  if (r.bestMonth !== startMonth && curScore - bestScore >= 1) next.push(t.next.best(f.monthLower(r.bestMonth), bestScore, curScore));
  if (long && priced) next.push(t.next.cash(f.money(cf.peakNeed), f.date(r.calendar.firstHarvest)));
  next.push(t.next.soil, t.next.inputs);
  bullets(next);

  // ---------- 3. settings ----------
  section(t.s.inputs, { page: 'auto' });
  const I = t.inputs;
  const priceRow = priced ? f.unit(sc.average.price * unitKg) + ' ' + t.perUnit(unit) + ' (' + (r.priceSource === 'user' ? I.priceUser : I.priceRef) + ')' : I.priceNone;
  const kv = [
    [I.capital, input.mode === 'crop' ? '·' : f.money(r.capitalXaf)],
    [I.mode, input.mode === 'crop' ? I.modeArea : I.modeBudget],
    input.mode === 'crop' ? [I.area, f.area(input.area)] : null,
    [I.crop, cropName + (prod && multiProduct ? ', ' + L(prod.label).toLowerCase() : '')],
    prod && prod.ratio && prod.ratio < 1 ? [I.product, I.ratio(f.num(prod.ratio * 1000) + ' kg')] : null,
    [I.price, priceRow],
    r.systems && r.systems.length > 1 ? [S.system, S.systems[r.system] + (r.cover ? ', ' + f.num(r.cover.m2) + ' m²' : '')] : null,
    r.cover ? [S.structureL, S.structureOpts[r.cover.status] + (r.cover.repairsXaf > 0 ? ', ' + f.money(r.cover.repairsXaf) : '')] : null,
    [I.water, r.water && r.water.inPlace ? t.waterOpt.existing : t.waterOpt[(r.water && r.water.option) || input.water]],
    r.fieldWork && r.fieldWork.available ? [S.fieldWork, S.fieldWorkOpts[r.fieldWork.method] + (r.fieldWork.method === 'hire' ? ', ' + f.money(r.fieldWork.hirePerHa) + ' / ha' : '')] : null,
    [long ? I.startLong : I.start, f.date(new Date(input.start + 'T00:00:00Z'))],
    [I.land, input.land === 'own' ? t.landOwn : long ? t.landRentLong : t.landRent],
    [I.market, input.market === 'city' ? I.marketCity : I.marketLocal],
    [I.family, I.familyV(f.share(input.familyLabour || 0))],
    [I.tools, input.ownTools ? I.yes : I.no],
    [I.currency, curName(input.currency) + (input.currency === 'XAF' ? ' (FCFA)' : ' (' + input.currency + '), ' + I.fx(input.currency, f.num(kb.fx.XAF / kb.fx[input.currency], 0)))],
    [I.location, I.locationV]
  ].filter(Boolean);
  table([{ h: '', w: 0.34 }, { h: '', w: 0.66 }], kv.map(([k, v]) => ({ cells: [{ t: k, font: 'SB', color: C.muted }, v] })), { head: false, fs: 8.8 });
  // Production under cover and land preparation: what they mean for this plan, in the same words as the website.
  if (r.cover && r.areaHa > 0) {
    // The same reading as on the website: a new build and its share, or a structure already built with its repairs and upkeep.
    const c = r.cover, label = S.systems[c.system], parts = [];
    if (c.status === 'new') parts.push(S.coverFact(label, c.modules, c.moduleM2, f.num(c.m2), c.buildWeeks), S.coverCharge(f.money(c.structureXaf), f.money(c.chargedXaf)));
    else {
      parts.push(S.coverOwned(label, f.num(c.m2), c.plantedM2 < c.m2 ? f.num(c.plantedM2) : null));
      if (c.repairsXaf > 0) parts.push(S.coverRepair(f.money(c.repairsXaf), f.money(c.chargedXaf)));
      if (c.dripInPlace) parts.push(S.coverDrip);
    }
    if (c.upkeepXaf > 0) parts.push(S.coverUpkeep(f.money(c.upkeepXaf)));
    parts.push(S.coverClimate(c.tDelta));
    if (c.status !== 'owned') parts.push(S.coverLow);
    para(parts.join(' '), { size: 8.6, color: C.muted, lineGap: 2 });
  }
  const fwk = r.fieldWork;
  if (fwk && fwk.available && r.areaHa > 0) {
    if (fwk.method === 'hand' && fwk.suggested === 'hire') para(S.fwSuggest(f.area(r.areaHa), f.num(Math.ceil(fwk.workersHand)), f.area(fwk.fromHa)), { size: 8.6, color: C.muted, lineGap: 2 });
    else if (fwk.method === 'hire') para(S.fwHired(Math.max(1, Math.ceil(fwk.workersPerDay)), f.money(fwk.hirePerHa)).replace(/ under More options| dans Plus d’options/, '') + (fwk.workersPerDay > fwk.threshold ? ' ' + S.fwStillHand : ''), { size: 8.6, color: C.muted, lineGap: 2 });
  }

  // ---------- 4. budget ----------
  section(t.s.budget);
  const B = r.budget, groups = {};
  B.lines.forEach((l) => { const g = l.upfront ? (l.cat === 'structure' ? 'structure' : 'equipment') : l.cat; (groups[g] = groups[g] || []).push(l); });
  const keys = Object.keys(groups).sort((a, b) => (CAT_ORDER.indexOf(a) + 99 * (CAT_ORDER.indexOf(a) < 0)) - (CAT_ORDER.indexOf(b) + 99 * (CAT_ORDER.indexOf(b) < 0)));
  // Singular unit for one unit in English and for any quantity below two in French.
  const unitName = (u, v) => {
    const single = lang === 'fr' ? Math.abs(v) < 2 : Math.abs(v) === 1;
    if (u === 'person day') return single ? t.day : t.days;
    return L((single && (kb.units_one || {})[u]) || (kb.units || {})[u]) || u;
  };
  const qty = (q, u) => {
    if (u === 'unit' || u === 'stake') return f.num(Math.round(q)) + ' ' + unitName(u, Math.round(q));
    const s = f.auto(q);
    return s + ' ' + unitName(u, Number(s.replace(/[\s\u202f\u00a0]/g, '').replace(',', '.')));
  };
  const rows = [];
  keys.forEach((k) => {
    rows.push({ kind: 'group', cells: [S.cats[k] || k, '', '', '', { t: f.money(groups[k].reduce((a, l) => a + l.total, 0)), a: 'right' }] });
    groups[k].forEach((l) => {
      const life = l.upfront ? (l.purchases > 1 ? t.bought(l.purchases) : (!long && l.lifeSeasons > 1 ? t.lasts(l.lifeSeasons) : null)) : null;
      rows.push({ cells: [{ t: L(l.label), sub: life }, qty(l.qty, l.unit), l.unpriced ? { t: t.toQuote, color: C.gold } : f.unit(l.price), { t: (l.src || []).join(' '), size: 6.8, color: C.faint }, l.unpriced ? '·' : f.money(l.total)] });
    });
  });
  if (long) {
    rows.push({ kind: 'sub', cells: [{ t: t.grand, font: 'SB' }, '', '', '', { t: f.money(B.horizonCosts), font: 'SB' }] });
    rows.push({ kind: 'total', cells: [t.capitalNeeded, '', '', '', f.money(B.total)] });
  } else {
    rows.push({ kind: 'group', cells: [t.reserve, '', '', '', f.money(B.reserve)] });
    rows.push({ kind: 'total', cells: [t.grandSeason, '', '', '', f.money(B.total)] });
  }
  table([{ h: t.th.line, w: 0.38 }, { h: t.th.qty, w: 0.17, a: 'right' }, { h: t.th.unitPrice, w: 0.13, a: 'right' }, { h: t.th.src, w: 0.14 }, { h: t.th.total, w: 0.18, a: 'right' }], rows, { fs: 8 });
  para(long ? t.budgetNoteLong : t.budgetNote, { size: 8, color: C.muted, lineGap: 2 });

  // ---------- 5. cash flow ----------
  section(t.s.cash);
  para(t.cashIntro, { size: 9 });
  if (!priced) para(t.cashUnpriced, { size: 9, color: C.gold, font: 'SB' });
  cashChart(doc, cf, f, t, input.currency, kb);
  const kv2 = [[t.peak, f.money(cf.peakNeed) + '  (' + monthOf(mPeak) + ')'], [t.paybackL, cf.paybackIndex !== null ? monthOf(cf.paybackIndex) : t.never], [t.endL, f.money(cf.end)]];
  table([{ h: '', w: 0.55 }, { h: '', w: 0.45, a: 'right' }], kv2.map(([k, v]) => ({ cells: [{ t: k, font: 'SB', color: C.muted }, { t: v, font: 'SB' }] })), { head: false, fs: 9 });
  const M = cf.months;
  if (M.length > 14) {
    const ys = [];
    M.forEach((m, i) => { const k = Math.floor(i / 12); ys[k] = ys[k] || { costs: 0, revenue: 0, cum: 0 }; ys[k].costs += m.costs; ys[k].revenue += m.revenue; ys[k].cum = m.cum; });
    table([{ h: t.th.year, w: 0.16 }, { h: t.th.costs, w: 0.21, a: 'right' }, { h: t.th.revenue, w: 0.21, a: 'right' }, { h: t.th.net, w: 0.21, a: 'right' }, { h: t.th.cum, w: 0.21, a: 'right' }],
      ys.map((v, k) => ({ cells: [{ t: t.yearN(k + 1), font: 'SB' }, f.money(v.costs), f.money(v.revenue), { t: f.money(v.revenue - v.costs), color: neg(v.revenue - v.costs) }, { t: f.money(v.cum), color: neg(v.cum), font: 'SB' }] })), { fs: 8.4 });
  } else {
    table([{ h: t.th.month, w: 0.22 }, { h: t.th.costs, w: 0.195, a: 'right' }, { h: t.th.revenue, w: 0.195, a: 'right' }, { h: t.th.net, w: 0.195, a: 'right' }, { h: t.th.cum, w: 0.195, a: 'right' }],
      M.map((m) => ({ cells: [{ t: f.monthYear(m.y, m.m), font: 'SB' }, f.money(m.costs), f.money(m.revenue), { t: f.money(m.revenue - m.costs), color: neg(m.revenue - m.costs) }, { t: f.money(m.cum), color: neg(m.cum), font: 'SB' }] })), { fs: 8.2 });
  }

  // ---------- 6. itinerary ----------
  section(t.s.itinerary);
  const itRows = r.itinerary.map((s) => {
    const inputs = (s.inputs || []).map((i) => L(i.label) + ' : ' + qty(i.qty, i.unit)).join('\n');
    const extra = [inputs, s.labourDays ? t.labourDays(f.auto(s.labourDays), Number(f.auto(s.labourDays).replace(/[\s\u202f\u00a0]/g, '').replace(',', '.'))) : null, s.harvest && r.profile === 'orchard' ? t.harvestShare(f.share(s.share)) : null].filter(Boolean).join('\n');
    return { cells: [{ t: f.range(s.from, s.to), font: 'SB', size: 7.8, sub: s.occurrences > 1 ? t.occurrences(s.occurrences, s.every) : null }, { t: L(s.label), font: 'B', sub: L(s.detail) }, { t: extra, size: 7.6, color: C.muted }] };
  });
  table([{ h: t.th.dates, w: 0.2 }, { h: t.th.task, w: 0.5 }, { h: t.th.inputs, w: 0.3 }], itRows, { fs: 8.4 });

  // ---------- 7. shopping ----------
  section(t.s.shopping, { page: 'auto' });
  const shop = r.shopping.slice().sort((a, b) => a.category.localeCompare(b.category));
  const shopRows = shop.map((s) => ({ cells: [L(s.label), { t: S.cats[s.category] || s.category, color: C.muted }, qty(s.qty, s.unit), s.packs ? s.packs + ' × ' + L(s.packLabel) : '·', s.unpriced ? { t: t.toQuote, color: C.gold } : f.money(s.packCost || s.cost)] }));
  B.lines.filter((l) => l.upfront).forEach((l) => shopRows.push({ cells: [L(l.label), { t: l.cat === 'structure' ? S.systems[r.system] || S.cats.structure : S.cats.equipment, color: C.muted }, qty(l.qty, l.unit), '·', l.unpriced ? { t: t.toQuote, color: C.gold } : f.money(l.unitTotal || l.total)] }));
  table([{ h: t.th.item, w: 0.33 }, { h: t.th.category, w: 0.2 }, { h: t.th.need, w: 0.15, a: 'right' }, { h: t.th.packs, w: 0.17, a: 'right' }, { h: t.th.cost, w: 0.15, a: 'right' }], shopRows, { fs: 8.2 });
  para(r.shoppingScope === 'first_year' ? t.shopFirstYear : t.shopSeason, { size: 8, color: C.muted, lineGap: 2 });

  // ---------- 8. water and risks ----------
  section(t.s.water);
  const yrs = r.profile === 'orchard' || r.profile === 'ratoon' ? r.horizonMonths / 12 : 1;
  const covText = t.waterCover(f.share(r.water.coverage)) + (r.water.grossM3 > 0 ? ' ' + (yrs > 1 ? t.waterVolumePlan(f.num(r.water.grossM3), f.num(r.water.grossM3 / yrs)) : t.waterVolume(f.num(r.water.grossM3))) : '');
  para(t.waterIntro(covText), { size: 9 });
  waterChart(doc, r.water.balance.rows.slice(0, 12), f, S, t);
  subTitle(S.risksT);
  para(t.risksIntro, { size: 8.6, color: C.muted });
  // A run of months as a phrase, as on the site: "from February to April".
  const months = (arr) => {
    const a = Array.from(new Set(arr || [])), n = a.length, sp = S.span;
    if (!n) return '';
    if (n === 1) return sp.one(f.monthLower(a[0]));
    let run = n < 12;
    for (let i = 1; i < n; i++) if ((((a[i] - a[i - 1]) % 12) + 12) % 12 !== 1) run = false;
    if ((run && n > 2) || n === 12) return sp.range(f.monthLower(a[0]), f.monthLower(a[n - 1]));
    return sp.list(a.slice(0, -1).map((m) => f.monthLower(m)).join(', '), f.monthLower(a[n - 1]));
  };
  const riskRows = [
    ['water', rk.water, long && S.waterLong ? S.waterLong(f.num((r.water.establishment || 0) * 100), f.num(r.water.coverage * 100), r.water.option || input.water) : r.cover && r.cover.rainFactor === 0 ? S.riskText.waterRoof(f.num(r.water.coverage * 100), f.num(r.water.balance.deficit)) : S.riskText.water(f.num(r.water.coverage * 100), f.num(r.water.balance.deficit), r.water.option || input.water)],
    ['heat', heatScored ? rk.heat : null, heatScored ? S.riskText.heat(months(rk.flowerMonths), f.num(rk.tmaxFlower), crop.heat_c) + (r.cover ? S.riskText.heatInside(r.cover.tDelta) : '') + (rk.hotShare !== null && rk.hotShare !== undefined ? S.riskText.heatLong(f.num(rk.hotShare * 100)) : '') : t.heatNA],
    ['disease', rk.disease, S.riskText.disease(f.num(rk.wetRain), L(crop.disease_note)) + (r.cover && r.cover.diseaseShift < 0 ? S.riskText.diseaseRoof : '')],
    ['market', rk.market, S.riskText.market(months(rk.harvestMonths), f.num(rk.priceIndex * 100))]
  ];
  table([{ h: t.th.risk, w: 0.22 }, { h: t.th.level, w: 0.14 }, { h: t.th.detail, w: 0.64 }],
    riskRows.map(([k, lv, d]) => ({ cells: [{ t: S.riskNames[k], font: 'SB' }, lv === null ? { t: '·', color: C.faint } : { pill: [lv, t.levels[lv].charAt(0).toUpperCase() + t.levels[lv].slice(1)] }, { t: d, size: 8 }] })), { fs: 8.4 });
  subTitle(S.windowsT);
  para(t.windowsIntro, { size: 8.6, color: C.muted });
  windowsGrid(doc, r.windows, r.bestMonth, startMonth, f);
  para(t.windowsLegend, { size: 7.8, color: C.muted });

  // ---------- 9. sources ----------
  section(t.s.sources);
  ensure(110);
  const dy = doc.y;
  doc.font('R').fontSize(8.2);
  const dh = doc.heightOfString(t.disclaimer, { width: W - 28, lineGap: 2 }) + doc.heightOfString(t.method, { width: W - 28 }) + 30;
  doc.roundedRect(PAGE.l, dy, W, dh, 7).fill(C.goldSoft);
  doc.font('R').fontSize(8.2).fillColor(C.ink).text(t.disclaimer, PAGE.l + 14, dy + 12, { width: W - 28, lineGap: 2 });
  doc.font('SB').fontSize(7.6).fillColor(C.muted).text(t.method, PAGE.l + 14, doc.y + 6, { width: W - 28 });
  doc.y = dy + dh + 6;
  gap(10);
  para(t.sourcesIntro, { size: 9 });
  const ids = new Set();
  const addIds = (a) => (a || []).forEach((x) => ids.add(x));
  B.lines.forEach((l) => addIds(l.src)); r.itinerary.forEach((s) => addIds(s.src)); addIds(crop.src); addIds(crop.price && crop.price.src); addIds(crop.harvest_src);
  if (prod && crop.products && crop.products[prod.key]) { addIds(crop.products[prod.key].src); addIds((crop.products[prod.key].price || {}).src); }
  addIds(kb.fx_src);
  if (r.cover) addIds(r.cover.src);
  if (r.fieldWork && r.fieldWork.method === 'hire') addIds(kb.machinery.src);
  Object.keys(kb.sources).filter((k) => /^M\d/.test(k)).forEach((k) => ids.add(k));
  const order = (id) => { const m = /^([A-Z]+)(\d+)$/.exec(id); return m ? [m[1], +m[2]] : [id, 0]; };
  const list = [...ids].filter((id) => kb.sources[id]).sort((a, b) => { const [pa, na] = order(a), [pb, nb] = order(b); return pa === pb ? na - nb : pa.localeCompare(pb); });
  list.forEach((id) => {
    const s = kb.sources[id];
    const line = s.title + '. ' + [s.publisher, s.year].filter(Boolean).join(', ') + '.';
    doc.font('R').fontSize(7.8);
    const h = doc.heightOfString(line, { width: W - 44, lineGap: 1.4 }) + (s.url ? 10 : 0);
    ensure(h + 6);
    const y = doc.y;
    doc.font('SB').fontSize(7.4).fillColor(C.green).text(id, PAGE.l, y + 0.6, { width: 40, lineBreak: false });
    doc.font('R').fontSize(7.8).fillColor(C.ink).text(line, PAGE.l + 44, y, { width: W - 44, lineGap: 1.4 });
    if (s.url) doc.font('R').fontSize(6.8).fillColor(C.teal).text(s.url, PAGE.l + 44, doc.y + 1, { width: W - 44, link: s.url, lineBreak: false, ellipsis: true });
    doc.x = PAGE.l; gap(5);
  });
  gap(6);
  const confRows = (crop.confidence || []).concat(r.cover ? [kb.protected.confidence] : [], r.fieldWork && r.fieldWork.method === 'hire' ? [kb.machinery.confidence] : []);
  if (confRows.length) {
    subTitle(t.confidenceT);
    const lv = { high: 0, medium: 1, low: 2 };
    table([{ h: '', w: 0.24 }, { h: '', w: 0.14 }, { h: '', w: 0.62 }], confRows.map((c) => ({ cells: [{ t: L(c.block), font: 'SB' }, { pill: [lv[c.level] ?? 1, t.conf[c.level] || c.level] }, { t: L(c.note), size: 8 }] })), { head: false, fs: 8.4 });
  }
  subTitle(t.assumptionsT);
  bullets((kb.assumptions || []).map((a) => L(a)), { size: 8.2, after: 3 });

  // ---------- footers ----------
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    if (i === 0) continue;
    const old = doc.page.margins.bottom; doc.page.margins.bottom = 0;
    const y = PAGE.h - 42;
    doc.moveTo(PAGE.l, y - 8).lineTo(PAGE.l + W, y - 8).lineWidth(0.5).strokeColor(C.line).stroke();
    doc.font('R').fontSize(7).fillColor(C.faint).text(t.footer(name, ref), PAGE.l, y, { width: W * 0.75, lineBreak: false, ellipsis: true });
    doc.font('SB').fontSize(7).fillColor(C.muted).text(t.page(i + 1, range.count), PAGE.l, y, { width: W, align: 'right', lineBreak: false });
    doc.page.margins.bottom = old;
  }
  doc.end();
  await done;
  return { buffer: Buffer.concat(chunks), plan: r, pages: range.count };
}

/** Monthly cash flow: costs below the axis, sales above, cumulative line. */
function cashChart(doc, cf, f, t, currency, kb) {
  const M = cf.months, H = 190, X0 = PAGE.l + 46, X1 = PAGE.l + W - 4, top = 10, bottom = H - 24;
  if (doc.y + H + 24 > PAGE.h - PAGE.bottom) { doc.addPage(); doc.y = PAGE.top; }
  const y0 = doc.y;
  const cv = currency === 'XAF' ? 1 : kb.fx[currency] / kb.fx.XAF;
  const hi0 = Math.max(1e-6, ...M.map((m) => Math.max(m.revenue, m.cum))) * cv, lo0 = Math.min(-1e-6, ...M.map((m) => Math.min(-m.costs, m.cum))) * cv;
  const raw = (hi0 - lo0) / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))), stp = [1, 2, 2.5, 5, 10].map((x) => x * mag).find((s) => s >= raw) || raw;
  const hi = Math.ceil(hi0 / stp) * stp, lo = Math.floor(lo0 / stp) * stp;
  const Y = (xaf) => y0 + top + (hi - xaf * cv) / (hi - lo) * (bottom - top), bw = (X1 - X0) / M.length;
  const lbl = (v) => { const a = Math.abs(v), s = a >= 1e6 ? f.num(a / 1e6, a % 1e6 ? 1 : 0) + ' M' : a >= 1e3 ? f.num(a / 1e3, a % 1e3 ? 1 : 0) + ' k' : f.num(a); return (v < 0 ? '−' : '') + s; };
  for (let v = lo; v <= hi + stp / 2; v += stp) {
    const vv = Math.round(v / stp) * stp, y = Y(vv / cv);
    doc.moveTo(X0, y).lineTo(X1, y).lineWidth(0.4).strokeColor(vv === 0 ? '#9DB8AA' : '#E3ECE7').stroke();
    doc.font('R').fontSize(6.6).fillColor(C.faint).text(lbl(vv), PAGE.l, y - 3.4, { width: 40, align: 'right', lineBreak: false });
  }
  M.forEach((m, i) => {
    const x = X0 + i * bw + bw * 0.16, w = Math.max(0.6, bw * 0.68);
    if (m.costs > 0) doc.rect(x, Y(0), w, Math.max(0.4, Y(-m.costs) - Y(0))).fill(C.amber);
    if (m.revenue > 0) doc.rect(x, Y(m.revenue), w, Math.max(0.4, Y(0) - Y(m.revenue))).fill(C.green);
  });
  doc.lineWidth(1.4).strokeColor(C.deep).lineJoin('round');
  M.forEach((m, i) => { const x = X0 + (i + 0.5) * bw, y = Y(m.cum); if (i === 0) doc.moveTo(x, y); else doc.lineTo(x, y); });
  doc.stroke();
  const step = M.length <= 14 ? 1 : M.length <= 40 ? 3 : 12;
  M.forEach((m, i) => {
    if (i % step) return;
    const s = step === 12 ? t.yearN(i / 12 + 1) : f.month(m.m, 'short');
    doc.font('R').fontSize(6.6).fillColor(C.faint).text(s, X0 + (i + 0.5) * bw - 20, y0 + bottom + 6, { width: 40, align: 'center', lineBreak: false });
  });
  const ly = y0 + H - 2;
  let lx = PAGE.l;
  [[C.amber, t.cashLegend[0]], [C.green, t.cashLegend[1]], [C.deep, t.cashLegend[2]]].forEach(([c, s]) => {
    doc.rect(lx, ly + 1, 8, 8).fill(c);
    doc.font('R').fontSize(7.6).fillColor(C.muted).text(s, lx + 12, ly, { lineBreak: false });
    lx += 24 + doc.widthOfString(s);
  });
  doc.x = PAGE.l; doc.y = y0 + H + 22;
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Monthly crop need against useful rain, in mm. */
function waterChart(doc, rows, f, S, t) {
  const H = 150, X0 = PAGE.l + 34, X1 = PAGE.l + W - 4, top = 8, bottom = H - 22;
  if (doc.y + H + 24 > PAGE.h - PAGE.bottom) { doc.addPage(); doc.y = PAGE.top; }
  const y0 = doc.y, max = Math.max(1, ...rows.map((x) => Math.max(x.etc, x.peff))), bw = (X1 - X0) / rows.length;
  const Y = (v) => y0 + bottom - v / max * (bottom - top);
  [0, 0.5, 1].forEach((k) => {
    const y = Y(max * k);
    doc.moveTo(X0, y).lineTo(X1, y).lineWidth(0.4).strokeColor('#E3ECE7').stroke();
    doc.font('R').fontSize(6.6).fillColor(C.faint).text(f.num(max * k), PAGE.l, y - 3.4, { width: 28, align: 'right', lineBreak: false });
  });
  rows.forEach((x, i) => {
    const bx = X0 + i * bw + bw * 0.14, w = bw * 0.34;
    doc.rect(bx, Y(x.etc), w, Y(0) - Y(x.etc)).fill(C.green);
    doc.rect(bx + w + 1.5, Y(x.peff), w, Y(0) - Y(x.peff)).fill(C.teal);
    doc.font('R').fontSize(6.6).fillColor(C.faint).text(f.month(x.month, 'short'), X0 + i * bw, y0 + bottom + 5, { width: bw, align: 'center', lineBreak: false });
  });
  doc.font('R').fontSize(6.6).fillColor(C.faint).text('mm', PAGE.l, y0 - 2, { width: 28, align: 'right', lineBreak: false });
  const ly = y0 + H - 4;
  let lx = PAGE.l;
  [[C.green, cap(S.cropNeed)], [C.teal, cap(S.rainEff)]].forEach(([c, s]) => {
    doc.rect(lx, ly + 1, 8, 8).fill(c);
    doc.font('R').fontSize(7.6).fillColor(C.muted).text(s, lx + 12, ly, { lineBreak: false });
    lx += 24 + doc.widthOfString(s);
  });
  doc.x = PAGE.l; doc.y = y0 + H + 18;
}

/** Twelve start months coloured by risk score; the best month is outlined, the chosen month marked. */
function windowsGrid(doc, windows, best, current, f) {
  const g = 4, n = 12, w = (W - g * (n - 1)) / n, h = 40;
  if (doc.y + h + 10 > PAGE.h - PAGE.bottom) { doc.addPage(); doc.y = PAGE.top; }
  const y = doc.y;
  windows.slice().sort((a, b) => a.month - b.month).forEach((win, i) => {
    const x = PAGE.l + i * (w + g), lvl = Math.min(2, Math.floor(win.risk.score / 2));
    doc.roundedRect(x, y, w, h, 5).fill(LEVEL_COL[lvl][1]);
    if (win.month === best) doc.roundedRect(x + 0.6, y + 0.6, w - 1.2, h - 1.2, 5).lineWidth(1.2).strokeColor(C.green).stroke();
    if (win.month === current) doc.rect(x + w / 2 - 6, y + h - 4, 12, 2).fill(C.deep);
    doc.font('SB').fontSize(7.4).fillColor(C.ink).text(f.month(win.month, 'short'), x, y + 8, { width: w, align: 'center', lineBreak: false });
    doc.font('XB').fontSize(10).fillColor(LEVEL_COL[lvl][0]).text(String(win.risk.score), x, y + 20, { width: w, align: 'center', lineBreak: false });
  });
  doc.x = PAGE.l; doc.y = y + h + 12;
}
