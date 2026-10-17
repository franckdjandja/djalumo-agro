/* AfriFarm Intelligent · Season Plan engine v2
   Pure functions, no DOM. Runs in the browser (bundled by site/build.mjs) and in Node tests.
   Every reference value lives in the knowledge base (site/data/kb.json) with its source ids.

   Method, in order:
   1. Calendar: nursery, transplanting (or direct sowing), first and last harvest dates.
   2. Water balance (FAO-56): reference evapotranspiration by Hargreaves from monthly Tmax/Tmin and
      extraterrestrial radiation at the site latitude; crop evapotranspiration ETc = Kc x ETo with a
      four stage Kc curve; dependable rainfall (FAO/AGLW formula); irrigation need = ETc not covered by rain.
   3. Yield response to water (FAO-33): 1 - Ya/Ym = Ky (1 - ETa/ETm), with the supply allowed by the
      chosen water option.
   4. Costs per hectare from the standard itinerary: inputs x unit prices, labour x wage, services,
      plus water costs; capital items (irrigation system, tools) are charged up front.
   5. Sizing: the area the capital carries after up front items and a contingency reserve, or the
      capital required for the area asked.
   6. Four outcome scenarios (good, average, poor, failure): yield x price at harvest, harvest related
      costs scaled to the volume, margin, return on investment, break even yield and price.
   7. Risks for the chosen window: water, heat at flowering, disease pressure, market glut. */
'use strict';

const DAY = 864e5;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k; };

/* ---------- Climate and water (FAO-56, FAO-33) ---------- */
function dayOfYear(d) { const s = Date.UTC(d.getUTCFullYear(), 0, 0); return Math.floor((d - s) / DAY); }

/** Extraterrestrial radiation Ra in mm/day of evaporation equivalent (FAO-56 eq. 21, x 0.408). */
function extraterrestrialRadiation(latDeg, doy) {
  const phi = latDeg * Math.PI / 180;
  const dr = 1 + 0.033 * Math.cos(2 * Math.PI * doy / 365);
  const delta = 0.409 * Math.sin(2 * Math.PI * doy / 365 - 1.39);
  const ws = Math.acos(clampN(-Math.tan(phi) * Math.tan(delta), -1, 1));
  const ra = (24 * 60 / Math.PI) * 0.0820 * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
  return ra * 0.408;
}

/** Hargreaves reference evapotranspiration, mm/day (FAO-56 eq. 52). */
function etoHargreaves(tmax, tmin, raMm) {
  const tmean = (tmax + tmin) / 2;
  return 0.0023 * (tmean + 17.8) * Math.sqrt(Math.max(0, tmax - tmin)) * raMm;
}

/** Dependable monthly rainfall, mm (FAO/AGLW formula used in CROPWAT). */
function effectiveRain(p) { return p <= 70 ? Math.max(0, 0.6 * p - 10) : 0.8 * p - 24; }

/** Kc on a given fraction of the field period: initial, development, mid season, late season (FAO-56). */
function kcAt(kc, f) {
  const [a, b, c] = kc.stages; // cumulative ends of initial, development, mid season
  if (f <= a) return kc.ini;
  if (f <= b) return kc.ini + (kc.mid - kc.ini) * (f - a) / (b - a);
  if (f <= c) return kc.mid;
  return kc.mid + (kc.end - kc.mid) * (f - c) / (1 - c);
}

function daysInMonth(y, m) { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }

