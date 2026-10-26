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
  const chili = plan({ crop: 'chili', system: 'net' });
  assert.equal(chili.system, 'open');
  assert.deepEqual(pick(chili), pick(plan({ crop: 'chili' })));
  const cassava = plan({ crop: 'cassava', system: 'greenhouse', structure: 'owned', priceXafKg: 100 });
  assert.equal(cassava.system, 'open');
  assert.equal(cassava.cover, null);
});

test('cover: the systems offered follow the sourced yields', () => {
  assert.deepEqual(E.systemsFor(kb, 'tomato'), ['open', 'net', 'greenhouse']);
  // Every short cycle crop can be planned under a greenhouse; the long crops and orchards stay in the open field.
  for (const k of ['greenbean', 'pepper', 'chili', 'cucumber', 'zucchini']) assert.deepEqual(E.systemsFor(kb, k), ['open', 'greenhouse'], k);
  for (const k of ['cassava', 'plantain', 'pineapple', 'avocado', 'cocoa', 'oil_palm']) assert.deepEqual(E.systemsFor(kb, k), ['open'], k);
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
  const st = r.budget.lines.filter(l => l.cat === 'structure' && l.upfront);
  assert.equal(st.length, 2);
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
  const keys = ['system', 'systems', 'areaCover', 'coverWater', 'fieldWork', 'fieldWorkOpts', 'quote', 'fwSuggest', 'fwHired', 'coverFact', 'coverCharge', 'coverClimate', 'systemsT', 'systemsNote', 'budgetCoverNote',
    'structureL', 'structureOpts', 'structureHint', 'structureM2', 'dripInPlace', 'coverWaterInPlace', 'coverWord', 'replaceCover', 'repairQuote', 'areaExisting', 'coverOwned', 'coverRepair', 'coverUpkeep', 'coverDrip', 'budgetOwnedNote'];
  for (const lang of ['en', 'fr']) {
    const P = I18N[lang].planner;
    for (const k of keys) assert.ok(P[k], lang + ' ' + k);
    assert.ok(P.states.below_module && P.states.below_min && P.states.cover_limit && P.states.upfront_cover, lang);
    for (const k of ['new', 'owned', 'repair']) assert.ok(P.structureOpts[k] && P.structureHint[k], lang + ' ' + k);
    assert.ok(P.cats.structure && P.cats.machinery && P.cats.equipment, lang);
    assert.ok(P.riskText.heatInside && P.riskText.heat, lang);
  }
  assert.doesNotMatch(read('site/src/i18n-v7.js'), /[–—]/);
  assert.doesNotMatch(read('data/research/protected.json') + read('data/research/machinery.json'), /[–—]/);
});

const SHORT = ['tomato', 'greenbean', 'pepper', 'chili', 'cucumber', 'zucchini'];

test('six crops: every short cycle crop gives a sound greenhouse plan in every month and both approaches', () => {
  for (const crop of SHORT) {
    const ref = kb.protected.crops[crop].greenhouse;
    for (let m = 0; m < 12; m++) {
      const start = '2027-' + String(m + 1).padStart(2, '0') + '-01';
      const r = plan({ crop, system: 'greenhouse', start, priceXafKg: 500 });
      assert.equal(r.system, 'greenhouse', crop);
      assert.equal(r.state, 'ok', crop + ' ' + start);
      assert.equal(r.cover.m2 % kb.protected.module_m2, 0);
      assert.ok(r.budget.total <= r.capitalXaf * 1.0001, crop);
      assert.ok(Math.abs(r.scenarios.average.yieldTHa - ref.yield_t_ha.average) < 1e-9, crop);
      for (const s of ['good', 'average', 'poor', 'failure']) assert.ok(Number.isFinite(r.scenarios[s].margin), crop + ' ' + s);
      assert.ok(r.scenarios.good.margin >= r.scenarios.average.margin && r.scenarios.average.margin >= r.scenarios.poor.margin, crop);
      assert.ok(Math.abs(r.cashflow.end - r.scenarios.average.cashAfterSeason) < 1, crop + ' cash flow');
      if (ref.cycle) assert.equal(Math.round((r.calendar.lastHarvest - r.calendar.firstHarvest) / DAY), ref.cycle.harvest_days, crop);
      assert.equal(r.windows.length, 12);
    }
    const a = plan({ crop, system: 'greenhouse', mode: 'crop', area: 0.05, priceXafKg: 500 });
    assert.equal(a.cover.m2, 3 * kb.protected.module_m2, crop);
    const b = plan({ crop, system: 'greenhouse', currency: 'XAF', capital: a.requiredXaf * 1.001, priceXafKg: 500 });
    assert.equal(b.cover.m2, a.cover.m2, crop + ' the capital required in area mode funds the same structure');
  }
});

