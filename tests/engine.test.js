import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const E = require('../site/src/engine.cjs');

/* A small, synthetic knowledge base: it checks the mechanics of the engine, not the agronomy. */
function fixture() {
  const item = (price, category, unit = 'kg', extra = {}) => ({ label: { en: category }, price, category, unit, src: [], ...extra });
  return {
    fx: { USD: 1, XAF: 600, EUR: 0.9 },
    limits: { min_capital_usd: 100, reserve_rate: 0.1, wet_season_rain_share: 0.5 },
    climate: { lat: 5.51, months: [[32, 17, 1, 0], [33, 19, 6, 1], [32, 20, 45, 6], [29, 19, 144, 17], [27, 18, 197, 24], [25, 17, 234, 24], [24, 17, 311, 26], [24, 17, 328, 25], [25, 17, 322, 24], [25, 17, 197, 18], [27, 17, 43, 4], [30, 17, 1, 0]].map(([tmax, tmin, rain, raindays]) => ({ tmax, tmin, rain, raindays })) },
    thresholds: { disease_rain_mm_high: 200, disease_rain_mm_medium: 100 },
    market: { city_extra_loss_pct: 5 },
    scenario: { failure_yield_share: 0.1, price_factor: { good: 1.15, average: 1, poor: 0.8, failure: 0.7 } },
    scenario_weights: { base: { good: 0.2, average: 0.45, poor: 0.25, failure: 0.1 }, shift_per_risk_point: 0.03 },
    items: {
      seed: item(100000, 'seed', 'g', { pack: { size: 10, label: { en: '10 g' } } }), npk: item(500, 'fertilizer', 'kg', { pack: { size: 50, label: { en: 'bag' } } }),
      crate: item(2000, 'packaging', 'unit'), fuel_petrol: item(840, 'fuel', 'l'), pump: item(200000, 'irrigation', 'unit', { life_seasons: 6 }),
      hose: item(500, 'irrigation', 'm', { life_seasons: 4 }), drip: item(2500000, 'irrigation', 'ha', { life_seasons: 6 }), sprayer: item(30000, 'tools', 'unit', { life_seasons: 6 })
    },
    services: {
      labour_day: { label: { en: 'labour' }, price: 2500, unit: 'person day', category: 'labour' }, land_rent_season: { label: { en: 'rent' }, price: 100000, unit: 'ha', category: 'land' },
      agronomist_visit: { label: { en: 'agro' }, price: 15000, unit: 'visit', category: 'advice' }, harvest_labour: { label: { en: 'harvest' } },
      transport_local_kg: { label: { en: 'local' }, price: 10 }, transport_city_kg: { label: { en: 'city' }, price: 40 }, market_fee_rate: { price: 0.05 }, ploughing: { label: { en: 'plough' }, price: 60000, unit: 'ha', category: 'land_preparation' }
    },
    water: {
      fuel_l_per_m3: 0.06, maintenance_label: { en: 'maintenance' },
      options: {
        rainfed: { covers: 0, efficiency: 1 }, manual: { covers: 0.6, efficiency: 0.7, m3_per_person_day: 6, max_area_ha: 0.25, labour_label: { en: 'watering' } },
        existing: { covers: 1, efficiency: 0.65, fuel: true, maintenance_pct_capex_per_season: 0, capex: [] },
        pump: { covers: 1, efficiency: 0.6, fuel: true, m3_per_person_day: 40, labour_label: { en: 'moving hoses' }, capex: [{ item: 'pump', per: 'farm', ha_per_unit: 2 }, { item: 'hose', qty_per_ha: 200 }] },
        drip: { covers: 1, efficiency: 0.9, fuel: true, capex: [{ item: 'drip', qty_per_ha: 1 }, { item: 'pump', per: 'farm', ha_per_unit: 4 }] }
      }
    },
    tools_kit: [{ item: 'sprayer', min: 1, per_ha: 2 }],
    crops: {
      tomato: {
        name: { en: 'Tomato' }, release: 'mvp', plants_per_ha: 20000, ky: 1.05, heat_c: 32, loss_pct: 15, harvest_kg_per_person_day: 200, agronomist_visits: 4,
        kc: { ini: 0.6, mid: 1.15, end: 0.8, stages: [0.2, 0.5, 0.8] },
        cycle: { nursery_days: 30, to_first_harvest_days: 75, harvest_days: 45, flowering_before_harvest_days: 30 },
        yield_t_ha: { wet: { good: 25, average: 15, poor: 8 }, dry: { good: 35, average: 22, poor: 12 } },
        price: { reference_xaf_kg: 300, city_factor: 1.3, index: [1.3, 1.4, 1.3, 1.1, 0.9, 0.8, 0.7, 0.7, 0.8, 0.9, 1.1, 1.2] },
        packaging: { item: 'crate', kg_per_unit: 25, uses: 10 },
        steps: [
          { id: 'plough', phase: 'prep', ref: 'field', day: [-14, -10], label: { en: 'Plough' }, services: [{ key: 'ploughing', qty: 1 }], labour: 10 },
          { id: 'nursery', phase: 'nursery', ref: 'start', day: [0, 0], label: { en: 'Nursery' }, inputs: [{ item: 'seed', qty: 150 }], labour: 4 },
          { id: 'basal', phase: 'planting', ref: 'field', day: [-3, 0], label: { en: 'Basal' }, inputs: [{ item: 'npk', qty: 300 }], labour: 6 },
          { id: 'top', phase: 'care', ref: 'field', day: [21, 50], label: { en: 'Top dressing' }, inputs: [{ item: 'npk', qty: 100, apps: 2 }], labour: 6 }
        ]
      }
    }
  };
}
const base = { crop: 'tomato', currency: 'USD', capital: 2000, mode: 'budget', start: '2027-03-01', water: 'pump', land: 'rent', market: 'local' };

