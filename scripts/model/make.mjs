// Editable financial model for the Essential, Expert and Bankable offers.
// Runs the Season Planner engine on one to three variants of a project, then writes an Excel workbook whose
// figures are formulas: the client can change the area, the prices, the yields or any cost line.
//
//   node scripts/model/make.mjs <order.json> <out.xlsx>
//
// order.json: see scripts/model/example.fr.json. Each variant holds the planner settings of one option
// (crop, capital or area, water, planting date, land, market...). Seasonal crops only: tomato, green bean,
// sweet pepper, chili, cucumber, zucchini. Perennial and long cycle plans are modelled by hand.
// Python 3 with openpyxl builds the file (scripts/model/build_model.py).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const here = path.dirname(new URL(import.meta.url).pathname);
const E = require('../../site/src/engine.cjs');
const kb = require('../../site/data/kb.json');

const [orderPath, outPath] = process.argv.slice(2);
if (!orderPath || !outPath) { console.error('Usage: node scripts/model/make.mjs <order.json> <out.xlsx>'); process.exit(2); }
const order = JSON.parse(fs.readFileSync(orderPath, 'utf8'));
const lang = order.lang === 'en' ? 'en' : 'fr';
const c2 = kb.fx[order.currency2] ? order.currency2 : 'USD';
if (!Array.isArray(order.variants) || !order.variants.length || order.variants.length > 3) throw new Error('order.variants: one to three variants');

const WATER = {
  en: { rainfed: 'rain only', manual: 'manual watering', existing: 'existing water point', pump: 'motor pump', drip: 'drip irrigation' },
  fr: { rainfed: 'pluie seule', manual: 'arrosage manuel', existing: 'point d’eau existant', pump: 'motopompe', drip: 'goutte-à-goutte' }
};
const SYSTEM = { en: { open: 'open field', tunnel: 'tunnel', greenhouse: 'greenhouse' }, fr: { open: 'plein champ', tunnel: 'tunnel', greenhouse: 'serre' } };
const LAND = { en: { rent: 'rented land', own: 'own land' }, fr: { rent: 'terrain loué', own: 'terrain possédé' } };
const SCEN = ['good', 'average', 'poor', 'failure'];
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const unitLabel = (u) => (kb.units[u] && kb.units[u][lang]) || u;
const usedSources = new Set();
// Category names as the planner shows them
const i18nFiles = ['i18n.js', 'i18n-v3.js', 'i18n-v4.js', 'i18n-v5.js', 'i18n-v6.js', 'i18n-v7.js'];
const I18N = vm.runInNewContext(i18nFiles.map((f) => fs.readFileSync(path.join(here, '../../site/src', f), 'utf8')).join('\n') + ';I18N');
const CATS = I18N[lang].planner.cats;

