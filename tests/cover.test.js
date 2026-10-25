// Production under cover (net house, greenhouse) and hired machines for land preparation, on the real knowledge base.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../site/src/engine.cjs');
const kb = JSON.parse(fs.readFileSync(new URL('../site/data/kb.json', import.meta.url), 'utf8'));
const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');

const base = { capital: 20000, currency: 'USD', mode: 'budget', area: 1, crop: 'tomato', water: 'pump', start: '2027-03-01', land: 'rent', market: 'local', familyLabour: 0.25, ownTools: false };
const plan = (o) => E.plan(kb, { ...base, ...o });
const pick = (r) => ({ state: r.state, area: r.areaHa, total: r.budget.total, margin: r.scenarios.average.margin, risk: r.risk.score, best: r.bestMonth, lines: r.budget.lines.length, steps: r.itinerary.length });
const DAY = 864e5;

test('cover: the open field is unchanged by the new fields, and an unsupported system falls back to it', () => {
  for (const crop of Object.keys(kb.crops)) {
    const a = plan({ crop }), b = plan({ crop, system: 'open', fieldWork: 'hand' });
    assert.deepEqual(pick(b), pick(a), crop);
    assert.equal(a.system, 'open');
  }
  const chili = plan({ crop: 'chili', system: 'greenhouse' });
  assert.equal(chili.system, 'open');
  assert.deepEqual(pick(chili), pick(plan({ crop: 'chili' })));
});

test('cover: the systems offered follow the sourced yields', () => {
  assert.deepEqual(E.systemsFor(kb, 'tomato'), ['open', 'net', 'greenhouse']);
  assert.deepEqual(E.systemsFor(kb, 'pepper'), ['open', 'greenhouse']);
  assert.deepEqual(E.systemsFor(kb, 'cucumber'), ['open', 'greenhouse']);
  for (const k of ['chili', 'greenbean', 'zucchini', 'cassava', 'cocoa']) assert.deepEqual(E.systemsFor(kb, k), ['open'], k);
  for (const [crop, by] of Object.entries(kb.protected.crops)) {
    assert.ok(kb.crops[crop], crop);
    for (const d of Object.values(by)) for (const id of d.src) assert.ok(kb.sources[id], crop + ' ' + id);
  }
  for (const S of Object.values(kb.protected.systems)) for (const id of S.src) assert.ok(kb.sources[id], id);
  for (const o of Object.values(kb.machinery.ops)) for (const id of o.src) assert.ok(kb.sources[id], id);
});

test('cover: a greenhouse is sized in whole modules, watered by drip and kept out of the rain', () => {
  const r = plan({ system: 'greenhouse' }), mod = kb.protected.module_m2;
  assert.equal(r.state, 'ok');
  assert.equal(r.cover.m2 % mod, 0);
  assert.ok(r.cover.modules >= 1 && Math.abs(r.areaHa * 1e4 - r.cover.m2) < 1e-6);
  assert.equal(r.water.option, 'drip');
  assert.equal(r.water.balance.rainMet, 0);
  assert.ok(Math.abs(r.water.coverage - 1) < 1e-9);
  assert.ok(r.budget.total <= r.capitalXaf * 1.0001);
  const st = r.budget.lines.filter(l => l.cat === 'structure');
  assert.equal(st.length, 2);
  assert.ok(st.every(l => l.upfront));
  assert.deepEqual(st.map(l => l.lifeSeasons).sort((a, b) => a - b), [8, 20]);
  assert.ok(Math.abs(st.reduce((a, l) => a + l.total, 0) - r.cover.m2 * r.cover.pricePerM2) < 1);
  assert.equal(r.scenarios.average.yieldTHa, kb.protected.crops.tomato.greenhouse.yield_t_ha.average);
  assert.equal(Math.round((r.calendar.lastHarvest - r.calendar.firstHarvest) / DAY), 240);
  assert.equal(r.seasonsUsed, 2);
  assert.ok(r.itinerary.some(s => s.id === 'build' && s.phase === 'prep'));
  // One more module does not fit the capital.
  const more = plan({ system: 'greenhouse', mode: 'crop', area: (r.cover.m2 + mod) / 1e4 });
  assert.ok(more.requiredXaf > r.capitalXaf);
});

test('cover: the structure is charged for the seasons the plan uses, the full price stays in the budget', () => {
  const r = plan({ system: 'greenhouse' });
  const up = r.budget.lines.filter(l => l.upfront);
  const expected = up.reduce((a, l) => a + l.total * Math.min(r.seasonsUsed, l.lifeSeasons) / l.lifeSeasons, 0);
  assert.ok(Math.abs(r.budget.upfrontPerSeason - expected) < 1);
  assert.ok(Math.abs(r.budget.upfront - up.reduce((a, l) => a + l.total, 0)) < 1);
});

test('cover: below one module the plan says so and gives the capital for one module', () => {
  const r = plan({ system: 'greenhouse', capital: 3000 });
  assert.equal(r.state, 'below_module');
  assert.equal(r.areaHa, 0);
  const one = plan({ system: 'greenhouse', mode: 'crop', area: kb.protected.module_m2 / 1e4 });
  assert.ok(Math.abs(one.requiredXaf / r.cover.minModuleXaf - 1) < 0.01);
});

test('cover: area first rounds up to whole modules', () => {
  const r = plan({ system: 'net', mode: 'crop', area: 0.03 });
  assert.equal(r.cover.m2, 2 * kb.protected.module_m2);
  assert.ok(r.requiredXaf > 0);
});