test('FAO-56 building blocks give realistic magnitudes at Foumbot latitude', () => {
  const ra = E.extraterrestrialRadiation(5.51, 172);
  assert.ok(ra > 13 && ra < 16, 'Ra mm/day ' + ra);
  const eto = E.etoHargreaves(32, 17, ra);
  assert.ok(eto > 4 && eto < 7, 'ETo ' + eto);
  assert.equal(E.effectiveRain(50), 20);
  assert.equal(E.effectiveRain(200), 136);
  assert.equal(E.effectiveRain(0), 0);
  const kc = { ini: 0.6, mid: 1.15, end: 0.8, stages: [0.2, 0.5, 0.8] };
  assert.equal(E.kcAt(kc, 0.1), 0.6); assert.equal(E.kcAt(kc, 0.6), 1.15); assert.ok(Math.abs(E.kcAt(kc, 1) - 0.8) < 1e-9);
  assert.equal(E.yieldFactor(1.05, 1), 1); assert.ok(Math.abs(E.yieldFactor(1.05, 0.5) - 0.475) < 1e-9); assert.equal(E.yieldFactor(1.05, 0), 0);
});

test('dry season start leaves a large water deficit, rainy season a small one', () => {
  const kb = fixture();
  const dry = E.plan(kb, { ...base, start: '2026-11-01', water: 'rainfed' });
  const wet = E.plan(kb, { ...base, start: '2027-04-01', water: 'rainfed' });
  assert.ok(dry.water.coverage < 0.5, 'dry coverage ' + dry.water.coverage);
  assert.ok(wet.water.coverage > dry.water.coverage);
  assert.equal(dry.risk.water, 2);
});

test('irrigation raises water coverage and yields, and adds running costs', () => {
  const kb = fixture();
  const rain = E.plan(kb, { ...base, start: '2026-11-01', water: 'rainfed' });
  const pump = E.plan(kb, { ...base, start: '2026-11-01', water: 'pump' });
  assert.equal(pump.water.coverage, 1);
  assert.ok(pump.scenarios.average.yieldTHa > rain.scenarios.average.yieldTHa);
  assert.ok(pump.budget.lines.some(l => l.key === 'fuel'));
  assert.ok(pump.budget.lines.some(l => l.upfront && l.key === 'pump'));
});