test('six crops: a greenhouse yields more per square metre than the open field reference of the same crop', () => {
  for (const crop of SHORT) {
    const g = kb.protected.crops[crop].greenhouse.yield_t_ha.average, o = kb.crops[crop].yield_t_ha;
    assert.ok(g >= Math.max(o.dry.average, o.wet.average), crop + ' ' + g);
  }
});

test('structure already built: nothing bought for it, only its upkeep, and the drip is taken as installed', () => {
  const owned = plan({ system: 'greenhouse', structure: 'owned', structureM2: 500, mode: 'crop' });
  assert.equal(owned.cover.status, 'owned');
  assert.equal(owned.areaHa, 0.05);
  assert.ok(!owned.budget.lines.some(l => l.upfront && l.cat === 'structure'));
  assert.ok(!owned.budget.lines.some(l => ['drip_kit', 'motor_pump'].includes(l.key)));
  const up = owned.budget.lines.find(l => l.key === 'structure_upkeep');
  assert.ok(up && !up.upfront);
  assert.ok(Math.abs(up.total - 500 * kb.protected.upkeep.xaf_m2_day * owned.calendar.totalDays) < 1e-6);
  assert.equal(owned.cover.chargedXaf, 0);
  assert.ok(owned.water.balance.rainMet === 0 && owned.water.option === 'drip' && owned.water.grossM3 > 0);
  // Same structure, built new for the plan: the structure and the drip are bought, the margin carries their share.
  const fresh = plan({ system: 'greenhouse', mode: 'crop', area: 0.05 });
  assert.ok(fresh.requiredXaf > owned.requiredXaf * 5);
  assert.ok(owned.scenarios.average.margin > fresh.scenarios.average.margin);
  // The drip system can be declared missing: it is then bought.
  const noDrip = plan({ system: 'greenhouse', structure: 'owned', structureM2: 500, mode: 'crop', dripInPlace: false });
  assert.ok(noDrip.budget.lines.some(l => l.key === 'drip_kit') && noDrip.budget.lines.some(l => l.key === 'motor_pump'));
  assert.ok(noDrip.requiredXaf > owned.requiredXaf);
});

test('structure already built: the capital plants the structure or the part of it that it can afford', () => {
  const full = plan({ system: 'greenhouse', structure: 'owned', structureM2: 500, capital: 20000 });
  assert.equal(full.state, 'cover_limit');
  assert.equal(full.areaHa, 0.05);
  assert.ok(full.cover.full && full.budget.total < full.capitalXaf);
  const part = plan({ system: 'greenhouse', structure: 'owned', structureM2: 5000, capital: 3000 });
  assert.equal(part.state, 'ok');
  assert.ok(part.areaHa > 0 && part.areaHa < 0.5 && !part.cover.full);
  assert.ok(part.budget.total <= part.capitalXaf * 1.0001 && part.budget.total > part.capitalXaf * 0.99);
  assert.equal(part.cover.m2, 5000);
  // The upkeep covers the whole structure, planted or not.
  assert.ok(Math.abs(part.cover.upkeepXaf - 5000 * kb.protected.upkeep.xaf_m2_day * part.calendar.totalDays) < 1e-6);
  const none = plan({ system: 'greenhouse', structure: 'repair', structureM2: 500, replaceCover: true, capital: 150 });
  assert.equal(none.state, 'upfront_exceeds');
});

