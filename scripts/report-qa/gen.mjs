// Report quality check, step 1: builds the PDF report for a wide range of visitor choices
// (every crop and product, both languages, budgets from 1,000 USD to 5 million USD, several currencies,
// water options, open field, shade net and greenhouse, long names and places).
// Output: <QA_DIR>/cases.json and <QA_DIR>/pdf/<id>.pdf, then check.py inspects them.
import { buildReportPdf } from '../../lib/report/pdf.js';
import { PROFILES } from '../../lib/report/strings.js';
import fs from 'fs';
import os from 'os';
import path from 'path';
const DIR = process.env.QA_DIR || path.join(os.tmpdir(), 'djalumo-report-qa');
fs.rmSync(DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(DIR, 'pdf'), { recursive: true });
const kb = JSON.parse(fs.readFileSync(new URL('../../site/data/kb.json', import.meta.url), 'utf8'));
const base = { capital: 100000, currency: 'USD', mode: 'budget', area: 1, crop: 'tomato', product: null, water: 'pump', start: '2026-12-01', land: 'rent', market: 'local', familyLabour: 0, ownTools: false, priceXafKg: null, horizon: null, system: 'open', fieldWork: 'hand', machineQuoteXafHa: 0, structure: 'new', structureM2: null, replaceCover: false, repairXaf: 0, dripInPlace: true };
const short = ['tomato', 'greenbean', 'pepper', 'chili', 'cucumber', 'zucchini'];
const long = ['cassava', 'plantain', 'pineapple', 'avocado', 'cocoa', 'oil_palm'];
const waters = ['rainfed', 'manual', 'existing', 'pump', 'drip'];
const starts = ['2026-12-01', '2027-03-01', '2027-07-15', '2027-10-01'];
const longName = 'Marie-Françoise Ngo Bassong Épouse Mbarga Nkoulou, Directrice des opérations agricoles';
const longPlace = 'Foumbot, département du Noun, région de l’Ouest, Cameroun, à proximité de la route de Bafoussam';
const cases = [];
let i = 0;
const add = (input, req, lang, tag) => cases.push({ id: String(++i).padStart(3, '0'), tag, lang, input: { ...base, ...input }, request: { name: 'Awa Ndiaye', profile: 'investor', place: null, ...req } });
for (const lang of ['en', 'fr']) {
  short.forEach((crop, k) => {
    for (const cap of [1000, 100000, 5000000]) add({ crop, capital: cap, water: waters[(k + cap) % 5], start: starts[k % 4] }, { profile: PROFILES[k % 6] }, lang, crop + ' ' + cap + ' USD');
    add({ crop, system: 'greenhouse', capital: 300000 }, {}, lang, crop + ' greenhouse');
    add({ crop, system: 'net', capital: 300000, fieldWork: 'hire' }, { place: 'Bafoussam' }, lang, crop + ' net hire');
    add({ crop, mode: 'crop', area: 50, land: 'own', market: 'city', familyLabour: 0.5, ownTools: true, priceXafKg: 400 }, { name: longName, place: longPlace }, lang, crop + ' crop mode 50 ha');
  });
  long.forEach((crop, k) => {
    const prods = kb.crops[crop].products ? Object.keys(kb.crops[crop].products) : [null];
    prods.forEach((product) => add({ crop, product, capital: 250000, start: '2027-03-15', water: 'rainfed' }, { place: 'Kigali' }, lang, crop + ' ' + product));
    add({ crop, capital: 5000000, currency: 'USD', start: '2027-09-01', horizon: 120 }, { profile: 'diaspora' }, lang, crop + ' 5M horizon 120');
    add({ crop, mode: 'crop', area: 200, land: 'own' }, { name: longName, place: longPlace }, lang, crop + ' crop mode 200 ha');
  });
  add({ crop: 'tomato', currency: 'XAF', capital: 60000000 }, {}, lang, 'tomato XAF');
  add({ crop: 'avocado', capital: 1000000 }, { name: ('Marie-Françoise Ngo Bassong Épouse Mbarga Nkoulou Directrice Générale des Opérations Agricoles et ').slice(0, 100), place: ('Foumbot, département du Noun, région de l’Ouest, Cameroun, à proximité immédiate de la route nationale de Bafoussam ').slice(0, 120) }, lang, 'max name and place');
  add({ crop: 'pepper', currency: 'EUR', capital: 250000 }, {}, lang, 'pepper EUR');
  add({ crop: 'cucumber', currency: 'KES', capital: 20000000 }, {}, lang, 'cucumber KES');
  add({ crop: 'tomato', system: 'greenhouse', structure: 'repair', structureM2: 800, replaceCover: true, repairXaf: 300000 }, {}, lang, 'tomato greenhouse repair');
  add({ crop: 'tomato', system: 'net', structure: 'owned', structureM2: 5000, dripInPlace: false }, {}, lang, 'tomato net owned');
}
const out = [];
for (const c of cases) {
  try {
    const { buffer, pages } = await buildReportPdf({ input: c.input, request: c.request, lang: c.lang, ref: 'DJ2611 QA' + c.id, issued: new Date('2026-11-23T12:00:00Z') });
    fs.writeFileSync(path.join(DIR, 'pdf', c.id + '.pdf'), buffer); out.push({ ...c, pages });
  } catch (e) { out.push({ ...c, error: String(e && e.stack || e).slice(0, 400) }); }
}
fs.writeFileSync(path.join(DIR, 'cases.json'), JSON.stringify(out, null, 1));
console.log(out.length, 'cases,', out.filter((c) => c.error).length, 'errors');