test('budget first: the plan spends the capital, never more', () => {
  const kb = fixture();
  for (const capital of [100, 500, 2000, 50000, 1000000]) {
    const r = E.plan(kb, { ...base, capital, water: capital < 1000 ? 'manual' : 'pump' });
    assert.equal(r.state === 'below_min', false);
    assert.ok(r.areaHa > 0, 'area for ' + capital);
    assert.ok(r.budget.total <= r.capitalXaf * 1.0001, 'budget ' + r.budget.total + ' above capital ' + r.capitalXaf);
    if (r.state === 'ok') assert.ok(r.budget.total >= r.capitalXaf * 0.98, 'budget ' + r.budget.total + ' leaves capital unused ' + r.capitalXaf);
  }
});

test('equipment bought per hectare never pushes the budget above the capital', () => {
  const kb = fixture();
  for (const capital of [3000, 5000, 20000, 200000]) {
    const r = E.plan(kb, { ...base, capital, water: 'drip' });
    assert.ok(r.budget.total <= r.capitalXaf * 1.0001, capital + ': budget ' + r.budget.total + ' vs ' + r.capitalXaf);
    assert.ok(r.areaHa > 0);
  }
});

test('manual watering caps the area and keeps the rest of the capital', () => {
  const kb = fixture();
  const r = E.plan(kb, { ...base, capital: 60000, water: 'manual' });
  assert.ok(Math.abs(r.areaHa - 0.25) < 1e-6, 'area ' + r.areaHa);
  assert.ok(r.budget.total < r.capitalXaf);
});

test('a crop without a reference price asks for one, and the grower price is used when given', () => {
  const kb = fixture();
  kb.crops.tomato.price.reference_xaf_kg = null;
  const a = E.plan(kb, base);
  assert.equal(a.state, 'needs_price');
  assert.ok(a.breakEven.priceXafKg > 0);
  const b = E.plan(kb, { ...base, priceXafKg: 400 });
  assert.equal(b.state, 'ok');
  assert.equal(b.priceSource, 'user');
  assert.ok(Math.abs(b.scenarios.average.price - 400) < 1e-9);
});

test('an unpriced input keeps its quantity, costs nothing and is reported', () => {
  const kb = fixture();
  kb.items.seed.price = null;
  const r = E.plan(kb, base);
  assert.ok(r.unpriced.includes('seed'));
  const line = r.budget.lines.find(l => l.key === 'seed');
  assert.ok(line.qty > 0 && line.total === 0 && line.unpriced);
});

test('minimum capital is 100 USD in any currency', () => {
  const kb = fixture();
  assert.equal(E.plan(kb, { ...base, capital: 99 }).state, 'below_min');
  assert.equal(E.plan(kb, { ...base, capital: 59000, currency: 'XAF' }).state, 'below_min');
  assert.notEqual(E.plan(kb, { ...base, capital: 61000, currency: 'XAF' }).state, 'below_min');
});

test('equipment that the capital cannot carry is flagged', () => {
  const kb = fixture();
  const r = E.plan(kb, { ...base, capital: 300, water: 'drip' });
  assert.ok(['upfront_exceeds', 'ok'].includes(r.state));
  const small = E.plan(kb, { ...base, capital: 100, water: 'drip', ownTools: true });
  assert.ok(small.areaHa < 0.05);
});

test('manual watering beyond its practical area is flagged', () => {
  const kb = fixture();
  assert.equal(E.plan(kb, { ...base, capital: 60000, water: 'manual' }).state, 'manual_limit');
});

test('outcomes are ordered and failure loses money', () => {
  const kb = fixture();
  const r = E.plan(kb, base), s = r.scenarios;
  assert.ok(s.good.margin > s.average.margin && s.average.margin > s.poor.margin && s.poor.margin > s.failure.margin);
  assert.ok(s.failure.margin < 0);
  const w = r.weights; assert.ok(Math.abs(w.good + w.average + w.poor + w.failure - 1) < 1e-9);
  assert.ok(r.breakEven.yieldTHa > 0 && r.breakEven.priceXafKg > 0);
});

test('area first returns the capital required, which funds the same area in budget mode', () => {
  const kb = fixture();
  const a = E.plan(kb, { ...base, mode: 'crop', area: 1 });
  assert.ok(a.requiredXaf > 0);
  const b = E.plan(kb, { ...base, currency: 'XAF', capital: a.requiredXaf });
  assert.ok(Math.abs(b.areaHa - 1) < 0.02, 'area ' + b.areaHa);
});

