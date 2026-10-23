/* Djalumo Agro · Season Plan engine v3
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
   7. Risks for the chosen window: water, heat at flowering, disease pressure, market glut.
   8. Cash flow month by month: every cost and every sale placed at its date, the cumulative position,
      the peak financing need and the month the plan pays back.

   Crops come in four profiles. 'season' crops (one field cycle of 3 to 6 months) follow steps 1 to 8
   above. 'long' crops (one cycle of 9 to 18 months, cassava), 'ratoon' crops (successive cycles on
   the same stools, plantain) and 'orchard' crops (trees over several years, avocado) use planLong():
   establishment steps, recurring care, a production schedule, an optional processed product, and a
   multi year cash flow that sizes the plot on its peak financing need. */
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
  // A null price means no sourced price was found: the line keeps its quantity, costs 0 and is flagged for a local quote.
  const add = (cat, key, label, qty, unit, price, kind, step, src) => lines.push({ cat, key, label, qty, unit, price, unpriced: price == null, total: qty * (price || 0), kind: kind || 'cash', step: step || null, src: src || [] });
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
    if (o.labour_days_per_ha) perHa.push({ cat: 'labour', key: 'labour_watering', label: o.labour_label, qty: o.labour_days_per_ha, unit: 'person day', price: kb.services.labour_day.price, kind: 'labour', src: o.labour_src || o.src || [] });
    if (o.maintenance_xaf_per_ha) perHa.push({ cat: 'irrigation', key: 'maintenance', label: W.maintenance_label, qty: 1, unit: 'ha season', price: o.maintenance_xaf_per_ha, src: o.maintenance_src || o.src || [] });
    if (o.maintenance_pct_capex_per_season && o.capex) {
      const capex = o.capex.reduce((a, c) => a + (c.qty_per_ha || 0) * (kb.items[c.item].price || 0), 0);
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
    const qty = c.per === 'farm' ? Math.max(1, Math.ceil(areaHa / (c.ha_per_unit || 1e9) - 1e-9)) : c.discrete ? Math.max(1, Math.ceil(c.qty_per_ha * areaHa - 1e-9)) : c.qty_per_ha * areaHa;
    lines.push({ cat: 'equipment', key: c.item, label: it.label, qty, unit: it.unit, price: it.price, unpriced: it.price == null, total: qty * (it.price || 0), lifeSeasons: it.life_seasons || 1, src: it.src || [] });
  }
  if (!opts.ownTools) {
    for (const t of kb.tools_kit) {
      const it = kb.items[t.item];
      if (t.from_ha && areaHa < t.from_ha) continue; // equipment only bought from a given farm size
      const raw = areaHa * (t.per_ha || 0);
      const qty = t.fractional ? Math.max(t.min || 0, raw) : Math.max(t.min === undefined ? 1 : t.min, Math.ceil(raw - 1e-9));
      if (!(qty > 0)) continue;
      lines.push({ cat: it.category === 'ppe' ? 'ppe' : 'equipment', key: t.item, label: it.label, qty, unit: it.unit, price: it.price, unpriced: it.price == null, total: qty * (it.price || 0), lifeSeasons: it.life_seasons || 1, src: it.src || [] });
    }
  }
  return lines;
}

/** Harvest related costs per kilogram sold (packaging, transport, market fees are applied to revenue). */
function perKgCosts(kb, crop, opts) {
  const S = kb.services, out = [];
  const pk = crop.packaging;
  if (pk) { const it = kb.items[pk.item]; out.push({ cat: 'harvest', key: pk.item, label: it.label, perKg: (it.price || 0) / pk.kg_per_unit / (pk.uses || 1), unpriced: it.price == null, src: it.src || [] }); }
  out.push({ cat: 'harvest', key: 'harvest_labour', label: S.harvest_labour.label, perKg: S.labour_day.price / crop.harvest_kg_per_person_day, labour: true, src: [].concat(S.labour_day.src || [], crop.harvest_src || []) });
  const tr = opts.market === 'city' ? S.transport_city_kg : S.transport_local_kg;
  out.push({ cat: 'harvest', key: opts.market === 'city' ? 'transport_city' : 'transport_local', label: tr.label, perKg: tr.price || 0, unpriced: tr.price == null, src: tr.src || [] });
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
  const wetRain = Math.max(...reproMonths.map(m => C[m].rain));
  const disease = wetRain >= kb.thresholds.disease_rain_mm_high ? 2 : wetRain >= kb.thresholds.disease_rain_mm_medium ? 1 : 0;
  const water = waterCoverage >= 0.9 ? 0 : waterCoverage >= 0.7 ? 1 : 2;
  const idx = harvestMonths.reduce((a, m) => a + crop.price.index[m], 0) / harvestMonths.length;
  const market = idx <= 0.85 ? 2 : idx <= 0.97 ? 1 : 0;
  return { heat, disease, water, market, tmaxFlower, wetRain, priceIndex: idx, flowerMonths, harvestMonths, score: heat + disease + water + market };
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
  if (crop.profile && crop.profile !== 'season') {
    // The grower may choose the plan length among the crop's options (plantain cycles, orchard years).
    const opt = (crop.horizon_options || []).find(o => o.months === +input.horizon);
    const c = opt && opt.months !== crop.horizon_months ? Object.assign({}, crop, { horizon_months: opt.months }) : crop;
    const r = planLong(kb, input, c);
    r.horizonOptions = (crop.horizon_options || []).map(o => o.months);
    r.firstHarvestMonths = r.production && r.production.length ? Math.round((r.production[0].from - r.calendar.field) / (30.44 * 864e5)) : null;
    return r;
  }
  const r = planSeason(kb, input, crop);
  r.profile = 'season';
  r.horizonMonths = r.cashflow.months.length;
  r.marginPerMonth = r.scenarios.average.margin / Math.max(1, r.horizonMonths);
  r.horizonOptions = [];
  r.firstHarvestMonths = Math.round((r.calendar.firstHarvest - r.calendar.start) / (30.44 * 864e5));
  return r;
}

