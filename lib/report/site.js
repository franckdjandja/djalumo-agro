// Server side access to the simulator: the same engine, knowledge base and interface wording as the website.
// The files are read once per instance; vercel.json lists them in includeFiles for the report function.
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let cache = null;

export function loadSite() {
  if (cache) return cache;
  const engine = require('../../site/src/engine.cjs');
  const kb = JSON.parse(fs.readFileSync(new URL('../../site/data/kb.json', import.meta.url), 'utf8'));
  const src = ['i18n.js', 'i18n-v3.js', 'i18n-v4.js'].map((f) => fs.readFileSync(new URL('../../site/src/' + f, import.meta.url), 'utf8')).join('\n');
  const I18N = vm.runInNewContext(src + ';I18N', {});
  cache = { engine, kb, I18N };
  return cache;
}

/** Reads a bilingual value from the knowledge base. */
export const tr = (x, lang) => (x && typeof x === 'object' && !Array.isArray(x)) ? (x[lang] || x.en || '') : (x == null ? '' : String(x));