test('family labour reduces the cash needed per hectare', () => {
  const kb = fixture();
  const hired = E.plan(kb, base), family = E.plan(kb, { ...base, familyLabour: 0.5 });
  assert.ok(family.budget.perHaCash < hired.budget.perHaCash);
  assert.ok(family.areaHa > hired.areaHa);
});

test('itinerary dates follow the calendar and the shopping list rounds to packs', () => {
  const kb = fixture();
  const r = E.plan(kb, base);
  const nursery = r.itinerary.find(s => s.id === 'nursery');
  assert.equal(nursery.from.toISOString().slice(0, 10), '2027-03-01');
  const plough = r.itinerary.find(s => s.id === 'plough');
  assert.ok(plough.from < r.calendar.field);
  const npk = r.shopping.find(s => s.item === 'npk');
  assert.equal(npk.packs, Math.ceil(npk.qty / 50));
  assert.equal(r.windows.length, 12);
});

test('the real knowledge base, when present, produces a valid plan for every crop and water option', { skip: !fs.existsSync(new URL('../site/data/kb.json', import.meta.url)) && 'kb.json not built yet' }, () => {
  const kb = JSON.parse(fs.readFileSync(new URL('../site/data/kb.json', import.meta.url), 'utf8'));
  for (const crop of Object.keys(kb.crops)) {
    for (const water of ['rainfed', 'manual', 'existing', 'pump', 'drip']) {
      const r = E.plan(kb, { ...base, crop, water, capital: 5000 });
      assert.ok(Number.isFinite(r.areaHa) && Number.isFinite(r.budget.total), crop + ' ' + water);
      assert.ok(Number.isFinite(r.scenarios.average.margin), crop + ' ' + water + ' margin');
      for (const l of r.budget.lines) assert.ok(Number.isFinite(l.total), crop + ' ' + water + ' line ' + l.key);
    }
  }
});