function planSeason(kb, input, crop) {
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

  // Yield references are set by season: a crop whose water need is mostly met by rain is a rainy season crop
  // (disease limited references), otherwise a dry season crop (references for irrigated dry season production).
  const seasonOf = (b) => b.rainCoverage >= kb.limits.wet_season_rain_share ? 'wet' : 'dry';
  const season = seasonOf(wb);
  const city = opts.market === 'city';
  const loss = (crop.loss_pct + (city ? (kb.market.city_extra_loss_pct || 0) : 0)) / 100;
  const cityFactor = city ? (crop.price.city_factor || 1) : 1;
  const yields = crop.yield_t_ha[season];
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
    // Largest area whose field costs plus up front items fit the capital net of the reserve. Up front costs
    // grow with the area in steps (one pump per hectare, a wheelbarrow from 0.5 ha), so the cost is monotone
    // in the area and a bisection finds the limit exactly.
    const net = capitalXaf / (1 + reserveRate);
    const cost = (a) => a * budgetPerHa + upfrontLines(kb, water, a, opts).reduce((s, l) => s + l.total, 0);
    let lo = 0, hi = Math.max(0, net / budgetPerHa);
    if (water.maxAreaHa && hi > water.maxAreaHa) hi = water.maxAreaHa;
    if (cost(hi) <= net) lo = hi;
    else for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (cost(m) <= net) lo = m; else hi = m; }
    area = lo < 1e-4 ? 0 : lo;
    upfront = upfrontLines(kb, water, Math.max(area, 0), opts);
    if (area <= 0 && state === 'ok') state = 'upfront_exceeds';
    if (water.maxAreaHa && area >= water.maxAreaHa - 1e-9 && state === 'ok') state = 'manual_limit';
  }
  if (input.mode === 'crop' && water.maxAreaHa && area > water.maxAreaHa) state = state === 'ok' ? 'manual_limit' : state;

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
  // Price at harvest: the grower's own expected price when given, otherwise the reference adjusted to the harvest months.
  const userPrice = +input.priceXafKg > 0 ? +input.priceXafKg : null;
  const refPrice = crop.price.reference_xaf_kg;
  const priceSource = userPrice ? 'user' : refPrice ? 'reference' : null;
  const priceAvg = userPrice || (refPrice ? risk.priceIndex * refPrice * cityFactor : 0);
  if (!priceSource && state === 'ok') state = 'needs_price';
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
  const beYieldTHa = area > 0 && netPrice > 0 && priceSource ? fixed / (netPrice * 1000 * (1 - loss) * area) : null;
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
    const p2 = userPrice || (refPrice ? pIdx * refPrice * cityFactor : 0);
    const margin = (crop.yield_t_ha[seasonOf(w2)].average * yieldFactor(crop.ky, cov2) * 1000 * (1 - loss) * (p2 * (1 - kb.services.market_fee_rate.price) - perKgCash)) - perHaCash;
    windows.push({ month: m, risk: r2, coverage: cov2, season: seasonOf(w2), marginPerHa: margin });
  }
  const best = windows.slice().sort((a, b) => (a.risk.score - b.risk.score) || (b.marginPerHa - a.marginPerHa))[0].month;

  // Itinerary scaled to the area, with dates
  const itinerary = crop.steps.map(s => {
    const base = s.ref === 'start' ? cal.start : s.ref === 'harvest' ? cal.firstHarvest : cal.field;
    const from = new Date(base.getTime() + s.day[0] * DAY), to = new Date(base.getTime() + s.day[1] * DAY);
    return { id: s.id, phase: s.phase, label: s.label, detail: s.detail, from, to, labourDays: (s.labour || 0) * area, inputs: (s.inputs || []).map(i => ({ item: i.item, label: kb.items[i.item].label, qty: i.qty * (i.apps || 1) * area, unit: kb.items[i.item].unit, apps: i.apps || 1, cost: i.qty * (i.apps || 1) * area * (kb.items[i.item].price || 0), unpriced: kb.items[i.item].price == null })), src: s.src || [] };
  });

  itinerary.sort((a, b) => (a.from - b.from) || (a.to - b.to));

  // Shopping list: inputs aggregated and rounded to the packs sold
  const shop = {};
  itinerary.forEach(st => st.inputs.forEach(i => { const it = kb.items[i.item]; shop[i.item] = shop[i.item] || { item: i.item, label: it.label, unit: it.unit, qty: 0, pack: it.pack || null, category: it.category }; shop[i.item].qty += i.qty; }));
  Object.values(shop).forEach(s => { const it = kb.items[s.item]; s.unpriced = it.price == null; if (it.pack) { s.packs = Math.ceil(s.qty / it.pack.size - 1e-9); s.packLabel = it.pack.label; s.packCost = s.packs * it.pack.size * (it.price || 0); } s.cost = s.qty * (it.price || 0); });

  return {
    input, crop: input.crop, state, priceSource, unpriced: Array.from(new Set(lines.filter(l => l.unpriced).map(l => l.key))), capitalXaf, minXaf, requiredXaf: required, areaHa: area, plants: Math.round(area * crop.plants_per_ha),
    calendar: cal, season, water: Object.assign({}, water, { balance: wb, coverage, yieldFactor: wf, grossM3: water.grossM3PerHa * area }),
    budget: { lines, operating, upfront: upTotal, upfrontPerSeason: upPerSeason, reserve, total: totalBudget, perHaCash, perKgCash },
    scenarios: scen, weights: w, expectedMargin: expected,
    breakEven: { yieldTHa: beYieldTHa, priceXafKg: beYieldPerUnit },
    risk, windows, bestMonth: best, itinerary, shopping: Object.values(shop),
    cashflow: seasonCashflow(kb, crop, cal, wb, ha, kgLines, upfront, area, scen, familyShare, cashOf)
  };
}