/** Month by month water balance over the field period. */
function waterBalance(kb, crop, fieldStart, fieldDays) {
  const C = kb.climate, rows = [];
  let cur = null;
  for (let i = 0; i < fieldDays; i++) {
    const d = new Date(fieldStart.getTime() + i * DAY);
    const m = d.getUTCMonth(), y = d.getUTCFullYear();
    const cm = C.months[m];
    const eto = etoHargreaves(cm.tmax, cm.tmin, extraterrestrialRadiation(C.lat, dayOfYear(d)));
    const etc = kcAt(crop.kc, (i + 0.5) / fieldDays) * eto;
    const peff = effectiveRain(cm.rain) / daysInMonth(y, m);
    if (!cur || cur.month !== m || cur.year !== y) { cur = { year: y, month: m, days: 0, eto: 0, etc: 0, peff: 0 }; rows.push(cur); }
    cur.days += 1; cur.eto += eto; cur.etc += etc; cur.peff += peff;
  }
  let etc = 0, met = 0;
  rows.forEach(r => { r.met = Math.min(r.etc, r.peff); r.deficit = r.etc - r.met; etc += r.etc; met += r.met; });
  return { rows, etcTotal: etc, rainMet: met, deficit: etc - met, rainCoverage: etc ? met / etc : 1 };
}

/** FAO-33 yield response to water. */
function yieldFactor(ky, etaOverEtm) { return clampN(1 - ky * (1 - clampN(etaOverEtm, 0, 1)), 0, 1); }

/* ---------- Calendar ---------- */
function calendar(crop, startISO) {
  const start = new Date(startISO + 'T00:00:00Z');
  const n = crop.cycle.nursery_days || 0;
  const field = new Date(start.getTime() + n * DAY);
  const firstHarvest = new Date(field.getTime() + crop.cycle.to_first_harvest_days * DAY);
  const lastHarvest = new Date(firstHarvest.getTime() + crop.cycle.harvest_days * DAY);
  const flowering = new Date(firstHarvest.getTime() - crop.cycle.flowering_before_harvest_days * DAY);
  const fieldDays = Math.round((lastHarvest - field) / DAY);
  return { start, field, flowering, firstHarvest, lastHarvest, fieldDays, totalDays: n + fieldDays, nurseryDays: n };
}
const monthsBetween = (a, b) => { const out = []; const d = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), 1)); while (d <= b) { out.push(d.getUTCMonth()); d.setUTCMonth(d.getUTCMonth() + 1); } return out; };

/* ---------- Costs ---------- */
function unitPrice(kb, key) {
  const it = kb.items[key];
  if (!it) throw new Error('Unknown item ' + key);
  return it.price;
}

/** Cost lines for one hectare, before water and before harvest related costs. */
function hectareLines(kb, crop, opts) {
  const lines = [];
  const add = (cat, key, label, qty, unit, price, kind, step, src) => lines.push({ cat, key, label, qty, unit, price, total: qty * price, kind: kind || 'cash', step: step || null, src: src || [] });
  const S = kb.services;
  for (const step of crop.steps) {
    for (const inp of step.inputs || []) {
      const it = kb.items[inp.item];
      add(it.category, inp.item, it.label, inp.qty * (inp.apps || 1), it.unit, it.price, 'cash', step.id, [].concat(inp.src || [], it.src || []));
    }
    if (step.labour) add('labour', 'labour_' + step.id, step.label, step.labour, 'person day', S.labour_day.price, 'labour', step.id, step.src || []);
    for (const sv of step.services || []) {
      const s = S[sv.key];
      add(s.category, sv.key, s.label, sv.qty, s.unit, s.price, 'cash', step.id, s.src || []);
    }
  }
  if (opts.land === 'rent') add('land', 'land_rent', S.land_rent_season.label, 1, S.land_rent_season.unit, S.land_rent_season.price, 'cash', null, S.land_rent_season.src);
  const visits = crop.agronomist_visits || 0;
  if (visits) add('advice', 'agronomist', S.agronomist_visit.label, visits, S.agronomist_visit.unit, S.agronomist_visit.price, 'cash', null, S.agronomist_visit.src);
  // Family labour share reduces the cash paid for labour (the work still has to be done).
  const share = clampN(opts.familyLabour || 0, 0, 0.9);
  lines.forEach(l => { if (l.kind === 'labour') { l.cashFactor = 1 - share; } });
  return lines;
}