test('cover: a net house keeps the rain and the open field calendar, and adds its warming', () => {
  const open = plan({ start: '2027-06-01' }), net = plan({ system: 'net', start: '2027-06-01' });
  assert.ok(net.water.balance.rainMet > 0);
  assert.equal(net.calendar.totalDays, open.calendar.totalDays);
  assert.ok(Math.abs(net.risk.tmaxFlower - open.risk.tmaxFlower - kb.protected.systems.net.temp_delta_c) < 1e-9);
  assert.equal(net.scenarios.average.yieldTHa, kb.protected.crops.tomato.net.yield_t_ha.average * net.water.yieldFactor);
});

test('machines: hired machines replace most of the hand work of land preparation', () => {
  const hand = plan({ mode: 'crop', area: 10 }), hire = plan({ mode: 'crop', area: 10, fieldWork: 'hire' });
  const line = (r, k) => r.budget.lines.find(l => l.key === k);
  assert.ok(Math.abs(line(hire, 'labour_plough').qty - line(hand, 'labour_plough').qty * kb.machinery.hand_share) < 1e-6);
  for (const op of ['clear', 'plough', 'ridge']) {
    const l = line(hire, 'machine_' + op);
    assert.ok(l && l.cat === 'machinery', op);
    assert.equal(l.qty, 10);
    assert.equal(l.price, kb.machinery.ops[op].price);
  }
  assert.ok(!hand.budget.lines.some(l => l.cat === 'machinery'));
  assert.ok(Math.abs(hire.fieldWork.workersPerDay - hand.fieldWork.workersHand * kb.machinery.hand_share) < 1e-9);
  assert.equal(hand.fieldWork.suggested, 'hire');
  assert.equal(plan({ mode: 'crop', area: 2 }).fieldWork.suggested, 'hand');
  assert.ok(Math.abs(hand.fieldWork.fromHa - 2.5) < 1e-9);
});

test('machines: a grower quote replaces the reference and is spread over the operations', () => {
  const r = plan({ mode: 'crop', area: 4, fieldWork: 'hire', machineQuoteXafHa: 250000 });
  const total = r.budget.lines.filter(l => l.cat === 'machinery').reduce((a, l) => a + l.total, 0);
  assert.ok(Math.abs(total - 250000 * 4) < 1);
  assert.equal(r.fieldWork.hirePerHa, 250000);
});

test('machines: steps that machines cannot do never trigger the suggestion', () => {
  const p10 = plan({ crop: 'plantain', mode: 'crop', area: 10 });
  assert.ok(p10.fieldWork.workersHand > kb.machinery.workers_per_day_max);
  assert.equal(p10.fieldWork.suggested, 'hand');
  assert.equal(plan({ crop: 'plantain', mode: 'crop', area: 20 }).fieldWork.suggested, 'hire');
});

test('machines: long crops take hired machines, work under a cover stays by hand', () => {
  const c = plan({ crop: 'cassava', mode: 'crop', area: 5, fieldWork: 'hire', priceXafKg: 100 });
  assert.ok(['machine_clear', 'machine_ridge'].every(k => c.budget.lines.some(l => l.key === k)));
  const h = plan({ crop: 'cassava', mode: 'crop', area: 5, priceXafKg: 100 });
  const lab = (r) => r.budget.lines.find(l => l.key === 'labour_prep').qty;
  assert.ok(Math.abs(lab(c) - lab(h) * kb.machinery.hand_share) < 1e-6);
  const g = plan({ system: 'greenhouse', fieldWork: 'hire' });
  assert.equal(g.fieldWork.method, 'hand');
  assert.equal(g.fieldWork.available, false);
  assert.ok(!g.budget.lines.some(l => l.cat === 'machinery'));
});

test('comparisons: crops are compared in the open field, systems for one crop', () => {
  const rows = E.compare(kb, { ...base, system: 'greenhouse' });
  const tomato = rows.find(x => x.crop === 'tomato');
  assert.ok(Math.abs(tomato.areaHa - plan({}).areaHa) < 1e-9);
  const sys = E.compareSystems(kb, { ...base, priceXafKg: 400 });
  assert.deepEqual(sys.map(x => x.system), ['open', 'net', 'greenhouse']);
  assert.ok(sys.every(x => x.margin !== null && Number.isFinite(x.breakEven)));
  assert.ok(sys.find(x => x.system === 'greenhouse').m2 % kb.protected.module_m2 === 0);
});

test('strings: the new wording exists in both languages, with the same keys and no long dash', () => {
  const I18N = vm.runInNewContext(['i18n.js', 'i18n-v3.js', 'i18n-v4.js', 'i18n-v5.js', 'i18n-v7.js'].map(f => read('site/src/' + f)).join('\n') + ';I18N');
  const keys = ['system', 'systems', 'areaCover', 'coverWater', 'fieldWork', 'fieldWorkOpts', 'quote', 'fwSuggest', 'fwHired', 'coverFact', 'coverCharge', 'coverClimate', 'systemsT', 'systemsNote', 'budgetCoverNote'];
  for (const lang of ['en', 'fr']) {
    const P = I18N[lang].planner;
    for (const k of keys) assert.ok(P[k], lang + ' ' + k);
    assert.ok(P.states.below_module && P.states.below_min, lang);
    assert.ok(P.cats.structure && P.cats.machinery && P.cats.equipment, lang);
    assert.ok(P.riskText.heatInside && P.riskText.heat, lang);
  }
  assert.doesNotMatch(read('site/src/i18n-v7.js'), /[–—]/);
  assert.doesNotMatch(read('data/research/protected.json') + read('data/research/machinery.json'), /[–—]/);
});