/* ---------- Cash flow ledger ---------- */
const addMonths = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()));
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
function ledgerNew(start, months) {
  const y0 = start.getUTCFullYear(), m0 = start.getUTCMonth(), rows = [];
  for (let i = 0; i < months; i++) { const d = new Date(Date.UTC(y0, m0 + i, 1)); rows.push({ y: d.getUTCFullYear(), m: d.getUTCMonth(), costs: 0, revenue: 0 }); }
  return { y0, m0, rows };
}
const ledgerIdx = (L, d) => (d.getUTCFullYear() - L.y0) * 12 + d.getUTCMonth() - L.m0;
/** Spreads an amount evenly over the days from..to (inclusive) and books it month by month. */
function ledgerAdd(L, from, to, amount, key) {
  if (!amount) return;
  if (to < from) to = from;
  let remaining = Math.max(1, Math.round((to - from) / DAY) + 1);
  const per = amount / remaining;
  let d = new Date(from.getTime());
  while (remaining > 0) {
    const i = clampN(ledgerIdx(L, d), 0, L.rows.length - 1);
    const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    const n = Math.max(1, Math.min(remaining, Math.round((next - d) / DAY)));
    L.rows[i][key] += per * n; remaining -= n; d = next;
  }
}
/** Cumulative position, peak financing need (deepest cumulative deficit) and the first month the plan is back above zero. */
function ledgerClose(L) {
  let cum = 0, min = 0, payback = null, wasNeg = false;
  const months = L.rows.map((r, i) => {
    const net = r.revenue - r.costs; cum += net;
    if (cum < min) min = cum;
    if (cum < -1e-6) wasNeg = true;
    if (payback === null && wasNeg && cum >= 0 && r.revenue > 0) payback = i;
    return { y: r.y, m: r.m, costs: r.costs, revenue: r.revenue, net, cum };
  });
  return { months, peakNeed: -min, paybackIndex: payback, end: cum };
}

/** Month by month cash flow of a season plan: each cost at the date of its step, water costs in the months that need
    water, equipment at the start, harvest costs and sales over the harvest weeks. Reports every scenario. */
function seasonCashflow(kb, crop, cal, wb, ha, kgLines, upfront, area, scen, familyShare, cashOf) {
  const months = monthsBetween(cal.start, cal.lastHarvest).length;
  const stepDates = {};
  crop.steps.forEach(s => { const b = s.ref === 'start' ? cal.start : s.ref === 'harvest' ? cal.firstHarvest : cal.field; stepDates[s.id] = [addDays(b, s.day[0]), addDays(b, s.day[1])]; });
  const deficitTotal = wb.rows.reduce((a, r) => a + r.deficit, 0);
  const perKgCash = kgLines.reduce((a, k) => a + k.perKg * (k.labour ? 1 - familyShare : 1), 0);
  const fee = kb.services.market_fee_rate.price;
  const build = (s) => {
    const L = ledgerNew(cal.start, months);
    for (const l of ha) {
      const amt = cashOf(l) * area;
      if (l.step && stepDates[l.step]) ledgerAdd(L, stepDates[l.step][0] < cal.start ? cal.start : stepDates[l.step][0], stepDates[l.step][1] < cal.start ? cal.start : stepDates[l.step][1], amt, 'costs');
      else if (l.key === 'land_rent') ledgerAdd(L, cal.start, cal.start, amt, 'costs');
      else if ((l.cat === 'irrigation' || l.key === 'labour_watering') && deficitTotal > 0) wb.rows.forEach(r => { if (r.deficit > 0) { const d = new Date(Date.UTC(r.year, r.month, 1)); ledgerAdd(L, d, d, amt * r.deficit / deficitTotal, 'costs'); } });
      else ledgerAdd(L, cal.field, cal.lastHarvest, amt, 'costs');
    }
    ledgerAdd(L, cal.start, cal.start, upfront.reduce((a, l) => a + l.total, 0), 'costs');
    ledgerAdd(L, cal.firstHarvest, cal.lastHarvest, scen[s].soldKg * perKgCash, 'costs');
    ledgerAdd(L, cal.firstHarvest, cal.lastHarvest, scen[s].soldKg * scen[s].price * (1 - fee), 'revenue');
    return ledgerClose(L);
  };
  const out = build('average');
  out.start = cal.start;
  out.byScenario = {};
  for (const s of SCEN) { const b = s === 'average' ? out : build(s); out.byScenario[s] = { peakNeed: b.peakNeed, paybackIndex: b.paybackIndex, end: b.end }; }
  return out;
}

/* ---------- Long cycles, successive cycles and orchards ---------- */
const NO_LABEL = { en: '', fr: '' };
const fill = (tpl, n) => tpl ? { en: String(tpl.en || '').replace('{n}', n), fr: String(tpl.fr || tpl.en || '').replace('{n}', n) } : NO_LABEL;