/** Water option: up front items, running costs per hectare, share of the deficit covered, efficiency. */
function waterPlan(kb, wb, opt, areaHint) {
  const W = kb.water;
  const o = W.options[opt];
  const grossM3PerHa = (o.covers > 0 && o.efficiency) ? wb.deficit * o.covers / o.efficiency * 10 : 0; // mm x 10 = m3/ha
  const perHa = [];
  if (grossM3PerHa > 0) {
    if (o.fuel) perHa.push({ cat: 'irrigation', key: 'fuel', label: kb.items.fuel_petrol.label, qty: grossM3PerHa * W.fuel_l_per_m3, unit: 'l', price: kb.items.fuel_petrol.price, src: [].concat(kb.items.fuel_petrol.src, W.src_fuel || []) });
    if (o.m3_per_person_day) perHa.push({ cat: 'labour', key: 'labour_watering', label: o.labour_label, qty: grossM3PerHa / o.m3_per_person_day, unit: 'person day', price: kb.services.labour_day.price, kind: 'labour', src: o.src || [] });
    if (o.maintenance_pct_capex_per_season && o.capex) {
      const capex = o.capex.reduce((a, c) => a + c.qty_per_ha * kb.items[c.item].price, 0);
      perHa.push({ cat: 'irrigation', key: 'maintenance', label: W.maintenance_label, qty: 1, unit: 'season', price: capex * o.maintenance_pct_capex_per_season, src: o.src || [] });
    }
  }
  perHa.forEach(l => { l.total = l.qty * l.price; });
  return { option: opt, covers: o.covers, efficiency: o.efficiency, grossM3PerHa, perHa, capex: o.capex || [], maxAreaHa: o.max_area_ha || null };
}

/** Up front capital items for a given area (irrigation equipment, tools). Pumps and tanks are per farm, drip per hectare. */
function upfrontLines(kb, water, areaHa, opts) {
  const lines = [];
  for (const c of water.capex) {
    const it = kb.items[c.item];
    const qty = c.per === 'farm' ? Math.max(1, Math.ceil(areaHa / (c.ha_per_unit || 1e9))) : c.qty_per_ha * areaHa;
    lines.push({ cat: 'equipment', key: c.item, label: it.label, qty: c.per === 'farm' ? qty : qty, unit: it.unit, price: it.price, total: qty * it.price, lifeSeasons: it.life_seasons || 1, src: it.src || [] });
  }
  if (!opts.ownTools) {
    for (const t of kb.tools_kit) {
      const it = kb.items[t.item];
      const qty = Math.max(t.min || 1, Math.ceil(areaHa * (t.per_ha || 0)));
      lines.push({ cat: 'equipment', key: t.item, label: it.label, qty, unit: it.unit, price: it.price, total: qty * it.price, lifeSeasons: it.life_seasons || 1, src: it.src || [] });
    }
  }
  return lines;
}

/** Harvest related costs per kilogram sold (packaging, transport, market fees are applied to revenue). */
function perKgCosts(kb, crop, opts) {
  const S = kb.services, out = [];
  const pk = crop.packaging;
  if (pk) out.push({ cat: 'harvest', key: pk.item, label: kb.items[pk.item].label, perKg: kb.items[pk.item].price / pk.kg_per_unit / (pk.uses || 1), src: kb.items[pk.item].src || [] });
  out.push({ cat: 'harvest', key: 'harvest_labour', label: S.harvest_labour.label, perKg: S.labour_day.price / crop.harvest_kg_per_person_day, labour: true, src: [].concat(S.labour_day.src || [], crop.harvest_src || []) });
  if (opts.market === 'city') out.push({ cat: 'harvest', key: 'transport_city', label: S.transport_city_kg.label, perKg: S.transport_city_kg.price, src: S.transport_city_kg.src || [] });
  else out.push({ cat: 'harvest', key: 'transport_local', label: S.transport_local_kg.label, perKg: S.transport_local_kg.price, src: S.transport_local_kg.src || [] });
  return out;
}

