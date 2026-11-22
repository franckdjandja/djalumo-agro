/* ---------- Insights: every publication of Djalumo Agro, kept as a dated article in English and French (INSIGHTS, built from site/data/insights.txt) ---------- */
const INS = typeof INSIGHTS !== 'undefined' ? INSIGHTS : [];
const insDate = (d) => new Intl.DateTimeFormat(LANG === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z'));
const insHref = (a) => '#insights/' + a.slug;
const insImg = (a, eager) => '<img src="' + IMG_BASE + 'insights/' + a.slug + '.webp" alt="' + esc(a.title[LANG]) + '" width="864" height="1080" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">';
const insMeta = (a) => '<p class="ins-meta"><span>' + esc(a.rubric[LANG]) + '</span><span aria-hidden="true"> · </span><time datetime="' + a.date + '">' + esc(insDate(a.date)) + '</time></p>';

function insCard(a) {
  return '<a class="ins-card" href="' + insHref(a) + '"><figure class="ins-thumb">' + insImg(a) + '</figure><div class="ins-body">' + insMeta(a) +
    '<h3>' + esc(a.title[LANG]) + '</h3><p>' + esc(a.summary[LANG]) + '</p><span class="glink">' + esc(L().insights.read) + ARROW + '</span></div></a>';
}

function insightHub() {
  const I = L().insights;
  return pageHero('', I.h1, I.lead) +
    sec('<div class="ins-grid rv">' + INS.map(insCard).join('') + '</div>' +
      '<p class="ins-follow rv"><a class="btn btn-ghost" href="https://www.linkedin.com/company/djalumo-agro/" target="_blank" rel="noopener">' + esc(I.linkedin) + ARROW + '</a></p>');
}

function insightPage(slug) {
  const I = L().insights, a = INS.find((x) => x.slug === slug);
  const crumbs = '<nav class="crumbs small" aria-label="' + esc(I.crumb) + '"><a href="#insights">' + esc(I.crumb) + '</a><span aria-hidden="true"> · </span><span aria-current="page">' + esc(a.rubric[LANG]) + '</span></nav>';
  const hero = '<section class="page-hero"><div class="wrap" style="position:relative">' + crumbs + '<h1 class="display ins-h1" tabindex="-1">' + esc(a.title[LANG]) + '</h1>' + insMeta(a).replace('ins-meta', 'ins-meta on-deep') + '</div></section>';
  const body = a.body[LANG].map((p, i) => '<p' + (i === 0 ? ' class="ins-lead"' : '') + '>' + esc(p) + '</p>').join('');
  const sources = a.sources.length ? '<div class="ins-src"><h2>' + esc(I.sources) + '</h2><ul>' + a.sources.map((s) => '<li>' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label[LANG]) + '</a>' : esc(s.label[LANG])) + '</li>').join('') + '</ul></div>' : '';
  const R = I.related[a.related] || I.related.home;
  const rel = '<a class="card gcard ins-rel" href="#' + a.related + '"><h3>' + esc(R[0]) + '</h3><p>' + esc(R[1]) + '</p><span class="glink">' + esc(L().cta.more) + ARROW + '</span></a>';
  const others = INS.filter((x) => x.slug !== slug).slice(0, 3);
  return hero +
    sec('<div class="ins-art"><article class="ins-text rv">' + body + sources + '</article><aside class="ins-aside rv"><figure class="ins-visual">' + insImg(a, true) + '</figure>' + rel +
      '<a class="btn btn-ghost btn-sm" href="https://www.linkedin.com/company/djalumo-agro/" target="_blank" rel="noopener">' + esc(I.linkedin) + ARROW + '</a></aside></div>') +
    (others.length ? sec(head('', I.more) + '<div class="ins-grid rv">' + others.map(insCard).join('') + '</div><p class="ins-follow rv"><a class="btn btn-ghost" href="#insights">' + esc(I.all) + ARROW + '</a></p>') : '');
}

function insightPages() {
  const pages = { insights: { html: insightHub } };
  INS.forEach((a) => { pages['insights/' + a.slug] = { html: () => insightPage(a.slug) }; });
  return pages;
}