/** Harvest events over the horizon, each with a share of the reference yield. */
function productionEvents(crop, cal, horizonEnd) {
  const P = crop.production || {}, ev = [];
  if (crop.profile === 'ratoon') {
    const n = P.cycles || 1, gap = P.interval_days || 365;
    for (let k = 0; k < n; k++) {
      const from = addDays(cal.firstHarvest, k * gap);
      if (from >= horizonEnd) break;
      const to = addDays(from, crop.cycle.harvest_days);
      ev.push({ n: k + 1, from, to: to > horizonEnd ? addDays(horizonEnd, -1) : to, share: (P.factors || [])[k] !== undefined ? P.factors[k] : 1 });
    }
  } else if (crop.profile === 'orchard') {
    const years = Math.round(crop.horizon_months / 12), hm = P.harvest_months || [];
    for (let y = 1; y <= years; y++) {
      const share = (P.yield_by_year || [])[y - 1] || 0;
      if (!share || !hm.length) continue;
      const y0 = addMonths(cal.field, (y - 1) * 12), y1 = addMonths(cal.field, y * 12);
      let from = null, to = null;
      for (let d = new Date(y0.getTime()); d < y1; d = addDays(d, 1)) if (hm.includes(d.getUTCMonth())) { if (!from) from = new Date(d.getTime()); to = new Date(d.getTime()); }
      if (from) ev.push({ n: y, from, to, share });
    }
  } else {
    ev.push({ n: 1, from: cal.firstHarvest, to: cal.lastHarvest, share: 1 });
  }
  return ev;
}

/** Product sold: fresh by default, or a processed form with its conversion ratio and processing costs per tonne of product. */
function productOf(crop, key) {
  const P = crop.products || { fresh: { label: { en: 'Fresh', fr: 'Frais' }, ratio: 1 } };
  const k = P[key] ? key : Object.keys(P)[0];
  const p = P[k];
  return { key: k, label: p.label, ratio: p.ratio || 1, unit: p.unit || 'kg', unitKg: p.unit_kg || 1, unitLabel: p.unit_label || { en: 'kg', fr: 'kg' }, costs: p.costs || [], price: Object.assign({}, crop.price, p.price || {}), src: p.src || [], basis: p.basis || null };
}

/** Per hectare model of a long crop for one start date: dated cost lines, events, water and per kg costs. Linear in the area
    except the equipment, which planLong adds for the area found. */
function longCore(kb, crop, input, opts, start) {
  const spy = kb.limits.seasons_per_year || 2;
  const cal = calendar(crop, start);
  const horizonEnd = addMonths(cal.field, crop.horizon_months);
  cal.horizonEnd = horizonEnd;
  const months = monthsBetween(cal.start, addDays(horizonEnd, -1)).length;
  const years = crop.horizon_months / 12;
  const events = productionEvents(crop, cal, horizonEnd);
  if (events.length) { cal.firstHarvest = events[0].from; cal.lastHarvest = events[events.length - 1].to; }
  // Water: the whole cycle for a long crop, one year repeated for successive cycles and orchards.
  const wbDays = crop.profile === 'long' ? Math.max(1, Math.round((cal.lastHarvest - cal.field) / DAY)) : 365;
  const wb = waterBalance(kb, crop, cal.field, wbDays);
  const water = waterPlan(kb, wb, input.water || 'rainfed');
  const coverage = wb.etcTotal ? clampN((wb.rainMet + wb.deficit * water.covers) / wb.etcTotal, 0, 1) : 1;
  const wf = crop.ky ? yieldFactor(crop.ky, coverage) : 1;
  const kEst = crop.kc.ini;
  const wbE = waterBalance(kb, { kc: { ini: kEst, mid: kEst, end: kEst, stages: [0.3, 0.6, 0.9] } }, cal.field, 90);
  const covEst = wbE.etcTotal ? clampN((wbE.rainMet + wbE.deficit * water.covers) / wbE.etcTotal, 0, 1) : 1;
  const periods = crop.profile === 'long' ? 1 : years;

  // Dated per hectare cost lines
  const lines = [];
  const S = kb.services, share = clampN(opts.familyLabour || 0, 0, 0.9);
  const push = (cat, key, label, qty, unit, price, kind, step, src, from, to, extra) => lines.push(Object.assign({ cat, key, label, qty, unit, price, unpriced: price == null, total: qty * (price || 0) * (kind === 'labour' ? 1 - share : 1), kind: kind || 'cash', step, src: src || [], from, to }, extra || {}));
  const stepLines = (s, from, to, mult, extra) => {
    for (const inp of s.inputs || []) { const it = kb.items[inp.item]; push(it.category, inp.item, it.label, inp.qty * (inp.apps || 1) * mult, it.unit, it.price, 'cash', s.id, [].concat(inp.src || [], it.src || []), from, to, extra); }
    if (s.labour) push('labour', 'labour_' + s.id, s.label, s.labour * mult, 'person day', S.labour_day.price, 'labour', s.id, s.src || [], from, to, extra);
    for (const sv of s.services || []) { const x = S[sv.key]; push(x.category, sv.key, x.label, sv.qty * mult, x.unit, x.price, 'cash', s.id, x.src || [], from, to, extra); }
  };
  for (const s of crop.steps) {
    const b = s.ref === 'start' ? cal.start : s.ref === 'harvest' ? cal.firstHarvest : cal.field;
    let from = addDays(b, s.day[0]), to = addDays(b, s.day[1]);
    if (from < cal.start) from = cal.start; if (to < cal.start) to = cal.start;
    stepLines(s, from, to, 1);
  }
  const occurrences = {};
  for (const r of crop.recurring || []) {
    occurrences[r.id] = [];
    const every = r.every_months || 12, last = Math.min(r.last_month !== undefined ? r.last_month : crop.horizon_months - 1, crop.horizon_months - 1);
    for (let mo = r.first_month || 0; mo <= last; mo += every) {
      const y = Math.floor(mo / 12) + 1;
      const mult = r.qty_by_year ? r.qty_by_year[Math.min(y - 1, r.qty_by_year.length - 1)] : 1;
      if (!mult) continue;
      const from = addMonths(cal.field, mo), to = addDays(from, r.span_days || 30);
      occurrences[r.id].push({ from, to, mult, year: y });
      stepLines(r, from, to, mult, { recurring: true, year: y });
    }
  }
  // Land and advice are counted per hectare and per year over the plan (rent: two seasons a year).
  if (opts.land === 'rent') push('land', 'land_rent', S.land_rent_season.label_long || S.land_rent_season.label, years, 'ha year', S.land_rent_season.price * spy, 'cash', null, S.land_rent_season.src, cal.field, addDays(horizonEnd, -1));
  if (crop.agronomist_visits) push('advice', 'agronomist', S.agronomist_visit.label, crop.agronomist_visits * years, 'ha year', S.agronomist_visit.price, 'cash', null, S.agronomist_visit.src, cal.field, addDays(horizonEnd, -1));
  // Water running costs: the months with a deficit in the balance, repeated each year of the horizon.
  const defTot = wb.rows.reduce((a, r) => a + r.deficit, 0);
  for (const w of water.perHa) {
    for (let p = 0; p < Math.ceil(periods - 1e-9); p++) {
      const part = Math.min(1, periods - p);
      wb.rows.forEach(r => { if (r.deficit > 0 && defTot > 0) { const d = addMonths(new Date(Date.UTC(r.year, r.month, 1)), p * 12); if (d < horizonEnd) push(w.cat, w.key, w.label, w.qty * part * r.deficit / defTot, w.unit === 'ha season' ? 'ha year' : w.unit === 'season' ? 'year' : w.unit, /season/.test(w.unit) ? w.price * spy : w.price, w.kind || 'cash', null, w.src, d, d, { water: true }); } });
    }
  }
  return { cal, horizonEnd, months, years, events, wb, water, coverage, wf, covEst, lines, occurrences };
}

