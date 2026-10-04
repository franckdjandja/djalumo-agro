// Regenerates site/geo.json: African country outlines (Natural Earth 1:50m via world-atlas), the dot grid and key points.
// Usage: npm install && npm run geo
import fs from 'node:fs';
import { createRequire } from 'node:module';
import * as topo from 'topojson-client';
import * as d3 from 'd3-geo';

const require = createRequire(import.meta.url);
const world = JSON.parse(fs.readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const fc = topo.feature(world, world.objects.countries);
// ISO 3166 numeric codes of African states, plus Somaliland and Western Sahara as drawn by Natural Earth
const ids = new Set(['012', '024', '204', '072', '854', '108', '132', '120', '140', '148', '174', '178', '180', '384', '262', '818', '226', '232', '748', '231', '266', '270', '288', '324', '624', '404', '426', '430', '434', '450', '454', '466', '478', '480', '504', '508', '516', '562', '566', '646', '678', '686', '690', '694', '706', '710', '728', '729', '834', '768', '788', '800', '894', '716', '732']);
const af = fc.features.filter((f) => ids.has(f.id) || ['Somaliland', 'W. Sahara'].includes(f.properties.name));
const W = 1000, H = 1080;
const proj = d3.geoNaturalEarth1().fitExtent([[24, 24], [W - 24, H - 24]], { type: 'FeatureCollection', features: af });
const path = d3.geoPath(proj).digits(1);
const r1 = (v) => +v.toFixed(1);
const countries = af.map((f) => ({ id: f.id || f.properties.name, name: f.properties.name, d: path(f), c: path.centroid(f).map(r1), b: path.bounds(f).map((p) => p.map(r1)) }));
const step = 10.5, dots = [];
for (let y = step / 2; y < H; y += step) {
  for (let x = step / 2; x < W; x += step) {
    const ll = proj.invert([x, y]); if (!ll) continue;
    for (let i = 0; i < af.length; i++) if (d3.geoContains(af[i], ll)) { dots.push([r1(x), r1(y), i]); break; }
  }
}
const pts = { foumbot: proj([10.63, 5.51]).map(r1), kigali: proj([30.06, -1.95]).map(r1), nairobi: proj([36.82, -1.29]).map(r1) };
const out = new URL('../site/geo.json', import.meta.url);
fs.writeFileSync(out, JSON.stringify({ W, H, countries, dots, pts }));
console.log(`${countries.length} countries, ${dots.length} dots, ${(fs.statSync(out).size / 1024).toFixed(0)} KB`);
