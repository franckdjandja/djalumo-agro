// Collecte nocturne de la veille Djalumo Agro : lit les sources de sources.json, garde les articles récents
// qui parlent d'agriculture, retire les doublons, les classe, et écrit <out>/AAAA-MM-JJ.json et <out>/latest.json.
// Aucune intelligence artificielle ici : la vérification et le choix des sujets se font ensuite, à la main ou par la veille du matin.
// Usage : node scripts/veille/collect.mjs [dossier de sortie]   (WINDOW_HOURS=36 par défaut)
import fs from 'fs';
import path from 'path';

const OUT = process.argv[2] || 'veille-out';
const WINDOW_HOURS = Number(process.env.WINDOW_HOURS) || 36;
const MAX_ITEMS = 150, MAX_PER_SOURCE = 25;
// Réseaux sociaux et agrégateurs vidéo : pas des sources citables.
const SOCIAL = /(facebook|instagram|tiktok|youtube|linkedin|twitter|x\.com|threads\.net|whatsapp)/i;
const UA = 'Mozilla/5.0 (compatible; DjalumoAgroVeille/1.0; +https://agro.djalumo.com)';
const { sources } = JSON.parse(fs.readFileSync(new URL('./sources.json', import.meta.url), 'utf8'));

const W0 = '(?<![\\p{L}\\p{N}])', W1 = '(?![\\p{L}\\p{N}])';
const words = (body, flags) => new RegExp(W0 + '(' + body + ')' + W1, flags);
const AGRI = words(String.raw`agri\w*|agro\w*|farm\w*|crop\w*|harvest\w*|irrigat\w*|greenhouse\w*|fertili[sz]\w*|seed\w*|soil\w*|livestock|dairy|poultry|fisher\w*|aquacult\w*|food (?:security|prices?|systems?|imports?|inflation)|cocoa|coffee|cassava|maize|rice|tomato\w*|plantain\w*|banana\w*|palm oil|horticult\w*|agtech|agritech|agribusiness|tractor\w*|mechani[sz]ation|FAO|IFAD|FIDA|CGIAR|IITA|AGRA|agricult\w*|paysan\w*|récolte\w*|maraîch\w*|engrais|semence\w*|élevage|pêche|sécurité alimentaire|denrées|cacao|café|manioc|maïs|riz|tomate\w*|filière\w*|sous serre|serres? (?:agricoles?|maraîchères?)|mécanisation|tracteur\w*|vivrier\w*|intrants?`, 'giu');
const REGIONS = [
  ['CM', words(String.raw`cameroun|cameroon|yaoundé|yaounde|douala|bafoussam|foumbot|kribi|garoua|bamenda`, 'iu')],
  ['RW', words(String.raw`rwanda|kigali`, 'iu')],
  ['KE', words(String.raw`kenya|nairobi|mombasa|kisumu`, 'iu')],
  ['CEMAC', words(String.raw`cemac|gabon|tchad|chad|congo|centrafrique|central african republic|guinée équatoriale|equatorial guinea`, 'iu')],
  ['AF', words(String.raw`africa\w*|afrique|africain\w*|nigeria|ghana|côte d'ivoire|ivory coast|sénégal|senegal|ethiopia|éthiopie|tanzania|tanzanie|uganda|ouganda|zambia|malawi|morocco|maroc|egypt|égypte|south africa|afrique du sud|sahel`, 'iu')],
];

const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const strip = (s) => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const tag = (block, name) => { const m = block.match(new RegExp('<' + name + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + name + '>', 'i')); return m ? m[1] : ''; };
const attr = (block, name, a) => { const m = block.match(new RegExp('<' + name + '\\s[^>]*' + a + '="([^"]+)"', 'i')); return m ? decode(m[1]) : ''; };

function parse(xml, src) {
  const out = [];
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) || [];
  for (const b of blocks) {
    const isAtom = /^<entry/i.test(b);
    let title = strip(tag(b, 'title'));
    let link = isAtom ? (attr(b, 'link', 'href') || strip(tag(b, 'link'))) : strip(tag(b, 'link'));
    const date = strip(tag(b, 'pubDate') || tag(b, 'published') || tag(b, 'updated') || tag(b, 'dc:date'));
    const summary = strip(tag(b, 'description') || tag(b, 'summary') || tag(b, 'content:encoded') || tag(b, 'content')).slice(0, 400);
    let publisher = strip(tag(b, 'source')) || src.name;
    const publisherUrl = attr(b, 'source', 'url');
    if (src.id.startsWith('gn-') && publisher && title.endsWith(' - ' + publisher)) title = title.slice(0, -(publisher.length + 3));
    if (!title || !link) continue;
    out.push({ title, link, publisher, publisherUrl, published: date ? new Date(date).toISOString() : null, summary, lang: src.lang, source: src.id });
  }
  return out;
}

async function fetchText(url) {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' }, signal: ctl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.text();
  } finally { clearTimeout(t); }
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

async function main() {
  const now = Date.now(), since = now - WINDOW_HOURS * 3600e3;
  const health = [], all = [];
  for (const src of sources) {
    try {
      const xml = await fetchText(src.url);
      const items = parse(xml, src);
      let kept = 0;
      for (const it of items) {
        const t = it.published ? Date.parse(it.published) : NaN;
        if (Number.isFinite(t) && t < since) continue;
        const text = it.title + ' ' + it.summary;
        const hits = (text.match(AGRI) || []).length;
        if (src.filter && hits === 0) continue;
        if (SOCIAL.test(it.publisher + ' ' + it.publisherUrl + ' ' + it.link)) continue;
        if (kept >= MAX_PER_SOURCE) break;
        it.kind = src.kind || 'news';
        it.regions = REGIONS.filter(([, re]) => re.test(text)).map(([k]) => k);
        it.score = hits + (it.regions.includes('CM') ? 4 : 0) + (it.regions.includes('RW') || it.regions.includes('KE') ? 3 : 0) + (it.regions.includes('CEMAC') ? 2 : 0) + (it.regions.length ? 1 : 0);
        all.push(it); kept++;
      }
      health.push({ id: src.id, name: src.name, ok: true, found: items.length, kept });
    } catch (e) {
      health.push({ id: src.id, name: src.name, ok: false, error: String(e && e.message || e).slice(0, 120) });
    }
  }
  // Actualités et opportunités (appels d'offres, appels à projets) sont plafonnées séparément.
  const seen = new Set(), items = [], cap = { news: MAX_ITEMS, opportunity: 30 }, n = { news: 0, opportunity: 0 };
  for (const it of all.sort((a, b) => b.score - a.score || String(b.published).localeCompare(String(a.published)))) {
    const key = norm(it.title).slice(0, 90);
    if (seen.has(key) || n[it.kind] >= cap[it.kind]) continue;
    seen.add(key); items.push(it); n[it.kind]++;
  }
  const day = new Date(now).toISOString().slice(0, 10);
  const doc = { date: day, generatedAt: new Date(now).toISOString(), windowHours: WINDOW_HOURS, sources: health, count: items.length, opportunities: n.opportunity, items };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, day + '.json'), JSON.stringify(doc, null, 1));
  fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(doc, null, 1));
  const bad = health.filter((h) => !h.ok);
  console.log(`${day}: ${items.length} articles retenus, ${health.length - bad.length}/${health.length} sources lisibles`);
  for (const h of health) console.log((h.ok ? 'ok  ' : 'ERR ') + h.id + (h.ok ? ` ${h.kept}/${h.found}` : ' ' + h.error));
}
main().catch((e) => { console.error(e); process.exit(1); });