function planLong(kb, input, crop) {
  const fx = kb.fx[input.currency] || 1;
  const capitalXaf = input.mode === 'crop' ? null : (+input.capital || 0) * (input.currency === 'XAF' ? 1 : kb.fx.XAF / fx);
  const minXaf = kb.limits.min_capital_usd * kb.fx.XAF;
  const opts = { land: input.land || 'rent', familyLabour: input.familyLabour || 0, market: input.market || 'local', ownTools: !!input.ownTools };
  const spy = kb.limits.seasons_per_year || 2;
  const prod = productOf(crop, input.product);
  const S = kb.services, fee = S.market_fee_rate.price, share = clampN(opts.familyLabour, 0, 0.9);
  const city = opts.market === 'city';
  const loss = (crop.loss_pct + (city ? (kb.market.city_extra_loss_pct || 0) : 0)) / 100;
  const cityFactor = city ? (prod.price.city_factor || 1) : 1;
  const userPrice = +input.priceXafKg > 0 ? +input.priceXafKg / prod.unitKg : null; // the grower enters a price per sale unit
  const refPrice = prod.price.reference_xaf_kg;
  const priceSource = userPrice ? 'user' : refPrice ? 'reference' : null;
  const basePrice = userPrice || refPrice || 0;

  // Costs per kg: harvest labour on the fresh weight; packaging and transport on the product sold; processing per kg of product.
  const perFresh = S.labour_day.price / crop.harvest_kg_per_person_day * (1 - share);
  const tr = city ? S.transport_city_kg : S.transport_local_kg;
  const pk = crop.packaging && kb.items[crop.packaging.item];
  const perProduct = (pk ? (pk.price || 0) / crop.packaging.kg_per_unit / (crop.packaging.uses || 1) : 0) + (tr.price || 0);
  const procLines = prod.costs.map(c => {
    if (c.labour_days_per_t) return { key: 'processing_labour', cat: 'processing', label: c.label || S.labour_day.label, unit: 'person day', perKg: c.labour_days_per_t / 1000 * S.labour_day.price * (1 - share), qtyPerKg: c.labour_days_per_t / 1000, price: S.labour_day.price, kind: 'labour', src: c.src || [] };
    if (c.xaf_per_t) return { key: c.key || 'processing_cost', cat: 'processing', label: c.label, unit: 'kg', perKg: c.xaf_per_t / 1000, qtyPerKg: 1, price: c.xaf_per_t / 1000, src: c.src || [] };
    const it = c.item ? kb.items[c.item] : S[c.service];
    return { key: c.item || c.service, cat: 'processing', label: it.label, unit: it.unit, perKg: c.qty_per_t / 1000 * (it.price || 0), qtyPerKg: c.qty_per_t / 1000, price: it.price, unpriced: it.price == null, src: [].concat(c.src || [], it.src || []) };
  });
  const perProc = procLines.reduce((a, l) => a + l.perKg, 0);

  const core = longCore(kb, crop, input, opts, input.start);
  const { cal, horizonEnd, months, years, events, wb, water, coverage, wf } = core;
  const yields = crop.yield_t_ha;
  const idxOf = (e) => { const hm = monthsBetween(e.from, e.to); return hm.reduce((a, m) => a + prod.price.index[m], 0) / hm.length; };

  // Volumes and sales per hectare, by scenario and event
  const eventsFor = (s) => events.map((e, i) => {
    const t = s === 'failure' ? (i === 0 ? yields.average * kb.scenario.failure_yield_share : yields.poor * wf) : yields[s] * wf;
    const freshKg = t * e.share * 1000;
    const soldKg = freshKg * (1 - loss) * prod.ratio;
    const price = basePrice * (refPrice && !userPrice ? idxOf(e) : 1) * cityFactor * kb.scenario.price_factor[s];
    return { n: e.n, from: e.from, to: e.to, share: e.share, freshKg, soldKg, price, revenue: soldKg * price * (1 - fee), costs: freshKg * perFresh + soldKg * (perProduct + perProc) };
  });
  // Equipment and its replacements over the horizon
  const upLines = (a) => upfrontLines(kb, water, a, opts).map(l => {
    const life = Math.max(1, (l.lifeSeasons || 1) / spy);
    const buys = Math.max(1, Math.ceil(years / life - 1e-9));
    return Object.assign({ upfront: true, purchases: buys, lifeYears: life }, l, { total: l.total * buys, unitTotal: l.total });
  });
  const book = (L, a, s, opt) => {
    const o = opt || {};
    core.lines.forEach(l => ledgerAdd(L, l.from, l.to, l.total * a, 'costs'));
    upLines(a).forEach(l => { for (let k = 0; k < l.purchases; k++) { const d = addMonths(cal.start, Math.round(k * l.lifeYears * 12)); if (d < horizonEnd) ledgerAdd(L, d, d, l.unitTotal, 'costs'); } });
    eventsFor(s).forEach(e => { ledgerAdd(L, e.from, e.to, e.costs * a, 'costs'); if (!o.noRevenue) ledgerAdd(L, e.from, e.to, e.revenue * a, 'revenue'); });
    return L;
  };
  const ledger = (a, s, opt) => ledgerClose(book(ledgerNew(cal.start, months), a, s, opt));
  const firstEnd = events.length ? ledgerIdx(ledgerNew(cal.start, 1), events[0].to) : months - 1;
  // Financing need: the deepest cumulative deficit of the average outcome; without a price, the costs up to the end of the first harvest.
  const need = (a) => {
    if (!priceSource) { const c = ledger(a, 'average', { noRevenue: true }); return -Math.min(0, c.months[Math.min(firstEnd, c.months.length - 1)].cum); }
    return ledger(a, 'average').peakNeed;
  };
  const reserveRate = kb.limits.reserve_rate;
  let area, required = null, state = 'ok';
  if (input.mode === 'crop') {
    area = Math.max(0, +input.area || 0);
    required = need(area) * (1 + reserveRate);
  } else {
    if (capitalXaf < minXaf) state = 'below_min';
    const net = capitalXaf / (1 + reserveRate);
    const per1 = Math.max(1, need(1));
    let lo = 0, hi = Math.max(0, 2 * net / per1);
    if (water.maxAreaHa && hi > water.maxAreaHa) hi = water.maxAreaHa;
    if (need(hi) <= net) lo = hi;
    else for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (need(m) <= net) lo = m; else hi = m; }
    area = lo < 1e-4 ? 0 : lo;
    if (area <= 0 && state === 'ok') state = 'upfront_exceeds';
    if (water.maxAreaHa && area >= water.maxAreaHa - 1e-9 && state === 'ok') state = 'manual_limit';
  }
  if (input.mode === 'crop' && water.maxAreaHa && area > water.maxAreaHa) state = state === 'ok' ? 'manual_limit' : state;
  if (!priceSource && state === 'ok') state = 'needs_price';

  // Scenarios over the horizon
  const ups = upLines(area), upTotal = ups.reduce((a, l) => a + l.total, 0);
  const fixed = core.lines.reduce((a, l) => a + l.total, 0) * area + upTotal;
  const scen = {}, byScenario = {};
  let avgLedger = null;
  for (const s of SCEN) {
    const ev = eventsFor(s);
    const freshKg = ev.reduce((a, e) => a + e.freshKg, 0) * area, soldKg = ev.reduce((a, e) => a + e.soldKg, 0) * area;
    const revenue = ev.reduce((a, e) => a + e.revenue, 0) * area, varCosts = ev.reduce((a, e) => a + e.costs, 0) * area;
    const costs = fixed + varCosts, margin = revenue - costs;
    const lg = ledger(area, s);
    if (s === 'average') avgLedger = lg;
    const productive = events.filter(e => e.share > 0).length || 1;
    scen[s] = { yieldTHa: ev.reduce((a, e) => a + e.freshKg, 0) / 1000 / productive, freshKg, price: ev.length ? ev.reduce((a, e) => a + e.price * e.soldKg, 0) / Math.max(1e-9, ev.reduce((a, e) => a + e.soldKg, 0)) : 0, soldKg, revenue, costs, cashCosts: costs, margin, roi: costs ? margin / costs : 0, marginPerYear: margin / years, peakNeed: lg.peakNeed, paybackIndex: lg.paybackIndex, cashAfterSeason: lg.end, events: ev.map(e => Object.assign({}, e, { freshKg: e.freshKg * area, soldKg: e.soldKg * area, revenue: e.revenue * area, costs: e.costs * area })) };
    byScenario[s] = { peakNeed: lg.peakNeed, paybackIndex: lg.paybackIndex, end: lg.end };
  }

  // Risks for the start date chosen
  const risk = longRisk(kb, crop, core, prod, input.water);
  const w = scenarioWeights(kb, risk);
  const expected = SCEN.reduce((a, s) => a + w[s] * scen[s].margin, 0);
  const sa = scen.average;
  const netPerKg = sa.soldKg ? (sa.revenue - (sa.costs - fixed)) / sa.soldKg : 0; // net cash per kg sold after harvest and processing costs
  const beYieldTHa = priceSource && netPerKg > 0 && sa.soldKg > 0 ? sa.yieldTHa * fixed / (netPerKg * sa.soldKg) : null;
  const volIdx = eventsFor('average').reduce((a, e) => a + e.soldKg * (refPrice && !userPrice ? idxOf(e) : 1), 0) * area * (1 - fee);
  const beKg = volIdx > 0 ? sa.costs / volIdx : null;
  const breakEven = { yieldTHa: beYieldTHa, priceXafKg: beKg, pricePerUnit: beKg !== null ? beKg * prod.unitKg : null };

  // Best start month: same inputs, average outcome per hectare and risks
  const windows = [];
  const y0 = new Date(input.start + 'T00:00:00Z').getUTCFullYear();
  for (let m = 0; m < 12; m++) {
    const st = new Date(Date.UTC(y0, m, 1)).toISOString().slice(0, 10);
    const c2 = longCore(kb, crop, input, opts, st);
    const r2 = longRisk(kb, crop, c2, prod, input.water);
    const ev2 = productionEvents(crop, c2.cal, c2.horizonEnd).map(e => {
      const hm = monthsBetween(e.from, e.to), idx = hm.reduce((a, k) => a + prod.price.index[k], 0) / hm.length;
      const fresh = yields.average * c2.wf * e.share * 1000, sold = fresh * (1 - loss) * prod.ratio;
      return sold * basePrice * (refPrice && !userPrice ? idx : 1) * cityFactor * (1 - fee) - fresh * perFresh - sold * (perProduct + perProc);
    });
    const marginPerHa = ev2.reduce((a, v) => a + v, 0) - c2.lines.reduce((a, l) => a + l.total, 0);
    windows.push({ month: m, risk: r2, coverage: c2.coverage, establishment: c2.covEst, season: 'all', marginPerHa });
  }
  const best = windows.slice().sort((a, b) => (a.risk.score - b.risk.score) || (b.marginPerHa - a.marginPerHa))[0].month;

  // Budget lines over the horizon, grouped by key
  const group = {};
  core.lines.forEach(l => {
    const g = group[l.key] = group[l.key] || { cat: l.cat, key: l.key, label: l.label, qty: 0, unit: l.unit, price: l.price, unpriced: l.unpriced, total: 0, kind: l.kind, step: l.step, src: [], recurring: !!l.recurring };
    g.qty += l.qty * area; g.total += l.total * area;
    l.src.forEach(s => { if (!g.src.includes(s)) g.src.push(s); });
  });
  const sold = sa.soldKg, fresh = sa.freshKg;
  const kgLines = [{ cat: 'harvest', key: 'harvest_labour', label: S.harvest_labour.label, qty: fresh, unit: 'kg', price: perFresh, total: fresh * perFresh, src: [].concat(S.labour_day.src || [], crop.harvest_src || []) }];
  if (pk) kgLines.push({ cat: 'harvest', key: crop.packaging.item, label: pk.label, qty: sold, unit: 'kg', price: (pk.price || 0) / crop.packaging.kg_per_unit / (crop.packaging.uses || 1), total: sold * (pk.price || 0) / crop.packaging.kg_per_unit / (crop.packaging.uses || 1), unpriced: pk.price == null, src: pk.src || [] });
  kgLines.push({ cat: 'harvest', key: city ? 'transport_city' : 'transport_local', label: tr.label, qty: sold, unit: 'kg', price: tr.price || 0, total: sold * (tr.price || 0), unpriced: tr.price == null, src: tr.src || [] });
  procLines.forEach(l => kgLines.push({ cat: 'processing', key: l.key, label: l.label, qty: sold * l.qtyPerKg, unit: l.unit, price: l.price, total: sold * l.perKg, unpriced: l.unpriced, kind: l.kind, src: l.src }));
  const lines = Object.values(group).concat(kgLines).concat(ups);
  const operating = lines.filter(l => !l.upfront).reduce((a, l) => a + l.total, 0);
  const peak = priceSource ? avgLedger.peakNeed : need(area);
  const reserve = peak * reserveRate;

  // Itinerary: establishment steps, recurring care (one entry per task with its occurrences) and harvests
  const itinerary = [];
  crop.steps.forEach(s => {
    const b = s.ref === 'start' ? cal.start : s.ref === 'harvest' ? cal.firstHarvest : cal.field;
    itinerary.push({ id: s.id, phase: s.phase, label: s.label, detail: s.detail, from: addDays(b, s.day[0]), to: addDays(b, s.day[1]), labourDays: (s.labour || 0) * area, occurrences: 1, inputs: (s.inputs || []).map(i => ({ item: i.item, label: kb.items[i.item].label, qty: i.qty * (i.apps || 1) * area, unit: kb.items[i.item].unit, apps: i.apps || 1, cost: i.qty * (i.apps || 1) * area * (kb.items[i.item].price || 0), unpriced: kb.items[i.item].price == null })), src: s.src || [] });
  });
  (crop.recurring || []).forEach(r => {
    const occ = core.occurrences[r.id] || [];
    if (!occ.length) return;
    const m = occ.reduce((a, o) => a + o.mult, 0);
    itinerary.push({ id: r.id, phase: r.phase, label: r.label, detail: r.detail, from: occ[0].from, to: occ[occ.length - 1].to, every: r.every_months || 12, occurrences: occ.length, dates: occ.map(o => o.from), labourDays: (r.labour || 0) * m * area, inputs: (r.inputs || []).map(i => ({ item: i.item, label: kb.items[i.item].label, qty: i.qty * (i.apps || 1) * m * area, unit: kb.items[i.item].unit, apps: i.apps || 1, cost: i.qty * (i.apps || 1) * m * area * (kb.items[i.item].price || 0), unpriced: kb.items[i.item].price == null })), src: r.src || [] });
  });
  events.forEach(e => itinerary.push({ id: 'harvest_' + e.n, phase: 'harvest', label: fill(crop.harvest_label, e.n), detail: crop.harvest_detail || NO_LABEL, from: e.from, to: e.to, labourDays: 0, occurrences: 1, inputs: [], src: crop.harvest_src || [], harvest: true, share: e.share }));
  itinerary.sort((a, b) => (a.from - b.from) || (a.to - b.to));

  // Shopping list: what the first twelve months need (establishment and first year care)
  const shop = {};
  const firstYearEnd = addMonths(cal.field, 12);
  core.lines.filter(l => kb.items[l.key] && l.from < firstYearEnd).forEach(l => { const it = kb.items[l.key]; const s = shop[l.key] = shop[l.key] || { item: l.key, label: it.label, unit: it.unit, qty: 0, pack: it.pack || null, category: it.category }; s.qty += l.qty * area; });
  Object.values(shop).forEach(s => { const it = kb.items[s.item]; s.unpriced = it.price == null; if (it.pack) { s.packs = Math.ceil(s.qty / it.pack.size - 1e-9); s.packLabel = it.pack.label; s.packCost = s.packs * it.pack.size * (it.price || 0); } s.cost = s.qty * (it.price || 0); });

  const cashflow = Object.assign(avgLedger, { start: cal.start, byScenario });
  return {
    input, crop: input.crop, profile: crop.profile, state, priceSource, unpriced: Array.from(new Set(lines.filter(l => l.unpriced).map(l => l.key))), capitalXaf, minXaf, requiredXaf: required, areaHa: area, plants: Math.round(area * crop.plants_per_ha),
    calendar: cal, season: 'all', horizonMonths: months, years,
    product: { key: prod.key, label: prod.label, ratio: prod.ratio, unit: prod.unit, unitKg: prod.unitKg, unitLabel: prod.unitLabel },
    water: Object.assign({}, water, { balance: wb, coverage, yieldFactor: wf, establishment: core.covEst, grossM3: water.grossM3PerHa * area * (crop.profile === 'long' ? 1 : years) }),
    budget: { lines, operating, upfront: upTotal, upfrontPerSeason: upTotal / Math.max(1, years * spy), reserve, total: peak + reserve, peakNeed: peak, horizonCosts: operating + upTotal, perHaCash: core.lines.reduce((a, l) => a + l.total, 0), perKgCash: perProduct + perProc },
    scenarios: scen, weights: w, expectedMargin: expected, marginPerMonth: sa.margin / Math.max(1, months),
    breakEven, risk, windows, bestMonth: best, itinerary, shopping: Object.values(shop), shoppingScope: 'first_year', cashflow,
    production: events
  };
}

