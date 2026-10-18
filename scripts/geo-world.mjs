// Regenerates site/geo-world.json: the world dot map of the home page, the Cameroon inset and the
// trade corridors from the Foumbot production zone to African and world markets.
// Usage: npm install && npm run geo:world
// Land: Natural Earth 1:110m (world) and 1:50m (inset) via world-atlas. Sea lanes are drawn through
// indicative waypoints along usual shipping routes; distances are great circle lengths between them.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import * as topo from 'topojson-client';
import * as d3 from 'd3-geo';

const require = createRequire(import.meta.url);
const atlas = (n) => JSON.parse(fs.readFileSync(require.resolve(`world-atlas/${n}.json`), 'utf8'));
const w110 = atlas('countries-110m'), w50 = atlas('countries-50m'), land110 = atlas('land-110m');
const countries110 = topo.feature(w110, w110.objects.countries).features.filter((f) => f.id !== '010');
const countries50 = topo.feature(w50, w50.objects.countries).features;
const land = topo.feature(land110, land110.objects.land);
land.features = land.features.map((f) => ({ ...f, geometry: { ...f.geometry, coordinates: f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.filter((p) => d3.geoBounds({ type: 'Polygon', coordinates: p })[1][1] > -60) : f.geometry.coordinates } }));

// ISO 3166 numeric codes of African states (Natural Earth also draws W. Sahara and Somaliland)
const AFRICA = new Set(['012', '024', '204', '072', '854', '108', '132', '120', '140', '148', '174', '178', '180', '384', '262', '818', '226', '232', '748', '231', '266', '270', '288', '324', '624', '404', '426', '430', '434', '450', '454', '466', '478', '480', '504', '508', '516', '562', '566', '646', '678', '686', '690', '694', '706', '710', '728', '729', '834', '768', '788', '800', '894', '716', '732']);
const isAfrica = (f) => AFRICA.has(f.id) || ['Somaliland', 'W. Sahara'].includes(f.properties.name);

/* ---------- World view ---------- */
const W = 1600;
const proj = d3.geoNaturalEarth1().rotate([-11, 0]);
proj.fitWidth(W, { type: 'FeatureCollection', features: countries110 });
const [[, y0], [, y1]] = d3.geoPath(proj).bounds({ type: 'FeatureCollection', features: countries110 });
proj.translate([proj.translate()[0], proj.translate()[1] - y0 + 14]);
const H = Math.round(y1 - y0 + 28);
const r1 = (v) => Math.round(v * 10) / 10;
const P = (ll) => proj(ll).map(r1);

const cm110 = countries110.find((f) => f.id === '120');
const af110 = countries110.filter(isAfrica);
const withBox = (fs_) => fs_.map((f) => ({ f, b: d3.geoBounds(f) }));
const afB = withBox(af110), cmB = withBox([cm110]);
const inBox = (b, [lo, la]) => la >= b[0][1] - 0.5 && la <= b[1][1] + 0.5 && (b[0][0] <= b[1][0] ? lo >= b[0][0] - 0.5 && lo <= b[1][0] + 0.5 : lo >= b[0][0] || lo <= b[1][0]);
const hit = (list, ll) => list.some(({ f, b }) => inBox(b, ll) && d3.geoContains(f, ll));

// hexagonal dot grid over land: k = 0 world, 1 Africa, 2 Cameroon
const step = 8.6, dots = [];
for (let row = 0, y = step / 2; y < H; y += step * 0.866, row++) {
  for (let x = (row % 2 ? step / 2 : 0) + step / 2; x < W; x += step) {
    const ll = proj.invert([x, y]);
    if (!ll || ll[1] < -57) continue;
    if (!d3.geoContains(land, ll)) continue;
    dots.push([r1(x), r1(y), hit(cmB, ll) ? 2 : hit(afB, ll) ? 1 : 0]);
  }
}
const cmPath = d3.geoPath(proj).digits(1)(countries50.find((f) => f.id === '120'));
const afPath = d3.geoPath(proj).digits(1)({ type: 'FeatureCollection', features: af110 });
const grat = d3.geoPath(proj).digits(1)(d3.geoGraticule().extent([[-180, -60], [180.01, 85]]).step([20, 20])());
const sphere = d3.geoPath(proj).digits(1)({ type: 'Sphere' });
const landPath = d3.geoPath(proj).digits(1)(land);