/* ---------- Risks ---------- */
function risks(kb, crop, cal, wb, waterOpt, waterCoverage) {
  const C = kb.climate.months;
  const flowerMonths = monthsBetween(cal.flowering, cal.firstHarvest);
  const reproMonths = monthsBetween(cal.flowering, cal.lastHarvest);
  const harvestMonths = monthsBetween(cal.firstHarvest, cal.lastHarvest);
  const tmaxFlower = Math.max(...flowerMonths.map(m => C[m].tmax));
  const heat = tmaxFlower >= crop.heat_c ? 2 : tmaxFlower >= crop.heat_c - 2 ? 1 : 0;
  const wetDays = Math.max(...reproMonths.map(m => C[m].raindays));
  const disease = wetDays >= kb.thresholds.disease_raindays_high ? 2 : wetDays >= kb.thresholds.disease_raindays_medium ? 1 : 0;
  const water = waterCoverage >= 0.9 ? 0 : waterCoverage >= 0.7 ? 1 : 2;
  const idx = harvestMonths.reduce((a, m) => a + crop.price.index[m], 0) / harvestMonths.length;
  const market = idx <= 0.85 ? 2 : idx <= 0.97 ? 1 : 0;
  return { heat, disease, water, market, tmaxFlower, wetDays, priceIndex: idx, flowerMonths, harvestMonths, score: heat + disease + water + market };
}

/* ---------- Scenarios ---------- */
const SCEN = ['good', 'average', 'poor', 'failure'];
function scenarioWeights(kb, r) {
  const w = Object.assign({}, kb.scenario_weights.base);
  const shift = kb.scenario_weights.shift_per_risk_point * r.score;
  const take = Math.min(shift, w.good + w.average - 0.15);
  const fromGood = Math.min(w.good - 0.02, take * 0.5), fromAvg = take - fromGood;
  w.good -= fromGood; w.average -= fromAvg; w.poor += take * 0.6; w.failure += take * 0.4;
  return w;
}