/** Risks of a long crop: establishment water (first 90 days after planting), water over the year for crops whose yield
    responds to water, heat at flowering, disease pressure in the harvest months, market glut. */
function longRisk(kb, crop, core, prod, waterOpt) {
  const C = kb.climate.months, ev = core.events;
  const harvestMonths = Array.from(new Set([].concat(...ev.map(e => monthsBetween(e.from, e.to)))));
  let flowerMonths = [];
  if (crop.production && crop.production.flowering_months) flowerMonths = crop.production.flowering_months;
  else if (crop.cycle.flowering_before_harvest_days && ev.length) flowerMonths = monthsBetween(addDays(ev[0].from, -crop.cycle.flowering_before_harvest_days), ev[0].from);
  const tmaxFlower = flowerMonths.length ? Math.max(...flowerMonths.map(m => C[m].tmax)) : null;
  const heat = crop.heat_c && tmaxFlower !== null ? (tmaxFlower >= crop.heat_c ? 2 : tmaxFlower >= crop.heat_c - 2 ? 1 : 0) : 0;
  const wetRain = harvestMonths.length ? Math.max(...harvestMonths.map(m => C[m].rain)) : 0;
  const disease = wetRain >= kb.thresholds.disease_rain_mm_high ? 2 : wetRain >= kb.thresholds.disease_rain_mm_medium ? 1 : 0;
  const est = core.covEst >= 0.8 ? 0 : core.covEst >= 0.5 ? 1 : 2;
  const yearly = crop.ky ? (core.coverage >= 0.9 ? 0 : core.coverage >= 0.7 ? 1 : 2) : 0;
  const water = Math.max(est, yearly);
  const idx = harvestMonths.length ? harvestMonths.reduce((a, m) => a + prod.price.index[m], 0) / harvestMonths.length : 1;
  const market = idx <= 0.85 ? 2 : idx <= 0.97 ? 1 : 0;
  return { heat, disease, water, market, establishment: est, tmaxFlower, wetRain, priceIndex: idx, flowerMonths, harvestMonths, score: heat + disease + water + market };
}