/* ---------- Places ---------- */
const PL = {
  foumbot: [10.63, 5.51], douala: [9.70, 4.05], kribi: [9.89, 2.75], yaounde: [11.52, 3.87], kyeossi: [11.33, 2.17],
  libreville: [9.45, 0.39], bata: [9.77, 1.86], ndjamena: [15.04, 12.11], bangui: [18.56, 4.36],
  lagos: [3.38, 6.44], abidjan: [-4.01, 5.29], mombasa: [39.66, -4.05], nairobi: [36.82, -1.29], kigali: [30.06, -1.95],
  rotterdam: [4.05, 51.95], marseille: [4.87, 43.40], jebelali: [55.03, 25.01], shanghai: [122.05, 30.62],
  newyork: [-74.05, 40.67], santos: [-46.30, -23.97], penja: [9.68, 4.64]
};

// Road corridors (simplified through the main towns) and sea lanes (indicative waypoints)
const ROAD = {
  dla: [PL.foumbot, [10.42, 5.48], [10.18, 5.16], [9.94, 4.95], [9.80, 4.55], PL.douala],
  yde: [PL.foumbot, [10.52, 5.15], [10.75, 4.85], [11.23, 4.75], PL.yaounde],
  kri: [PL.douala, [10.13, 3.80], [9.95, 3.20], PL.kribi],
  gab: [PL.yaounde, [11.15, 2.90], PL.kyeossi, [11.58, 1.60], [10.80, 0.70], PL.libreville],
  gnq: [PL.kyeossi, [10.60, 1.95], PL.bata],
  tcd: [PL.foumbot, [10.90, 5.73], [11.82, 6.75], [12.63, 6.47], [13.58, 7.32], [13.40, 9.30], [14.32, 10.59], [15.03, 12.08], PL.ndjamena],
  caf: [PL.yaounde, [13.68, 4.58], [14.55, 5.89], [15.60, 5.94], PL.bangui],
  eaf: [PL.mombasa, [37.9, -3.2], PL.nairobi, [33.5, -1.0], [31.6, -1.3], PL.kigali]
};
const OUT = [PL.douala, [9.30, 3.60], [9.00, 3.00], [8.50, 2.40]];
const WEST = [[3.0, 2.0], [-6.0, 3.5]];
const CAPE = [[8.0, 0.0], [9.0, -10.0], [12.0, -22.0], [16.0, -33.0], [19.0, -36.0], [23.0, -36.0], [28.0, -34.0]];
const CHANNEL = [[33.0, -30.0], [36.5, -24.5], [41.5, -18.0]];
const SEA = {
  lagos: [...OUT, [6.0, 3.6], [4.0, 5.6], PL.lagos],
  abidjan: [...OUT, [5.0, 3.0], [0.0, 4.2], PL.abidjan],
  mombasa: [...OUT, ...CAPE, ...CHANNEL, [42.0, -11.0], [41.0, -6.0], PL.mombasa],
  rotterdam: [...OUT, ...WEST, [-14.0, 7.5], [-18.5, 14.5], [-18.5, 21.0], [-19.0, 28.0], [-12.0, 35.5], [-10.5, 43.5], [-6.0, 48.3], [-1.5, 50.0], [1.6, 51.0], [3.5, 51.9], PL.rotterdam],
  marseille: [...OUT, ...WEST, [-14.0, 7.5], [-18.5, 14.5], [-18.5, 21.0], [-19.0, 28.0], [-12.0, 35.5], [-5.6, 35.95], [-1.0, 36.8], [2.0, 37.8], [4.8, 41.5], PL.marseille],
  jebelali: [...OUT, ...CAPE, ...CHANNEL, [43.0, -11.0], [48.0, -2.0], [55.0, 8.0], [59.5, 17.0], [60.5, 22.0], [58.3, 24.6], [56.5, 26.4], PL.jebelali],
  shanghai: [...OUT, ...CAPE, [50.0, -30.0], [75.0, -15.0], [90.0, 0.0], [96.5, 6.2], [99.5, 4.2], [101.8, 2.5], [103.8, 1.2], [105.5, 2.5], [109.0, 8.0], [114.0, 15.0], [119.0, 22.0], [119.8, 24.2], [122.3, 29.5], PL.shanghai],
  newyork: [...OUT, ...WEST, [-20.0, 7.0], [-40.0, 20.0], [-60.0, 32.0], [-70.0, 39.0], PL.newyork],
  santos: [...OUT, [5.0, 0.0], [-8.0, -8.0], [-25.0, -17.0], [-38.0, -22.0], [-43.0, -24.3], PL.santos]
};

