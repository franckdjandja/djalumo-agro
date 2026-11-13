// Builds the website from site/src.
//   node site/build.mjs --target=production   -> public/ (clean URLs, hashed assets, /api forms, sitemap)
//   node site/build.mjs --target=artifact     -> dist-artifact/index.html (single file preview, host storage)
//   node site/build.mjs --target=android      -> android-www/ (offline bundle of the Android application)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const root = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(root, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const target = ['artifact', 'android'].includes(args.target) ? args.target : 'production';
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// The public address of the site. SITE_URL overrides it, for instance on a test deployment.
const SITE_URL = (process.env.SITE_URL || 'https://agro.djalumo.com').replace(/\/$/, '');
// The application sends its forms to the public site: APP_SITE_URL, or the current Vercel address by default.
const APP_SITE_URL = (process.env.APP_SITE_URL || 'https://agro.djalumo.com').replace(/\/$/, '');
const pkg = JSON.parse(fs.readFileSync(path.join(repo, 'package.json'), 'utf8'));
const config = {
  siteUrl: target === 'android' ? APP_SITE_URL : SITE_URL,
  appVersion: target === 'android' ? (process.env.APP_VERSION || pkg.version) : undefined,
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
  reports: process.env.REPORTS_ENABLED === 'true',
  analytics: process.env.ANALYTICS_PROVIDER ? { provider: process.env.ANALYTICS_PROVIDER, id: process.env.ANALYTICS_ID || '' } : null
};

const i18nSrc = read('src/i18n.js') + '\n' + read('src/i18n-v3.js') + '\n' + read('src/i18n-v4.js') + '\n' + read('src/i18n-v5.js') + '\n' + read('src/i18n-v6.js') + '\n' + read('src/i18n-v7.js') + '\n' + read('src/i18n-seo.js') + '\n' + read('src/i18n-guides.js');
const I18N = vm.runInNewContext(i18nSrc + ';I18N');
const geo = JSON.parse(read('geo.json'));
const geoWorld = JSON.parse(read('geo-world.json'));
const photos = JSON.parse(read('data/photos.json'));
const parts = ['"use strict";', `const AF_TARGET = ${JSON.stringify(target)};`, target !== 'artifact' ? `window.AF_CONFIG = ${JSON.stringify(config)};` : '', i18nSrc, `const GEO = ${JSON.stringify(geo)};`, `const GEOW = ${JSON.stringify(geoWorld)};`, `const PHOTOS = ${JSON.stringify(photos)};`, read('src/core.js')];
if (target === 'production') parts.push(read('src/analytics.js'));
// Season Plan engine v2 and its knowledge base (data with source ids), isolated in their own scope
const kb = JSON.parse(read('data/kb.json'));
parts.push(`const KB = ${JSON.stringify(kb, (k, v) => (k === 'basis' ? undefined : v))};`, `const AFEngine = (function () { const module = undefined;\n${read('src/engine.cjs')}\nreturn AFEngine; })();`);
const GUIDES = guideData();
const guideSeo = { en: {}, fr: {} };
for (const lang of ['en', 'fr']) {
  const G = I18N[lang].guides, S = G.seo;
  guideSeo[lang].crops = S.hub;
  for (const [id, g] of Object.entries(GUIDES)) {
    const c = G.crops[id], amt = S.million(new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 }).format(Math.round(g.cost / 1e5) / 10));
    const ys = g.yields.flatMap((y) => [y.poor, y.good]), nf1 = (v) => new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', { maximumFractionDigits: 1 }).format(v);
    guideSeo[lang]['crops/' + id] = [lang === 'fr' ? S.title(null, c) : S.title(kb.crops[id].name.en), g.season ? S.season(lang === 'fr' ? c.de : c.lower, amt, nf1(Math.min(...ys)), nf1(Math.max(...ys))) : S.long(lang === 'fr' ? c.de : c.lower, amt)];
  }
  Object.assign(I18N[lang].seo, guideSeo[lang]);
}
parts.push(`const GUIDES = ${JSON.stringify(GUIDES)};`, `Object.assign(I18N.en.seo, ${JSON.stringify(guideSeo.en)}); Object.assign(I18N.fr.seo, ${JSON.stringify(guideSeo.fr)});`);
parts.push(read('src/viz.js'), read('src/planner.js'), read('src/report.js'), read('src/world.js'), read('src/field.js'), read('src/guides.js'), read('src/pages.js'));
if (target === 'android') parts.push(read('src/app.js'));
const js = '(function(){\n' + parts.join('\n') + '\n})();';
const css = read('src/styles.css') + (target === 'android' ? '\n' + read('src/app.css') : '');
const template = read('template.html');

