// v3 content checks: every field photograph is captioned in both languages, every corridor has its
// places and distances, English and French stay in step, and no long dash slips into the copy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const I18N = vm.runInNewContext(read('site/src/i18n.js') + '\n' + read('site/src/i18n-v3.js') + '\n' + read('site/src/i18n-v4.js') + ';I18N');
const PHOTOS = JSON.parse(read('site/data/photos.json'));
const GEOW = JSON.parse(read('site/geo-world.json'));
const manifest = JSON.parse(read('data/field/manifest.json')).photos;

test('all 73 field photographs are built, with dimensions and a plate', () => {
  assert.equal(manifest.length, 73);
  assert.equal(Object.keys(PHOTOS).length, 73);
  for (const p of manifest) {
    const m = PHOTOS[p.id];
    assert.ok(m, 'missing ' + p.id);
    assert.ok(m.w > 0 && m.h > 0 && m.sw > 0 && m.sh > 0);
    assert.ok(m.plate >= 1 && m.plate <= 8);
    assert.ok(fs.existsSync(new URL('../site/img/field/' + p.id + '.webp', import.meta.url)));
    assert.ok(fs.existsSync(new URL('../site/img/field/' + p.id + '-s.webp', import.meta.url)));
  }
});

test('every photograph has a caption in English and in French', () => {
  for (const lang of ['en', 'fr']) {
    const F = I18N[lang].field;
    assert.equal(F.plates.length, 8);
    for (const [id, m] of Object.entries(PHOTOS)) {
      const text = m.panel ? F.plates[m.plate - 1].panels[m.panel] : F.archive[id];
      assert.ok(text && text.length > 8, lang + ' caption missing for ' + id);
    }
    F.plates.forEach((p) => { assert.ok(PHOTOS[p.cover], 'cover ' + p.cover); assert.ok(p.title && p.cap && p.read && p.stage && p.period); });
  }
});

test('the eight plates keep the three panels of the original report (plate 1 adds the 2021 portrait)', () => {
  for (let n = 1; n <= 8; n++) {
    const panels = Object.values(PHOTOS).filter((m) => m.plate === n && m.panel).map((m) => m.panel).sort().join('');
    assert.equal(panels, 'ABC', 'plate ' + n);
  }
});

test('every corridor has a geometry, a destination and a label in both languages', () => {
  const src = read('site/src/world.js');
  const routes = [...src.matchAll(/\['(\w+)', '(\w+)', '(today|target)', '(\w+)'\]/g)];
  assert.equal(routes.length, 17);
  for (const [, key, group, , dest] of routes) {
    assert.ok(GEOW.routes[key] && GEOW.routes[key].d.length > 10, 'route ' + key);
    assert.ok(GEOW.pts[dest], 'place ' + dest);
    for (const lang of ['en', 'fr']) {
      assert.ok(I18N[lang].world.places[dest], lang + ' place ' + dest);
      assert.ok(I18N[lang].world.groups[group], lang + ' group ' + group);
    }
  }
  // sea distances from Douala are in the expected range of the usual shipping routes
  assert.ok(GEOW.routes.rotterdam.km > 8000 && GEOW.routes.rotterdam.km < 9500);
  assert.ok(GEOW.routes.shanghai.km > 18000 && GEOW.routes.shanghai.km < 20500);
});

test('English and French have the same structure for the new content', () => {
  const shape = (o) => (Array.isArray(o) ? o.map(shape) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, shape(o[k])])) : typeof o);
  for (const k of ['world', 'field']) assert.deepEqual(shape(I18N.fr[k]), shape(I18N.en[k]), k);
  assert.equal(I18N.en.meta.pages.privacy, 'Privacy policy');
  assert.equal(I18N.fr.meta.pages.field, 'Preuves terrain');
});

test('no em or en dash in the new copy', () => {
  for (const f of ['site/src/i18n-v3.js', 'site/src/world.js', 'site/src/field.js']) assert.doesNotMatch(read(f), /[–—]/, f);
});