const variants = order.variants.map((v, i) => {
  const input = Object.assign({ currency: 'USD', mode: 'budget', land: 'rent', market: 'local', familyLabour: 0, ownTools: false, system: 'open' }, v.input);
  const r = E.plan(kb, input);
  const name = v.name || String.fromCharCode(65 + i);
  if (r.profile !== 'season') throw new Error(`variant ${name}: ${input.crop} is planned over several years; this generator covers seasonal crops only`);
  if (r.state !== 'ok') throw new Error(`variant ${name}: the planner returns "${r.state}" (a selling price may be missing: set input.priceXafKg)`);
  const area = r.areaHa, avg = r.scenarios.average;
  const familyShare = Math.min(0.9, Math.max(0, +input.familyLabour || 0));
  const stepName = Object.fromEntries((r.itinerary || []).map((it) => [it.id, it.label[lang] || it.label.en]));
  const lines = r.budget.lines.map((l) => {
    (l.src || []).forEach((s) => usedSources.add(s));
    const perKg = l.cat === 'harvest' && l.unit === 'kg';
    const upfront = !!l.upfront;
    const cashShare = perKg ? (/labour/.test(l.key) ? 1 - familyShare : 1) : (l.cashFactor !== undefined ? l.cashFactor : 1);
    return {
      label: l.label[lang] || l.label.en, cat: CATS[l.cat] || l.cat, step: stepName[l.step] || '', unit: unitLabel(l.unit), unitKey: l.unit,
      kind: perKg ? 'kg' : upfront ? 'upfront' : 'ha',
      qtyPerHa: area > 0 ? l.qty / area : 0, qty: l.qty, price: l.price || 0, unpriced: !!l.unpriced || l.price == null, total: l.total || 0, cashShare, life: l.lifeSeasons || 1,
      src: [...new Set(l.src || [])].join(', ')
    };
  });
  // Monthly cash flow of the average outcome, split into field and equipment spending (fixed shares)
  // and harvest spending, which follows the sales of each month.
  const harvestAvg = lines.filter((l) => l.kind === 'kg').reduce((a, l) => a + l.price * l.cashShare, 0) * avg.soldKg;
  const months = r.cashflow.months;
  const revTot = months.reduce((a, m) => a + m.revenue, 0) || 1;
  let fixed = months.map((m) => Math.max(0, m.costs - (m.revenue / revTot) * harvestAvg));
  const fixedTot = fixed.reduce((a, x) => a + x, 0) || 1;
  const fmt = new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  const cash = months.map((m, k) => ({ label: fmt.format(new Date(Date.UTC(m.y, m.m, 1))), fixedShare: fixed[k] / fixedTot, saleShare: m.revenue / revTot }));
  const soldShare = avg.soldKg / (avg.yieldTHa * 1000 * area);
  const fee = 1 - avg.revenue / (avg.soldKg * avg.price);
  return {
    name,
    title: `${kb.crops[input.crop].name[lang]}, ${SYSTEM[lang][r.system] || r.system}, ${WATER[lang][input.water] || input.water}, ${LAND[lang][input.land] || input.land}`,
    crop: kb.crops[input.crop].name[lang], start: iso(r.calendar.start), firstHarvest: iso(r.calendar.firstHarvest), lastHarvest: iso(r.calendar.lastHarvest),
    area, lossShare: 1 - soldShare, fee: Math.abs(fee) < 1e-9 ? 0 : fee, reserveRate: kb.limits.reserve_rate,
    scenarios: SCEN.map((s) => ({ key: s, yieldTHa: r.scenarios[s].yieldTHa, price: r.scenarios[s].price, weight: r.weights[s] })),
    priceSource: r.priceSource, lines, cash,
    engine: {
      total: r.budget.total, expectedMargin: r.expectedMargin, peakNeed: r.cashflow.peakNeed,
      margins: Object.fromEntries(SCEN.map((s) => [s, r.scenarios[s].margin])),
      cashAfter: Object.fromEntries(SCEN.map((s) => [s, r.scenarios[s].cashAfterSeason])),
      breakEvenYield: r.breakEven && r.breakEven.yieldTHa, breakEvenPrice: r.breakEven && r.breakEven.priceXafKg
    }
  };
});

const data = {
  lang, ref: order.ref || '', preparedFor: order.preparedFor || '', preparedBy: order.preparedBy || 'Djalumo Agro', reviewedBy: order.reviewedBy || '',
  pricesDate: order.pricesDate || new Date().toISOString().slice(0, 10), currency2: c2, fx2: kb.fx.XAF / kb.fx[c2], kbVersion: kb.version, kbBuilt: kb.built,
  variants,
  sources: [...usedSources].sort().map((id) => Object.assign({ id }, kb.sources[id] || {}))
};
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'djalumo-model-')), 'data.json');
fs.writeFileSync(tmp, JSON.stringify(data));
execFileSync('python3', [path.join(here, 'build_model.py'), tmp, outPath], { stdio: 'inherit' });
fs.copyFileSync(tmp, outPath.replace(/\.xlsx$/i, '') + '.engine.json');
console.log(`model written: ${outPath} (${variants.length} variant${variants.length > 1 ? 's' : ''}); engine figures in ${outPath.replace(/\.xlsx$/i, '')}.engine.json for the check`);