const ROUTES = ['home', 'planner', 'field', 'platform', 'intelligence', 'solutions', 'data', 'impact', 'about', 'contact', 'demo', 'newsletter', 'privacy', 'terms', 'crops', ...Object.keys(kb.crops).map((id) => 'crops/' + id)];
const EN = I18N.en;
const titleOf = (k, lang = 'en') => I18N[lang].seo[k][0];
const descOf = (k, lang = 'en') => I18N[lang].seo[k][1];
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/** Public address of a page: /about in English, /fr/about in French. */
const pathOf = (k, lang = 'en') => (lang === 'fr' ? (k === 'home' ? '/fr' : '/fr/' + k) : (k === 'home' ? '/' : '/' + k));
const urlOf = (k, lang = 'en') => SITE_URL + pathOf(k, lang);

/** What search engines learn about Djalumo Agro: the organization, its founder, the site and the page itself. */
function structuredData(k, lang) {
  const org = SITE_URL + '/#organization', site = SITE_URL + '/#website', founder = SITE_URL + '/about#founder';
  const graph = [
    { '@type': 'Organization', '@id': org, name: 'Djalumo Agro', alternateName: 'Djalumo', url: SITE_URL + '/',
      logo: { '@type': 'ImageObject', url: SITE_URL + '/icon-512.png', width: 512, height: 512 },
      image: SITE_URL + '/img/djalumo-agro-preview.png', description: I18N.en.seo.home[1], email: 'franck.djandja@djalumo.com',
      founder: { '@id': founder }, areaServed: 'Africa', knowsLanguage: ['en', 'fr'],
      knowsAbout: ['agricultural decision intelligence', 'farm budgeting', 'crop planning', 'agricultural data analysis'],
      sameAs: ['https://www.linkedin.com/company/djalumo-agro/', 'https://github.com/franckdjandja/djalumo-agro'] },
    { '@type': 'Person', '@id': founder, name: 'Franck Junior Djandja Tomwa',
      jobTitle: ['Founder of Djalumo Agro', 'Telecommunications Engineer', 'Data Analyst'], worksFor: { '@id': org },
      sameAs: ['https://www.linkedin.com/in/franck-junior-djandja-tomwa-87761522b', 'https://github.com/franckdjandja'] },
    { '@type': 'WebSite', '@id': site, url: SITE_URL + '/', name: 'Djalumo Agro', alternateName: 'Djalumo', inLanguage: ['en', 'fr'], publisher: { '@id': org } },
    { '@type': k === 'about' ? 'AboutPage' : k === 'contact' ? 'ContactPage' : 'WebPage', '@id': urlOf(k, lang) + '#webpage', url: urlOf(k, lang),
      name: titleOf(k, lang), description: descOf(k, lang), inLanguage: lang, isPartOf: { '@id': site }, about: { '@id': org } }
  ];
  // A crop guide sits under the guides hub: the trail lets search results show where the page belongs.
  if (k.startsWith('crops/')) {
    const G = I18N[lang].guides;
    graph[3].breadcrumb = { '@id': urlOf(k, lang) + '#breadcrumb' };
    graph.push({ '@type': 'BreadcrumbList', '@id': urlOf(k, lang) + '#breadcrumb', itemListElement: [
      { '@type': 'ListItem', position: 1, name: G.crumb, item: urlOf('crops', lang) },
      { '@type': 'ListItem', position: 2, name: kb.crops[k.slice(6)].name[lang], item: urlOf(k, lang) }] });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function page(k, assets, lang = 'en', body) {
  let html = template;
  if (target === 'production') {
    const alt = [['en', 'en'], ['fr', 'fr'], ['x-default', 'en']].map(([h, l]) => `<link rel="alternate" hreflang="${h}" href="${urlOf(k, l)}">`);
    const head = [`<link rel="canonical" href="${urlOf(k, lang)}">`, ...alt, `<meta property="og:url" content="${urlOf(k, lang)}">`,
      `<meta property="og:image" content="${SITE_URL}/img/djalumo-agro-preview.png">`, '<meta property="og:image:type" content="image/png">', '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="627">',
      `<meta property="og:image:alt" content="${attr(lang === 'fr' ? 'Djalumo Agro, intelligence agricole pour l’Afrique' : 'Djalumo Agro, agricultural decision intelligence for Africa')}">`, `<meta name="twitter:image" content="${SITE_URL}/img/djalumo-agro-preview.png">`,
      '<link rel="icon" href="/favicon.ico" sizes="48x48">', '<link rel="icon" href="/favicon.svg" type="image/svg+xml">', '<link rel="apple-touch-icon" href="/apple-touch-icon.png">', '<link rel="manifest" href="/manifest.webmanifest">',
      `<link rel="stylesheet" href="/assets/${assets.css}">`, `<script defer src="/assets/${assets.js}"></script>`].join('\n');
    html = html.replace('<html lang="en">', `<html lang="${lang}">`)
      .replace(/<title>[^<]*<\/title>/, `<title>${attr(titleOf(k, lang))}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${attr(descOf(k, lang))}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${attr(titleOf(k, lang))}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${attr(descOf(k, lang))}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(">)/, `$1${attr(titleOf(k, lang))}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(">)/, `$1${attr(descOf(k, lang))}$2`)
      .replace(/(<meta property="og:locale" content=")[^"]*(">)/, `$1${lang === 'fr' ? 'fr_FR' : 'en_US'}$2`)
      .replace(/(<meta property="og:locale:alternate" content=")[^"]*(">)/, `$1${lang === 'fr' ? 'en_US' : 'fr_FR'}$2`)
      .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${structuredData(k, lang)}</script>`)
      // Icon files served from the site root replace the inline icon (browser tab, bookmarks, iPhone home screen).
      .replace(/<link rel="icon" type="image\/svg\+xml" href="data:[^"]*">\n/, '')
      .replace('<style>\n/*CSS*/\n</style>', () => head).replace('<script>\n/*JS*/\n</script>', '');
    // The text of the page is written into the HTML, so search engines and link previews read it without running the script.
    if (body) html = html.replace('<div id="chrome-top"></div>', () => `<div id="chrome-top">${body.top}</div>`)
      .replace(/<main id="main" tabindex="-1">[\s\S]*?<\/main>/, () => `<main id="main" tabindex="-1">${body.main}</main>`)
      .replace('<div id="chrome-bottom"></div>', () => `<div id="chrome-bottom">${body.bottom}</div>`);
  } else {
    html = html.replace(/<title>[^<]*<\/title>/, '<title>Djalumo Agro</title>')
      .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${attr(descOf(k))}$2`)
      .replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
  }
  return html;
}

/** Renders a page with the site's own script in a simulated browser and returns the header, page and footer HTML. */
async function prerender(html, url) {
  const { JSDOM, VirtualConsole } = await import('jsdom');
  const dom = new JSDOM(html, { url, runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: new VirtualConsole() });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  w.scrollTo = () => {};
  w.fetch = () => Promise.reject(new Error('no network at build time'));
  w.HTMLCanvasElement.prototype.getContext = () => null;
  w.HTMLElement.prototype.focus = function () {};
  w.SVGElement.prototype.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 });
  w.SVGElement.prototype.getComputedTextLength = () => 0;
  w.SVGElement.prototype.getTotalLength = () => 0;
  w.SVGElement.prototype.getPointAtLength = () => ({ x: 0, y: 0 });
  w.SVGElement.prototype.getScreenCTM = () => null;
  w.eval(js);
  await new Promise((r) => setTimeout(r, 30));
  // Large drawings such as the world map are left to the script: they add weight and no text.
  for (const svg of w.document.querySelectorAll('#main svg')) if (svg.outerHTML.length > 8000) svg.remove();
  const get = (id) => w.document.getElementById(id).innerHTML;
  const out = { top: get('chrome-top'), main: get('main'), bottom: get('chrome-bottom') };
  w.close();
  return out;
}

/**
 * Crop guides: the Season Planner run once per crop on a reference hectare in the Foumbot area, rented land,
 * hired labour, a motor pump for the vegetables and rain alone for the long crops, starting in the least risky
 * month. Long crops use their longest plan so that the break even price reflects full production.
 */
function guideData() {
  const E = createRequire(import.meta.url)('./src/engine.cjs');
  const day = 864e5, out = {};
  for (const [id, c] of Object.entries(kb.crops)) {
    const profile = c.profile || 'season', season = profile === 'season';
    const horizon = season ? null : (c.horizon_options || []).reduce((m, o) => Math.max(m, o.months), 0) || c.horizon_months;
    const base = { capital: 0, currency: 'XAF', mode: 'crop', area: 1, crop: id, water: season ? 'pump' : 'rainfed', start: '2027-01-01', land: 'rent', market: 'local',
      familyLabour: 0, ownTools: false, system: 'open', fieldWork: 'hand', structure: 'new', priceXafKg: null, product: null, horizon };
    const best = E.plan(kb, base).bestMonth;
    const r = E.plan(kb, { ...base, start: '2027-' + String(best + 1).padStart(2, '0') + '-01' });
    const start = new Date(r.calendar.start).getTime();
    const cats = {};
    r.budget.lines.forEach((l) => { const k = l.upfront ? 'equipment' : l.cat; cats[k] = (cats[k] || 0) + l.total; });
    const seen = new Set(), steps = [];
    for (const st of r.itinerary) {
      if (seen.has(st.id)) continue; seen.add(st.id);
      const from = Math.round((new Date(st.from).getTime() - start) / day), to = Math.round((new Date(st.to).getTime() - start) / day);
      if (!season && from > 400) continue;
      steps.push({ label: st.label, from, to });
    }
    const quoted = JSON.stringify([c.disease_note, c.harvest_detail || '', c.price]).match(/\b[A-Z]{1,2}\d+\b/g) || [];
    const src = new Set([].concat(c.src || [], c.price.src || [], c.harvest_src || [], ...r.itinerary.map((st) => st.src || []), quoted));
    const rows = (r.water.balance && r.water.balance.rows) || [];
    const y = c.yield_t_ha, product = c.products ? Object.values(c.products)[0] : null;
    // The same hectare when the farmer already owns part of what the reference case buys; labour stays hired.
    const costOf = (o) => { const v = E.plan(kb, { ...base, start: r.input.start, ...o }); return Math.round(season ? v.budget.total : v.requiredXaf); };
    const have = (season ? [['land', { land: 'own' }], ['irrigation', { water: 'existing' }], ['tools', { ownTools: true }], ['all', { land: 'own', water: 'existing', ownTools: true }]]
      : [['land', { land: 'own' }], ['tools', { ownTools: true }], ['allLong', { land: 'own', ownTools: true }]]).map(([k, o]) => [k, costOf(o)]);
    out[id] = {
      profile, season, group: season ? 'season' : profile === 'orchard' ? 'orchard' : 'long', bestMonth: best, horizon,
      cost: Math.round(season ? r.budget.total : r.requiredXaf), reserve: Math.round(r.budget.reserve || 0),
      cats: Object.entries(cats).filter(([, v]) => v >= 500).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(v)]),
      yields: season ? (JSON.stringify(y.wet) === JSON.stringify(y.dry) ? [{ k: 'both', ...y.wet }] : [{ k: 'wet', ...y.wet }, { k: 'dry', ...y.dry }]) : [{ k: profile === 'orchard' ? 'mature' : 'cycle', ...y }],
      refYield: season ? r.scenarios.average.yieldTHa : null,
      be: Math.round(season ? r.breakEven.priceXafKg : (r.breakEven.pricePerUnit || r.breakEven.priceXafKg)),
      unit: product && product.unit_label ? product.unit_label : null,
      refPrice: c.price.reference_xaf_kg || null, price: c.price.reference_xaf_kg ? c.price.note : (c.price.observed || null),
      margin: r.priceSource === 'reference' ? { margin: Math.round(r.scenarios.average.margin), roi: r.scenarios.average.roi } : null,
      firstDays: season ? Math.round((new Date(r.calendar.firstHarvest).getTime() - start) / day) : null,
      firstMonths: season ? null : c.first_harvest_months || r.firstHarvestMonths,
      steps, harvestDetail: c.harvest_detail || null, disease: c.disease_note, heat: c.heat_c || null,
      water: { option: base.water, need: Math.round(rows.reduce((a, x) => a + x.etc, 0)), rain: Math.round(rows.reduce((a, x) => a + Math.min(x.peff, x.etc), 0)), m3: Math.round(r.water.grossM3 || 0) },
      sources: [...src].filter((k) => kb.sources[k]),
      have, covered: E.systemsFor(kb, id).length > 1
    };
  }
  return out;
}

function copyImages(dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(root, 'img'), dest, { recursive: true });
}

if (target === 'android') {
  // One page, hash routing, everything inline: the planner, the map and the photos work without a connection.
  const out = path.join(repo, 'android-www');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  const origin = new URL(APP_SITE_URL).origin;
  const csp = `default-src 'self'; font-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${origin} https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; object-src 'none'; base-uri 'self'`;
  const html = page('home').replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${csp}">`)
    .replace('<meta name="color-scheme" content="light">', '<meta name="color-scheme" content="light">\n<meta name="format-detection" content="telephone=no">');
  fs.writeFileSync(path.join(out, 'index.html'), html);
  copyImages(path.join(out, 'img'));
  // Manrope, the brand typeface, travels with the application (licence OFL, see lib/report/fonts/OFL.txt).
  fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
  for (const w of ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']) fs.copyFileSync(path.join(repo, 'lib/report/fonts', `Manrope-${w}.ttf`), path.join(out, 'fonts', `Manrope-${w}.ttf`));
  console.log(`android build: ${(fs.statSync(path.join(out, 'index.html')).size / 1024).toFixed(0)} KB, forms sent to ${APP_SITE_URL}`);
} else if (target === 'artifact') {
  const out = path.join(repo, 'dist-artifact');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), page('home'));
  copyImages(path.join(out, 'img'));
  console.log(`artifact build: ${(fs.statSync(path.join(out, 'index.html')).size / 1024).toFixed(0)} KB`);
} else {
  const out = path.join(repo, 'public');
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });
  const h = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 10);
  const assets = { js: `app.${h(js)}.js`, css: `app.${h(css)}.css` };
  fs.writeFileSync(path.join(out, 'assets', assets.js), js);
  fs.writeFileSync(path.join(out, 'assets', assets.css), css);
  // Every page exists in English at /page and in French at /fr/page, with its text already written in the HTML.
  fs.mkdirSync(path.join(out, 'fr'), { recursive: true });
  let prerendered = 0;
  for (const lang of ['en', 'fr']) {
    for (const k of ROUTES) {
      const shell = page(k, assets, lang);
      let body = null;
      try { body = await prerender(shell, urlOf(k, lang)); prerendered++; } catch (e) { console.warn(`prerender failed for ${lang} ${k}: ${e.message}`); }
      const file = lang === 'fr' ? path.join('fr', k === 'home' ? 'index.html' : `${k}.html`) : (k === 'home' ? 'index.html' : `${k}.html`);
      fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
      fs.writeFileSync(path.join(out, file), page(k, assets, lang, body));
      // /fr itself: served from fr.html as well as fr/index.html, whatever the host's folder rules.
      if (lang === 'fr' && k === 'home') fs.writeFileSync(path.join(out, 'fr.html'), page(k, assets, lang, body));
    }
  }
  // On the host, a page without its text would be invisible to search engines: the deployment stops instead.
  if (process.env.VERCEL && prerendered < ROUTES.length * 2) throw new Error(`only ${prerendered} of ${ROUTES.length * 2} pages were prerendered`);
  fs.writeFileSync(path.join(out, '404.html'), page('home', assets).replace(/<title>[^<]*<\/title>/, '<title>Signal not found · Djalumo Agro</title>').replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">').replace(/<link rel="(canonical|alternate)"[^>]*>\n/g, ''));
  copyImages(path.join(out, 'img'));
  for (const f of fs.readdirSync(path.join(root, 'icons'))) fs.copyFileSync(path.join(root, 'icons', f), path.join(out, f));
  // The sitemap lists both languages of every page and tells search engines they are translations of each other.
  const today = new Date().toISOString().slice(0, 10);
  const prio = (k) => (k === 'home' ? '1.0' : ['privacy', 'terms'].includes(k) ? '0.3' : '0.8');
  const alts = (k) => ['en', 'fr'].map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${urlOf(k, l)}"/>`).join('') + `<xhtml:link rel="alternate" hreflang="x-default" href="${urlOf(k, 'en')}"/>`;
  const urls = ['en', 'fr'].flatMap((l) => ROUTES.map((k) => `  <url><loc>${urlOf(k, l)}</loc>${alts(k)}<lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${prio(k)}</priority></url>`));
  fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log(`production build: ${ROUTES.length} pages in English and French (${prerendered} prerendered), ${assets.js} (${(js.length / 1024).toFixed(0)} KB), ${assets.css}`);
}