test('structure to repair: the new cover and the quoted repairs are bought and charged over the life of a cover', () => {
  const base0 = { system: 'greenhouse', structure: 'repair', structureM2: 500, mode: 'crop' };
  const plain = plan(base0);
  assert.ok(!plain.budget.lines.some(l => l.upfront && l.cat === 'structure'));
  assert.ok(!plain.itinerary.some(s => s.id === 'repair'));
  const r = plan({ ...base0, replaceCover: true, repairXaf: 400000 });
  const SY = kb.protected.systems.greenhouse, coverPrice = SY.price_tiers[0].xaf_m2 * SY.cover_share;
  const cover = r.budget.lines.find(l => l.key === 'greenhouse_cover_new'), rep = r.budget.lines.find(l => l.key === 'structure_repairs');
  assert.ok(cover && cover.upfront && Math.abs(cover.total - 500 * coverPrice) < 1e-6 && cover.lifeSeasons === SY.cover_life_seasons);
  assert.ok(rep && rep.upfront && Math.abs(rep.total - 400000) < 1e-6 && rep.lifeSeasons === SY.cover_life_seasons);
  assert.ok(Math.abs(r.cover.repairsXaf - (500 * coverPrice + 400000)) < 1e-6);
  assert.ok(Math.abs(r.cover.chargedXaf - r.cover.repairsXaf * Math.min(r.seasonsUsed, SY.cover_life_seasons) / SY.cover_life_seasons) < 1e-6);
  assert.ok(Math.abs(r.requiredXaf - plain.requiredXaf - r.cover.repairsXaf * 1.1) < 1);
  assert.ok(r.itinerary.some(s => s.id === 'repair' && s.phase === 'prep'));
  assert.ok(!r.itinerary.some(s => s.id === 'build'));
  assert.ok(Math.abs(r.cashflow.end - r.scenarios.average.cashAfterSeason) < 1);
});

test('structure status: a net house can be already built too, the open field ignores the status', () => {
  const n = plan({ system: 'net', structure: 'owned', structureM2: 720, mode: 'crop' });
  assert.equal(n.cover.status, 'owned');
  assert.ok(!n.budget.lines.some(l => l.upfront && l.cat === 'structure'));
  assert.equal(n.water.option, 'pump');
  const o = plan({ structure: 'owned', structureM2: 720 });
  assert.deepEqual(pick(o), pick(plan({})));
});

test('comparisons: the status applies to the system planned, the other covers are compared as new builds', () => {
  const rows = E.compareSystems(kb, { ...base, system: 'greenhouse', structure: 'owned', structureM2: 500, priceXafKg: 400 });
  const g = rows.find(x => x.system === 'greenhouse'), n = rows.find(x => x.system === 'net');
  assert.equal(g.m2, 500);
  assert.equal(g.upfront < 200000, true);
  assert.equal(n.m2 % kb.protected.module_m2, 0);
  assert.ok(n.upfront > 1000000);
});

test('sweep: every short crop, system, structure status, approach and option gives finite, consistent plans', () => {
  let n = 0;
  for (const crop of SHORT) for (const system of E.systemsFor(kb, crop)) for (const structure of ['new', 'owned', 'repair']) for (const mode of ['budget', 'crop']) for (const capital of [150, 20000]) for (const extra of [{}, { replaceCover: true, repairXaf: 250000, dripInPlace: false, structureM2: 700, fieldWork: 'hire', familyLabour: 0.5, ownTools: true, market: 'city', priceXafKg: 400 }]) {
    const r = plan({ crop, system, structure, mode, capital, area: 0.3, structureM2: 500, start: '2027-09-01', ...extra });
    n++;
    const tag = [crop, system, structure, mode, capital].join(' ');
    assert.ok(Number.isFinite(r.areaHa) && Number.isFinite(r.budget.total), tag);
    assert.ok(r.budget.lines.every(l => Number.isFinite(l.total)), tag);
    for (const s of ['good', 'average', 'poor', 'failure']) assert.ok(Number.isFinite(r.scenarios[s].margin), tag);
    if (mode === 'budget' && r.areaHa > 0 && r.state !== 'below_min') assert.ok(r.budget.total <= r.capitalXaf * 1.0001, tag);
    if (r.areaHa > 0) assert.ok(Math.abs(r.cashflow.end - r.scenarios.average.cashAfterSeason) < 1, tag);
    if (r.state === 'ok') assert.ok(r.areaHa > 0, tag);
  }
  assert.ok(n > 300);
});
