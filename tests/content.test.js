// v3 content checks: every field photograph is captioned in both languages, every corridor has its
// places and distances, English and French stay in step, and no long dash slips into the copy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (p) => fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const I18N = vm.runInNewContext(read('site/src/i18n.js') + '\n' + read('site/src/i18n-v3.js') + '\n' + read('site/src/i18n-v4.js') + '\n' + read('site/src/i18n-v5.js') + ';I18N');
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
  for (const f of ['site/src/i18n-v3.js', 'site/src/i18n-v7.js', 'site/src/world.js', 'site/src/field.js']) assert.doesNotMatch(read(f), /[–—]/, f);
});

test('visitor copy reads as written by people: no file or metadata talk, no development jargon in the field and planner text', () => {
  const copy = ['site/src/i18n.js', 'site/src/i18n-v3.js', 'site/src/i18n-v7.js', 'site/src/field.js'].map(read).join('\n');
  for (const bad of [/not recorded in the file/i, /non enregistrée dans le fichier/i, /file metadata/i, /métadonnées des fichiers/i, /arrives with the MVP/i, /arrive avec le MVP/i, /noDate/]) assert.doesNotMatch(copy, bad, String(bad));
  for (const lang of ['en', 'fr']) {
    const a = I18N[lang].field.archiveH;
    assert.doesNotMatch(a(1), /\b1 /, lang + ' one photograph is written out');
    assert.match(a(2), /\b2 /, lang);
  }
});

test('the read-through corrections hold: one product name, current claims, the founder story and official country names', () => {
  const copy = ['site/src/i18n.js', 'site/src/i18n-v3.js', 'site/src/i18n-v4.js', 'site/src/i18n-v5.js', 'site/src/i18n-v7.js', 'lib/report/strings.js'].map(read).join('\n');
  for (const bad of [/Season Simulator/, /Simulateur de saison/, /FastAPI service/, /service FastAPI/, /Live in demo/, /En direct dans la démo/, /three scenarios/, /trois scénarios/, /\(T7, T8\)/, /au delà/, /au dessus/, /comparez le /, /mi octobre/, /pousse pousse/i]) assert.doesNotMatch(copy, bad, String(bad));
  for (const lang of ['en', 'fr']) {
    assert.doesNotMatch(JSON.stringify(I18N[lang].privacy), /preview link|lien d’aperçu|simulat/i, lang + ' privacy policy');
    const A = I18N[lang].about;
    assert.equal(A.miles.length, 8, lang + ' eight milestones');
    assert.equal(A.story.length, 5, lang + ' five story paragraphs');
    assert.equal(A.photoCap.length, 2, lang + ' the father photograph has its own caption');
    assert.match(A.lead, lang === 'en' ? /twenty years/ : /vingt ans/);
    assert.ok(A.expLead && A.expLead.length > 40, lang + ' expansion note');
  }
  const geo = JSON.parse(read('site/geo.json'));
  assert.ok(!geo.countries.some((c) => c.name === 'Somaliland'), 'the Africa map follows the UN list of states');
  assert.ok(geo.countries.some((c) => c.id === '706'), 'Somalia is drawn');
});

test('planner phrases: month spans, French elision and the minimum capital', () => {
  const S = I18N.fr.planner.span;
  assert.equal(S.range('avril', 'juin'), 'd’avril à juin');
  assert.equal(S.range('février', 'octobre'), 'de février à octobre');
  assert.equal(I18N.en.planner.span.range('February', 'April'), 'from February to April');
  assert.match(I18N.en.planner.states.below_min('$100', true), /^The minimum capital is 100 USD:/);
  assert.match(I18N.fr.planner.states.below_min('61 000 FCFA', false), /61 000 FCFA, soit l’équivalent de 100 USD/);
  assert.match(I18N.fr.planner.unpricedNote('Tuteurs', 1), /cette ligne/);
  assert.match(I18N.en.planner.unpricedNote('A, B', 2), /these lines/);
});