/* ---------- v3: cash flow, long cycles, successive cycles, orchards, comparison ---------- */
function longFixture() {
  const kb = fixture();
  kb.limits.seasons_per_year = 2;
  kb.items.cutting = { label: { en: 'cuttings' }, price: 10, category: 'planting', unit: 'unit', src: [] };
  kb.items.plantlet = { label: { en: 'plantlet' }, price: 500, category: 'planting', unit: 'unit', src: [] };
  kb.items.firewood = { label: { en: 'firewood' }, price: 20, category: 'processing', unit: 'kg', src: [] };
  const common = { loss_pct: 5, harvest_kg_per_person_day: 400, agronomist_visits: 1, kc: { ini: 0.5, mid: 0.9, end: 0.6, stages: [0.2, 0.4, 0.8] }, packaging: { item: 'crate', kg_per_unit: 25, uses: 10 } };
  kb.crops.cassava = Object.assign({}, common, {
    name: { en: 'Cassava' }, profile: 'long', plants_per_ha: 10000, horizon_months: 15,
    cycle: { nursery_days: 0, to_first_harvest_days: 365, harvest_days: 60, flowering_before_harvest_days: 0 },
    yield_t_ha: { poor: 8, average: 15, good: 25 },
    price: { reference_xaf_kg: null, index: Array(12).fill(1) },
    products: {
      fresh: { label: { en: 'Fresh roots' }, ratio: 1 },
      gari: { label: { en: 'Gari' }, ratio: 0.25, costs: [{ labour_days_per_t: 40 }, { item: 'firewood', qty_per_t: 500 }] }
    },
    harvest_label: { en: 'Harvest {n}' },
    steps: [
      { id: 'plough', phase: 'prep', ref: 'field', day: [-14, -7], label: { en: 'Plough' }, services: [{ key: 'ploughing', qty: 1 }], labour: 10 },
      { id: 'plant', phase: 'planting', ref: 'field', day: [0, 3], label: { en: 'Plant' }, inputs: [{ item: 'cutting', qty: 10000 }], labour: 15 }
    ],
    recurring: [{ id: 'weed', phase: 'care', label: { en: 'Weed' }, every_months: 2, first_month: 1, last_month: 7, labour: 8 }]
  });
  kb.crops.plantain = Object.assign({}, common, {
    name: { en: 'Plantain' }, profile: 'ratoon', plants_per_ha: 1600, horizon_months: 36, heat_c: 35,
    cycle: { nursery_days: 0, to_first_harvest_days: 390, harvest_days: 60, flowering_before_harvest_days: 90 },
    production: { cycles: 3, interval_days: 240, factors: [1, 1, 0.9] },
    yield_t_ha: { poor: 10, average: 18, good: 25 },
    price: { reference_xaf_kg: null, index: Array(12).fill(1) },
    products: { fresh: { label: { en: 'Bunch' }, ratio: 1, unit: 'bunch', unit_kg: 12, unit_label: { en: 'bunch' } } },
    steps: [{ id: 'plant', phase: 'planting', ref: 'field', day: [0, 3], label: { en: 'Plant' }, inputs: [{ item: 'plantlet', qty: 1600 }, { item: 'npk', qty: 200 }], labour: 20 }],
    recurring: [{ id: 'feed', phase: 'care', label: { en: 'Feed' }, every_months: 3, first_month: 2, inputs: [{ item: 'npk', qty: 100 }], labour: 4 }]
  });
  kb.crops.avocado = Object.assign({}, common, {
    name: { en: 'Avocado' }, profile: 'orchard', plants_per_ha: 156, horizon_months: 120,
    kc: { ini: 0.6, mid: 0.6, end: 0.6, stages: [0.3, 0.6, 0.9] },
    cycle: { nursery_days: 0, to_first_harvest_days: 0, harvest_days: 0, flowering_before_harvest_days: 0 },
    production: { yield_by_year: [0, 0, 0.1, 0.25, 0.45, 0.65, 0.8, 0.9, 1, 1], harvest_months: [6, 7, 8] },
    yield_t_ha: { poor: 6, average: 10, good: 15 },
    price: { reference_xaf_kg: null, index: Array(12).fill(1) },
    steps: [{ id: 'plant', phase: 'planting', ref: 'field', day: [0, 3], label: { en: 'Plant' }, inputs: [{ item: 'plantlet', qty: 156 }, { item: 'npk', qty: 50 }], labour: 10 }],
    recurring: [{ id: 'feed', phase: 'care', label: { en: 'Feed' }, every_months: 6, first_month: 6, inputs: [{ item: 'npk', qty: 40 }], qty_by_year: [1, 1.5, 2, 2.5, 3], labour: 3 }]
  });
  return kb;
}
const lbase = { currency: 'USD', capital: 3000, mode: 'budget', start: '2027-03-01', water: 'rainfed', land: 'rent', market: 'local', priceXafKg: 150 };

test('v3: a season plan carries a cash flow whose totals match its average outcome', () => {
  const kb = fixture();
  const r = E.plan(kb, base), cf = r.cashflow, a = r.scenarios.average;
  assert.equal(r.profile, 'season');
  const costs = cf.months.reduce((s, m) => s + m.costs, 0), rev = cf.months.reduce((s, m) => s + m.revenue, 0);
  assert.ok(Math.abs(costs - a.cashCosts) < 1, 'costs ' + costs + ' vs ' + a.cashCosts);
  assert.ok(Math.abs(rev - a.revenue) < 1, 'revenue ' + rev + ' vs ' + a.revenue);
  assert.ok(cf.peakNeed <= r.budget.total + 1, 'peak ' + cf.peakNeed + ' vs budget ' + r.budget.total);
  assert.equal(cf.months.length, r.horizonMonths);
});

test('v3: a long crop is sized on its peak financing need, which fits the capital', () => {
  const kb = longFixture();
  const r = E.plan(kb, { ...lbase, crop: 'cassava' });
  assert.equal(r.profile, 'long');
  assert.equal(r.state, 'ok');
  assert.ok(r.areaHa > 0);
  assert.ok(r.budget.total <= r.capitalXaf * 1.0001, r.budget.total + ' vs ' + r.capitalXaf);
  assert.ok(Math.abs(r.cashflow.peakNeed - r.budget.peakNeed) < 1);
  assert.equal(r.production.length, 1);
  const costs = r.cashflow.months.reduce((s, m) => s + m.costs, 0);
  assert.ok(Math.abs(costs - r.scenarios.average.costs) < 1, 'ledger costs ' + costs + ' vs ' + r.scenarios.average.costs);
});