const KM = 6371.0088;
const densify = (pts) => {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], n = Math.max(1, Math.ceil(d3.geoDistance(a, b) / (2 * Math.PI / 180)));
    const ip = d3.geoInterpolate(a, b);
    for (let k = 1; k <= n; k++) out.push(ip(k / n));
  }
  return out;
};
const pathOf = (pts, pr) => 'M' + densify(pts).map((ll) => pr(ll).map(r1).join(' ')).join('L');
const lengthKm = (pts) => Math.round(d3.geoLength({ type: 'LineString', coordinates: pts }) * KM);

const routes = {};
for (const [k, pts] of Object.entries(ROAD)) routes[k] = { mode: 'road', d: pathOf(pts, proj), km: lengthKm(pts) };
for (const [k, pts] of Object.entries(SEA)) routes[k] = { mode: 'sea', d: pathOf(pts, proj), km: lengthKm(pts) };
const pts = Object.fromEntries(Object.entries(PL).map(([k, ll]) => [k, P(ll)]));

/* ---------- Cameroon inset ---------- */
const IW = 520, IH = 600;
const box = { type: 'MultiPoint', coordinates: [[6.2, -0.8], [19.6, -0.8], [19.6, 13.4], [6.2, 13.4]] };
const iproj = d3.geoMercator().fitExtent([[10, 10], [IW - 10, IH - 10]], box).clipExtent([[0, 0], [IW, IH]]);
const ipath = d3.geoPath(iproj).digits(1);
const near = countries50.filter((f) => { const b = d3.geoBounds(f); return b[1][0] > 5 && b[0][0] < 21 && b[1][1] > -2 && b[0][1] < 15; });
const inset = {
  W: IW, H: IH,
  countries: near.map((f) => ({ id: f.id, d: ipath(f), c: ipath.centroid(f).map(r1) })).filter((c) => c.d),
  routes: Object.fromEntries([...Object.entries(ROAD).filter(([k]) => k !== 'eaf').map(([k, p]) => [k, pathOf(p, iproj)]), ['sea', pathOf(OUT, iproj)], ['seaK', pathOf([PL.kribi, [9.40, 2.50], [8.50, 2.40]], iproj)]]),
  pts: Object.fromEntries(['foumbot', 'douala', 'kribi', 'yaounde', 'kyeossi', 'libreville', 'bata', 'ndjamena', 'bangui', 'penja'].map((k) => [k, iproj(PL[k]).map(r1)]))
};

const out = new URL('../site/geo-world.json', import.meta.url);
fs.writeFileSync(out, JSON.stringify({ W, H, dots, land: landPath, cm: cmPath, af: afPath, grat, sphere, pts, routes, inset }));
console.log(`world ${W}x${H}, ${dots.length} dots, ${Object.keys(routes).length} routes, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
console.log(Object.fromEntries(Object.entries(routes).map(([k, r]) => [k, r.km])));