/* ---------- Main ---------- */
function plan(kb, input) {
  const crop = kb.crops[input.crop];
  if (!crop) throw new Error('Unknown crop');
  const fx = kb.fx[input.currency] || 1;
  const capitalXaf = input.mode === 'crop' ? null : (+input.capital || 0) * (input.currency === 'XAF' ? 1 : kb.fx.XAF / fx);
  const minXaf = kb.limits.min_capital_usd * kb.fx.XAF;
  const opts = { land: input.land || 'rent', familyLabour: input.familyLabour || 0, market: input.market || 'local', ownTools: !!input.ownTools };

  const cal = calendar(crop, input.start);
  const wb = waterBalance(kb, crop, cal.field, cal.fieldDays);
  const water = waterPlan(kb, wb, input.water || 'rainfed');
  const coverage = clampN((wb.rainMet + wb.deficit * water.covers) / wb.etcTotal, 0, 1);
  const wf = yieldFactor(crop.ky, coverage);
  const risk = risks(kb, crop, cal, wb, input.water, coverage);

  // Per hectare cash costs (fixed with area) and per kg costs (scale with the harvest)
  const ha = hectareLines(kb, crop, opts).concat(water.perHa.map(l => Object.assign({ kind: l.kind || 'cash' }, l)));
  const cashOf = l => l.total * (l.cashFactor !== undefined ? l.cashFactor : 1);
  const perHaCash = ha.reduce((a, l) => a + cashOf(l), 0);
  const kgLines = perKgCosts(kb, crop, opts);
  const familyShare = clampN(opts.familyLabour, 0, 0.9);
  const perKgCash = kgLines.reduce((a, k) => a + k.perKg * (k.labour ? 1 - familyShare : 1), 0);

  const loss = crop.loss_pct / 100;
  const regime = (input.water === 'rainfed' || input.water === 'manual') ? 'rainfed' : 'irrigated';
  const yields = crop.yield_t_ha[regime];
  const avgSoldKgHa = yields.average * 1000 * wf * (1 - loss);
  const budgetPerHa = perHaCash + avgSoldKgHa * perKgCash; // cash to finance one hectare until sale
  const reserveRate = kb.limits.reserve_rate;

  // Sizing
  let area, required = null, state = 'ok', upfront;
  if (input.mode === 'crop') {
    area = Math.max(0, +input.area || 0);
    upfront = upfrontLines(kb, water, area, opts);
    const up = upfront.reduce((a, l) => a + l.total, 0);
    required = (up + area * budgetPerHa) * (1 + reserveRate);
  } else {
    if (capitalXaf < minXaf) state = 'below_min';
    // Up front items depend on the area: iterate to a fixed point (converges in a few rounds)
    area = Math.max(0, capitalXaf / (1 + reserveRate) / budgetPerHa);
    for (let k = 0; k < 6; k++) {
      upfront = upfrontLines(kb, water, area, opts);
      const up = upfront.reduce((a, l) => a + l.total, 0);
      area = Math.max(0, (capitalXaf / (1 + reserveRate) - up) / budgetPerHa);
    }
    upfront = upfrontLines(kb, water, area, opts);
    if (area <= 0 && state === 'ok') state = 'upfront_exceeds';
  }
  if (water.maxAreaHa && area > water.maxAreaHa) state = state === 'ok' ? 'manual_limit' : state;

  const upTotal = upfront.reduce((a, l) => a + l.total, 0);
  const upPerSeason = upfront.reduce((a, l) => a + l.total / (l.lifeSeasons || 1), 0);
  const fieldCash = area * perHaCash;

  // Budget lines for the area (cash), grouped by category
  const lines = ha.map(l => Object.assign({}, l, { qty: l.qty * area, total: cashOf(l) * area }))
    .concat(kgLines.map(k => ({ cat: k.cat, key: k.key, label: k.label, qty: avgSoldKgHa * area, unit: 'kg', price: k.perKg * (k.labour ? 1 - familyShare : 1), total: avgSoldKgHa * area * k.perKg * (k.labour ? 1 - familyShare : 1), src: k.src })))
    .concat(upfront.map(l => Object.assign({ upfront: true }, l)));
  const operating = lines.filter(l => !l.upfront).reduce((a, l) => a + l.total, 0);
  const reserve = (operating + upTotal) * reserveRate;
  const totalBudget = operating + upTotal + reserve;

  // Scenarios
  const priceAvg = cal ? risk.harvestMonths.reduce((a, m) => a + crop.price.index[m], 0) / risk.harvestMonths.length * crop.price.reference_xaf_kg : 0;
  const scen = {};
  for (const s of SCEN) {
    const yHa = s === 'failure' ? yields.average * kb.scenario.failure_yield_share : yields[s] * wf;
    const price = priceAvg * kb.scenario.price_factor[s];
    const soldKg = yHa * 1000 * (1 - loss) * area;
    const revenue = soldKg * price * (1 - kb.services.market_fee_rate.price);
    const harvestCosts = soldKg * perKgCash;
    const costs = fieldCash + harvestCosts + upPerSeason;
    const cashCosts = fieldCash + harvestCosts + upTotal;
    const margin = revenue - costs;
    scen[s] = { yieldTHa: yHa, price, soldKg, revenue, costs, cashCosts, margin, roi: costs ? margin / costs : 0, cashAfterSeason: revenue - cashCosts };
  }
  const w = scenarioWeights(kb, risk);
  const expected = SCEN.reduce((a, s) => a + w[s] * scen[s].margin, 0);
  // Break even at the average scenario: yield needed at the average price, and price needed at the average yield
  const sa = scen.average;
  const netPrice = sa.price * (1 - kb.services.market_fee_rate.price) - perKgCash;
  const fixed = fieldCash + upPerSeason;
  const beYieldTHa = area > 0 && netPrice > 0 ? fixed / (netPrice * 1000 * (1 - loss) * area) : null;
  const beYieldPerUnit = sa.soldKg > 0 ? (fixed / sa.soldKg + perKgCash) / (1 - kb.services.market_fee_rate.price) : null;

  // Best start month for the same inputs (water option kept)
  const windows = [];
  const y0 = new Date(input.start + 'T00:00:00Z').getUTCFullYear();
  for (let m = 0; m < 12; m++) {
    const st = new Date(Date.UTC(y0, m, 1)).toISOString().slice(0, 10);
    const c2 = calendar(crop, st), w2 = waterBalance(kb, crop, c2.field, c2.fieldDays);
    const cov2 = clampN((w2.rainMet + w2.deficit * water.covers) / w2.etcTotal, 0, 1);
    const r2 = risks(kb, crop, c2, w2, input.water, cov2);
    const hm = r2.harvestMonths, pIdx = hm.reduce((a, k) => a + crop.price.index[k], 0) / hm.length;
    const margin = (crop.yield_t_ha[regime].average * yieldFactor(crop.ky, cov2) * 1000 * (1 - loss) * (pIdx * crop.price.reference_xaf_kg * (1 - kb.services.market_fee_rate.price) - perKgCash)) - perHaCash;
    windows.push({ month: m, risk: r2, coverage: cov2, marginPerHa: margin });
  }
  const best = windows.slice().sort((a, b) => (a.risk.score - b.risk.score) || (b.marginPerHa - a.marginPerHa))[0].month;

  // Itinerary scaled to the area, with dates
  const itinerary = crop.steps.map(s => {
    const base = s.ref === 'start' ? cal.start : s.ref === 'harvest' ? cal.firstHarvest : cal.field;
    const from = new Date(base.getTime() + s.day[0] * DAY), to = new Date(base.getTime() + s.day[1] * DAY);
    return { id: s.id, phase: s.phase, label: s.label, detail: s.detail, from, to, labourDays: (s.labour || 0) * area, inputs: (s.inputs || []).map(i => ({ item: i.item, label: kb.items[i.item].label, qty: i.qty * (i.apps || 1) * area, unit: kb.items[i.item].unit, apps: i.apps || 1, cost: i.qty * (i.apps || 1) * area * kb.items[i.item].price })), src: s.src || [] };
  });

  // Shopping list: inputs aggregated and rounded to the packs sold
  const shop = {};
  itinerary.forEach(st => st.inputs.forEach(i => { const it = kb.items[i.item]; shop[i.item] = shop[i.item] || { item: i.item, label: it.label, unit: it.unit, qty: 0, pack: it.pack || null, category: it.category }; shop[i.item].qty += i.qty; }));
  Object.values(shop).forEach(s => { const it = kb.items[s.item]; if (it.pack) { s.packs = Math.ceil(s.qty / it.pack.size - 1e-9); s.packLabel = it.pack.label; s.packCost = s.packs * it.pack.size * it.price; } s.cost = s.qty * it.price; });

  return {
    input, crop: input.crop, state, capitalXaf, minXaf, requiredXaf: required, areaHa: area, plants: Math.round(area * crop.plants_per_ha),
    calendar: cal, water: Object.assign({}, water, { balance: wb, coverage, yieldFactor: wf, grossM3: water.grossM3PerHa * area }),
    budget: { lines, operating, upfront: upTotal, upfrontPerSeason: upPerSeason, reserve, total: totalBudget, perHaCash, perKgCash },
    scenarios: scen, weights: w, expectedMargin: expected,
    breakEven: { yieldTHa: beYieldTHa, priceXafKg: beYieldPerUnit },
    risk, windows, bestMonth: best, itinerary, shopping: Object.values(shop)
  };
}

const AFEngine = { plan, calendar, waterBalance, yieldFactor, etoHargreaves, extraterrestrialRadiation, effectiveRain, kcAt, scenarioWeights, round };
if (typeof module !== 'undefined' && module.exports) module.exports = AFEngine;
