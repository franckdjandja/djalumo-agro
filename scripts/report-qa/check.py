# Report quality check, step 2: reads every PDF built by gen.mjs and fails if a visitor could see a defect:
# a report that does not build, a page that is not A4, text outside the margins or over other text,
# cover text running into the green band, an empty or broken value, or a character missing from the font.
# Words of the other language are listed for information only (names and places typed by visitors).
import json, re, subprocess, html, sys, os, tempfile
DIR = os.environ.get('QA_DIR') or os.path.join(tempfile.gettempdir(), 'djalumo-report-qa')
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
from collections import defaultdict, Counter
from fontTools.ttLib import TTFont
cmap = set()
for f in ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']:
    cm = TTFont(os.path.join(ROOT, 'lib/report/fonts/Manrope-%s.ttf' % f)).getBestCmap()
    cmap = set(cm) if not cmap else cmap & set(cm)
cases = json.load(open(os.path.join(DIR, 'cases.json')))
EN_WORDS = re.compile(r"\b(the|and|with|harvest|harvests|yield|weeks|months|costs?|price|prices|water|labour|seedlings|plot|planting|season|outcome|outcomes|failure|average|good|poor|margin|return)\b")
FR_WORDS = re.compile(r"\b(le|la|les|des|du|une|récolte|récoltes|semaines|mois|coûts?|prix|eau|main-d’œuvre|parcelle|saison|issue|issues|échec|moyenne|marge)\b")
BAD = re.compile(r"undefined|NaN|\bnull\b|Infinity|\[object|\{\{|\}\}|TODO|\$\{")
issues = defaultdict(list); info = defaultdict(list); fontmiss = Counter()
for c in cases:
    cid = c['id']
    if c.get('error'): issues[cid].append('ERROR ' + c['error'][:200]); continue
    out = subprocess.run(['pdftotext', '-bbox', os.path.join(DIR, 'pdf', '%s.pdf' % cid), '-'], capture_output=True, text=True).stdout
    pages = re.findall(r'<page width="([\d.]+)" height="([\d.]+)">(.*?)</page>', out, re.S)
    texts = []
    for pi, (W, H, body) in enumerate(pages, 1):
        W, H = float(W), float(H)
        if abs(W - 595.28) > 1 or abs(H - 841.89) > 1: issues[cid].append('page %d not A4 (%sx%s)' % (pi, W, H))
        words = [(float(a), float(b), float(c2), float(d), html.unescape(t)) for a, b, c2, d, t in re.findall(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">(.*?)</word>', body)]
        texts.append(' '.join(w[4] for w in words))
        for (x0, y0, x1, y1, t) in words:
            if x1 > W - 30 or x0 < 28 or y1 > H - 22 or y0 < 18: issues[cid].append('p%d out of margin: %r at x %.0f-%.0f y %.0f-%.0f' % (pi, t, x0, x1, y0, y1))
            for ch in t:
                if ord(ch) > 32 and ord(ch) not in cmap: fontmiss[ch] += 1
        # overlaps between words (bucket by y)
        ws = sorted(words, key=lambda w: w[1])
        for a in range(len(ws)):
            xa0, ya0, xa1, ya1, ta = ws[a]
            for b in range(a + 1, len(ws)):
                xb0, yb0, xb1, yb1, tb = ws[b]
                if yb0 >= ya1: break
                ix = min(xa1, xb1) - max(xa0, xb0); iy = min(ya1, yb1) - max(ya0, yb0)
                if ix > 0.8 and iy > 0.8:
                    small = min((xa1 - xa0) * (ya1 - ya0), (xb1 - xb0) * (yb1 - yb0))
                    if ix * iy > 0.2 * small: issues[cid].append('p%d overlap: %r / %r' % (pi, ta, tb))
        if pi == 1:
            for (x0, y0, x1, y1, t) in words:
                if y0 < 560 < y1 or 552 < y1 <= 560: issues[cid].append('cover text touches the band: %r y %.0f-%.0f' % (t, y0, y1))
        if pi < len(pages) and len(words) < 25: info[cid].append('p%d has only %d words' % (pi, len(words)))
    full = '\n'.join(texts)
    for m in set(BAD.findall(full)): issues[cid].append('bad token: ' + m)
    # language leakage before the sources section
    lang = c['lang']
    cut = None
    for pi, t in enumerate(texts):
        if re.search(r'Sources, (method and limits|méthode et limites)', t): cut = pi; break
    body = ' '.join(texts[:cut] if cut else texts)
    body = re.sub(r'https?://\S+', ' ', body)
    if lang == 'fr':
        hits = Counter(w.lower() for w in EN_WORDS.findall(body))
    else:
        hits = Counter(w.lower() for w in FR_WORDS.findall(body))
    hits = {k: v for k, v in hits.items() if v >= 1}
    if hits: info[cid].append('other-language words: ' + ', '.join('%s×%d' % kv for kv in sorted(hits.items(), key=lambda x: -x[1])[:12]))
print('cases', len(cases), '| with issues', len(issues))
for cid in sorted(issues):
    c = next(x for x in cases if x['id'] == cid)
    print('\n##', cid, c['lang'], c['tag'], c.get('pages'))
    for m in issues[cid][:8]: print('  ', m)
    if len(issues[cid]) > 8: print('   ... +%d' % (len(issues[cid]) - 8))
print('\nfont missing glyphs:', dict(fontmiss))
print('\n--- info ---')
for cid in sorted(info):
    c = next(x for x in cases if x['id'] == cid)
    print(cid, c['lang'], c['tag'], c.get('pages'), '|', ' ; '.join(info[cid])[:300])

if fontmiss: issues['font'].append('missing glyphs')
print('\nRESULT:', 'OK' if not issues else 'DEFECTS FOUND')
sys.exit(1 if issues else 0)
