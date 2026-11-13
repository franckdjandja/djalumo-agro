import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('the site builds: content, knowledge base and engine bundle without syntax errors', () => {
  const out = execFileSync(process.execPath, ['site/build.mjs', '--target=artifact'], { cwd: root, encoding: 'utf8' });
  assert.match(out, /artifact build/);
});

test('the android bundle builds offline: one page, hash routes, forms sent to the public site', async () => {
  const fs = await import('node:fs');
  const out = execFileSync(process.execPath, ['site/build.mjs', '--target=android'], { cwd: root, encoding: 'utf8', env: { ...process.env, APP_SITE_URL: 'https://djalumo.test' } });
  assert.match(out, /android build/);
  const html = fs.readFileSync(new URL('../android-www/index.html', import.meta.url), 'utf8');
  assert.match(html, /const AF_TARGET = "android"/);
  assert.match(html, /"siteUrl":"https:\/\/djalumo\.test"/);
  assert.match(html, /connect-src 'self' https:\/\/djalumo\.test/);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.ok(fs.existsSync(new URL('../android-www/img/founder-tomato.webp', import.meta.url)));
  assert.match(html, /function appBoot\(\)/);
  assert.match(html, /\.a-tabs\{/);
  assert.ok(fs.existsSync(new URL('../android-www/fonts/Manrope-ExtraBold.ttf', import.meta.url)));
  const site = execFileSync(process.execPath, ['site/build.mjs', '--target=artifact'], { cwd: root, encoding: 'utf8' });
  assert.match(site, /artifact build/);
  assert.doesNotMatch(fs.readFileSync(new URL('../dist-artifact/index.html', import.meta.url), 'utf8'), /function appBoot\(\)/);
});

test('search engines get every page in English and French, with its text, its language links and the organization', async () => {
  const fs = await import('node:fs');
  const out = execFileSync(process.execPath, ['site/build.mjs', '--target=production'], { cwd: root, encoding: 'utf8', env: { ...process.env, SITE_URL: 'https://agro.djalumo.com' } });
  assert.match(out, /54 prerendered/);
  const read = (p) => fs.readFileSync(new URL('../public/' + p, import.meta.url), 'utf8');
  const titles = new Set();
  for (const [file, lang, url] of [['about.html', 'en', '/about'], ['fr/about.html', 'fr', '/fr/about'], ['index.html', 'en', '/'], ['fr/index.html', 'fr', '/fr'], ['fr/planner.html', 'fr', '/fr/planner'], ['crops.html', 'en', '/crops'], ['crops/tomato.html', 'en', '/crops/tomato'], ['fr/crops/avocado.html', 'fr', '/fr/crops/avocado']]) {
    const html = read(file);
    assert.match(html, new RegExp(`<html lang="${lang}">`), file);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://agro.djalumo.com${url.replace(/\//g, '\\/')}">`), file);
    assert.match(html, /<link rel="alternate" hreflang="fr" href="https:\/\/agro\.djalumo\.com\/fr[^"]*">/, file);
    assert.match(html, /<link rel="alternate" hreflang="x-default"/, file);
    const t = html.match(/<title>([^<]*)<\/title>/)[1];
    assert.ok(t.length <= 60 && !titles.has(t), 'title ' + t);
    titles.add(t);
    const d = html.match(/<meta name="description" content="([^"]*)">/)[1];
    assert.ok(d.length >= 80 && d.length <= 160, 'description length ' + file);
    const main = html.match(/<main id="main" tabindex="-1">([\s\S]*?)<\/main>/)[1];
    assert.ok(main.replace(/<[^>]+>/g, '').length > 1500, 'prerendered text ' + file);
    assert.doesNotMatch(main, /href="#(planner|about|field|contact)"/, 'links are real paths ' + file);
    const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
    const types = ld['@graph'].map((n) => n['@type']);
    assert.ok(types.includes('Organization') && types.includes('WebSite') && types.includes('Person'), file);
  }
  assert.match(read('about.html'), /Franck Junior Djandja Tomwa/);
  assert.match(read('fr/about.html'), /plus de vingt ans de travail/);
  assert.match(read('fr/contact.html'), /mailto:franck\.djandja@djalumo\.com/);
  const map = read('sitemap.xml');
  assert.equal((map.match(/<url>/g) || []).length, 54);
  assert.match(map, /<loc>https:\/\/agro\.djalumo\.com\/fr\/crops\/cassava<\/loc>/);
  assert.match(map, /<loc>https:\/\/agro\.djalumo\.com\/fr\/field<\/loc><xhtml:link rel="alternate" hreflang="en" href="https:\/\/agro\.djalumo\.com\/field"\/>/);
  assert.ok(read('index.html').length < 120000, 'the home page stays light: the world map is drawn by the script');
});

test('every crop guide is built from the planner figures, in both languages', async () => {
  const fs = await import('node:fs');
  const read = (p) => fs.readFileSync(new URL('../public/' + p, import.meta.url), 'utf8');
  const text = (html) => html.match(/<main id="main" tabindex="-1">([\s\S]*?)<\/main>/)[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const ids = fs.readdirSync(new URL('../public/crops/', import.meta.url)).map((f) => f.replace('.html', ''));
  assert.equal(ids.length, 12);
  for (const id of ids) {
    for (const [file, lang] of [['crops/' + id + '.html', 'en'], ['fr/crops/' + id + '.html', 'fr']]) {
      const html = read(file), t = text(html);
      assert.match(t, lang === 'en' ? /What a hectare costs/ : /Ce que coûte un hectare/, file);
      assert.match(t, lang === 'en' ? /Break even price \d/ : /Prix d’équilibre \d/, file);
      assert.match(t, /\[[A-Z]{1,2}\d+\]/, 'sources listed ' + file);
      assert.doesNotMatch(t, /NaN|undefined|Infinity|\$NaN/, file);
      assert.match(html, new RegExp('href="' + (lang === 'fr' ? '/fr' : '') + '/planner\\?crop=' + id + '"'), 'planner link ' + file);
    }
  }
  assert.match(text(read('crops/greenbean.html')), /Sowing with DAP in the furrow Week 1/);
});