/* ---------- Crop comparison ---------- */
/** Runs the same capital, start date and water option for every crop. Ranks need no price: the break even price per sale
    unit is compared with the market prices the grower knows; margins are shown when a price is given. */
function compare(kb, input) {
  return Object.keys(kb.crops).map(k => {
    const c = kb.crops[k];
    const r = plan(kb, Object.assign({}, input, { crop: k, priceXafKg: (input.prices || {})[k] || 0, product: (input.products || {})[k] }));
    return { crop: k, name: c.name, profile: r.profile, months: r.horizonMonths, areaHa: r.areaHa, state: r.state, budget: r.budget.total, needPerHa: r.areaHa > 0 ? r.budget.total / r.areaHa : null,
      breakEvenPerUnit: r.breakEven.pricePerUnit !== undefined ? r.breakEven.pricePerUnit : r.breakEven.priceXafKg, unit: r.product ? r.product.unitLabel : { en: 'kg', fr: 'kg' },
      risk: r.risk.score, bestMonth: r.bestMonth, priceSource: r.priceSource, margin: r.priceSource ? r.scenarios.average.margin : null, marginPerMonth: r.priceSource ? r.marginPerMonth : null, paybackIndex: r.cashflow.paybackIndex, firstHarvestMonths: r.firstHarvestMonths };
  });
}

const AFEngine = { plan, compare, calendar, waterBalance, yieldFactor, etoHargreaves, extraterrestrialRadiation, effectiveRain, kcAt, scenarioWeights, round };
if (typeof module !== 'undefined' && module.exports) module.exports = AFEngine;
