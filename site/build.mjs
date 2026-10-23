// Builds the website from site/src.
//   node site/build.mjs --target=production   -> public/ (clean URLs, hashed assets, /api forms, sitemap)
//   node site/build.mjs --target=artifact     -> dist-artifact/index.html (single file preview, host storage)
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const root = path.dirname(new URL(import.meta.url).pathname);
const repo = path.resolve(root, '..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const target = args.target === 'artifact' ? 'artifact' : 'production';
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// SITE_URL wins; on Vercel the production address is detected automatically.
const SITE_URL = (process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + process.env.VERCEL_PROJECT_PRODUCTION_URL : 'https://djalumo.example')).replace(/\/$/, '');
const config = {
  siteUrl: SITE_URL,
  turnstileSiteKey: process.env.TURNSTILE_SITE_KEY || '',
  reports: process.env.REPORTS_ENABLED === 'true',
  analytics: process.env.ANALYTICS_PROVIDER ? { provider: process.env.ANALYTICS_PROVIDER, id: process.env.ANALYTICS_ID || '' } : null
};

const i18nSrc = read('src/i18n.js') + '\n' + read('src/i18n-v3.js') + '\n' + read('src/i18n-v4.js') + '\n' + read('src/i18n-v5.js');
const I18N = vm.runInNewContext(i18nSrc + ';I18N');
const geo = JSON.parse(read('geo.json'));
const geoWorld = JSON.parse(read('geo-world.json'));
const photos = JSON.parse(read('data/photos.json'));
const parts = ['"use strict";', `const AF_TARGET = ${JSON.stringify(target)};`, target === 'production' ? `window.AF_CONFIG = ${JSON.stringify(config)};` : '', i18nSrc, `const GEO = ${JSON.stringify(geo)};`, `const GEOW = ${JSON.stringify(geoWorld)};`, `const PHOTOS = ${JSON.stringify(photos)};`, read('src/core.js')];
if (target === 'production') parts.push(read('src/analytics.js'));
// Season Plan engine v2 and its knowledge base (data with source ids), isolated in their own scope
const kb = JSON.parse(read('data/kb.json'));
parts.push(`const KB = ${JSON.stringify(kb, (k, v) => (k === 'basis' ? undefined : v))};`, `const AFEngine = (function () { const module = undefined;\n${read('src/engine.cjs')}\nreturn AFEngine; })();`);
parts.push(read('src/viz.js'), read('src/planner.js'), read('src/report.js'), read('src/world.js'), read('src/field.js'), read('src/pages.js'));
const js = '(function(){\n' + parts.join('\n') + '\n})();';
const css = read('src/styles.css');
const template = read('template.html');

const ROUTES = ['home', 'planner', 'field', 'platform', 'intelligence', 'solutions', 'data', 'impact', 'about', 'contact', 'demo', 'newsletter', 'privacy', 'terms'];
const EN = I18N.en;
const leadOf = (k) => ({
  home: EN.meta.desc, planner: EN.planner.lead, field: EN.field.lead, platform: EN.platform.lead, intelligence: EN.intel.lead, solutions: EN.solutions.lead, data: EN.data.lead,
  impact: EN.impact.lead, about: EN.about.lead, contact: EN.contact.lead, demo: EN.demo.lead, newsletter: EN.nl.lead,
  privacy: 'How Djalumo Agro collects, uses and protects personal data.', terms: 'Terms of use of the Djalumo Agro website.'
}[k]);
const titleOf = (k) => (k === 'home' ? EN.meta.title : `${EN.meta.pages[k]} · Djalumo Agro`);
const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const urlOf = (k) => (k === 'home' ? SITE_URL + '/' : `${SITE_URL}/${k}`);

function page(k, assets) {
  let html = template;
  const head = target === 'production'
    ? [`<link rel="canonical" href="${urlOf(k)}">`, `<meta property="og:url" content="${urlOf(k)}">`,
       `<link rel="stylesheet" href="/assets/${assets.css}">`, `<script defer src="/assets/${assets.js}"></script>`].join('\n')
    : '';
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${target === 'artifact' ? 'Djalumo Agro' : attr(titleOf(k))}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(">)/, `$1${attr(leadOf(k))}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${attr(titleOf(k))}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(">)/, `$1${attr(leadOf(k))}$2`);
  if (target === 'production') {
    html = html.replace('<style>\n/*CSS*/\n</style>', head).replace('<script>\n/*JS*/\n</script>', '');
  } else {
    html = html.replace('/*CSS*/', () => css).replace('/*JS*/', () => js);
  }
  return html;
}

function copyImages(dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(path.join(root, 'img'), dest, { recursive: true });
}

if (target === 'artifact') {
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
  for (const k of ROUTES) fs.writeFileSync(path.join(out, k === 'home' ? 'index.html' : `${k}.html`), page(k, assets));
  fs.writeFileSync(path.join(out, '404.html'), page('home', assets).replace(/<title>[^<]*<\/title>/, '<title>Signal not found · Djalumo Agro</title>').replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">'));
  copyImages(path.join(out, 'img'));
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${ROUTES.map((k) => `  <url><loc>${urlOf(k)}</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>${k === 'home' ? '1.0' : ['privacy', 'terms'].includes(k) ? '0.3' : '0.8'}</priority></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
  console.log(`production build: ${ROUTES.length} pages, ${assets.js} (${(js.length / 1024).toFixed(0)} KB), ${assets.css}`);
}