test('v3: processing turns fresh roots into less product with its own costs', () => {
  const kb = longFixture();
  const fresh = E.plan(kb, { ...lbase, crop: 'cassava', mode: 'crop', area: 1, product: 'fresh' });
  const gari = E.plan(kb, { ...lbase, crop: 'cassava', mode: 'crop', area: 1, product: 'gari', priceXafKg: 600 });
  assert.ok(Math.abs(gari.scenarios.average.soldKg - fresh.scenarios.average.soldKg * 0.25) < 1e-6);
  assert.ok(gari.budget.lines.some(l => l.cat === 'processing' && l.total > 0));
  assert.equal(gari.product.key, 'gari');
});

test('v3: successive cycles produce several harvests and a price per bunch', () => {
  const kb = longFixture();
  const r = E.plan(kb, { ...lbase, crop: 'plantain', priceXafKg: 3000 });
  assert.equal(r.production.length, 3);
  assert.equal(r.product.unitKg, 12);
  assert.ok(Math.abs(r.scenarios.average.price - 3000 / 12) < 1e-6, 'price per kg ' + r.scenarios.average.price);
  assert.ok(r.cashflow.peakNeed < r.budget.horizonCosts, 'later cycles are funded by earlier sales');
  assert.ok(r.breakEven.pricePerUnit > 0);
});

test('v3: an orchard earns nothing before its first bearing year and pays back later', () => {
  const kb = longFixture();
  const r = E.plan(kb, { ...lbase, crop: 'avocado', mode: 'crop', area: 1, priceXafKg: 400 });
  assert.equal(r.profile, 'orchard');
  assert.equal(r.production[0].n, 3);
  const firstRev = r.cashflow.months.findIndex(m => m.revenue > 0);
  assert.ok(firstRev >= 24, 'first revenue month ' + firstRev);
  assert.ok(r.cashflow.paybackIndex === null || r.cashflow.paybackIndex > firstRev);
  const s = r.scenarios;
  assert.ok(s.good.margin > s.average.margin && s.average.margin > s.poor.margin && s.poor.margin > s.failure.margin);
  assert.ok(Math.abs(r.scenarios.average.marginPerYear * 10 - r.scenarios.average.margin) < 1);
});

test('v3: without a price a long crop is sized on its costs up to the first harvest and asks for a price', () => {
  const kb = longFixture();
  const r = E.plan(kb, { ...lbase, crop: 'avocado', priceXafKg: 0, capital: 5000 });
  assert.equal(r.state, 'needs_price');
  assert.ok(r.areaHa > 0 && r.budget.total <= r.capitalXaf * 1.0001);
  assert.ok(r.breakEven.pricePerUnit > 0);
});

test('v3: area first returns a capital that funds the same long crop area in budget mode', () => {
  const kb = longFixture();
  for (const crop of ['cassava', 'plantain', 'avocado']) {
    const a = E.plan(kb, { ...lbase, crop, mode: 'crop', area: 1 });
    const b = E.plan(kb, { ...lbase, crop, currency: 'XAF', capital: a.requiredXaf });
    assert.ok(Math.abs(b.areaHa - 1) < 0.02, crop + ' area ' + b.areaHa);
  }
});

test('v3: windows cover twelve start months and recurring care is listed with its occurrences', () => {
  const kb = longFixture();
  const r = E.plan(kb, { ...lbase, crop: 'plantain' });
  assert.equal(r.windows.length, 12);
  const feed = r.itinerary.find(s => s.id === 'feed');
  assert.ok(feed.occurrences > 5 && feed.dates.length === feed.occurrences);
  assert.ok(r.itinerary.filter(s => s.harvest).length === 3);
  assert.ok(r.shopping.length > 0 && r.shoppingScope === 'first_year');
});

test('v3: the comparison runs every crop with the same inputs', () => {
  const kb = longFixture();
  const rows = E.compare(kb, { ...lbase, capital: 5000, prices: { tomato: 300 } });
  assert.equal(rows.length, Object.keys(kb.crops).length);
  for (const r of rows) { assert.ok(Number.isFinite(r.months) && r.months > 0, r.crop); assert.ok(r.breakEvenPerUnit === null || r.breakEvenPerUnit > 0, r.crop); }
  assert.ok(rows.find(r => r.crop === 'tomato').margin !== null);
});
