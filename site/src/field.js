/* ---------- Field evidence: 73 pilot photographs in 8 plates, with a viewer ---------- */
const FP = (id) => PHOTOS[id];
const fieldIds = (n) => Object.keys(PHOTOS).filter(id => PHOTOS[id].plate === n).sort((a, b) => (PHOTOS[a].panel ? 0 : 1) - (PHOTOS[b].panel ? 0 : 1) || a.localeCompare(b));
const fdate = (iso) => new Intl.DateTimeFormat(L().meta.locale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
function fieldCaption(id) {
  const F = L().field, p = FP(id), pl = F.plates[p.plate - 1];
  const text = p.panel ? pl.panels[p.panel] : F.archive[id];
  const when = p.date ? F.dated + ' ' + fdate(p.date) : pl.period;
  return { text, plate: F.plate + ' ' + p.plate + (p.panel ? ' · ' + p.panel : ''), stage: pl.stage + ' · ' + pl.period + ' · ' + pl.site, when, dateKnown: !!p.date, title: pl.title };
}
const fimg = (id, alt, big, eager) => { const p = FP(id); return '<img src="img/field/' + id + (big ? '' : '-s') + '.webp" width="' + (big ? p.w : p.sw) + '" height="' + (big ? p.h : p.sh) + '" alt="' + esc(alt) + '" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async" style="background:' + p.c + '">'; };

/* Home: phase strip and the eight plate cards */
function fieldHomeHTML() {
  const F = L().field, C = L().cta;
  const lv = (i) => (i === 4 ? 'var(--crit)' : i === 0 ? 'var(--green)' : 'var(--warn)');
  const strip = '<div class="fe-strip rv">' + F.timeline.map(([k, per, t, site, res], i) => '<div><span class="k">' + esc(k) + ' · ' + esc(per) + '</span><h4>' + esc(t) + '</h4><p>' + esc(site) + '</p>' + (res ? '<div class="r"><i style="background:' + lv(i) + '"></i>' + esc(res) + '</div>' : '') + '</div>').join('') + '</div>';
  const cards = '<div class="plates">' + F.plates.map((pl, i) => {
    const n = i + 1, ids = fieldIds(n);
    return '<a class="pcard rv" href="#field" data-plate="' + n + '"><div class="im">' + fimg(pl.cover, pl.cap + ' ' + pl.panels[FP(pl.cover).panel]) +
      '<div class="tag"><span class="ph">' + esc(F.plate + ' ' + n) + '</span><span>' + esc(pl.stage) + '</span></div><span class="cnt">' + esc(F.photosN(ids.length)) + '</span></div>' +
      '<div class="tx"><h3>' + esc(pl.title) + '</h3><p>' + esc(pl.panels[FP(pl.cover).panel]) + '</p><span class="per">' + esc(pl.period + ' · ' + pl.site) + '</span></div></a>';
  }).join('') + '</div>';
  return head(F.homeEyebrow, F.homeH, F.homeLead) + strip + cards +
    '<div class="fe-foot"><p>' + esc(F.register) + '</p><a class="btn btn-primary" href="#field" data-cta="home_field">' + esc(C.fieldAll) + ARROW + '</a></div>';
}
function fieldHomeMount(root) {
  $$('[data-plate]', root).forEach(a => a.addEventListener('click', e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
    e.preventDefault(); e.stopPropagation(); analytics.track('cta_click', { cta: 'plate_' + a.dataset.plate }); Router.go('field', 'plate-' + a.dataset.plate);
  }));
}

/* Field page */
function fieldPageHTML() {
  const F = L().field, P = L().planner;
  const hero = '<section class="page-hero"><div class="grid-bg" aria-hidden="true"></div><div class="wrap" style="position:relative">' + ey(F.eyebrow) + '<h1 class="display" tabindex="-1">' + esc(F.h1) + '</h1><p class="lead">' + esc(F.lead) + '</p>' +
    '<div class="counts">' + F.counts.map(([v, l]) => '<div><b>' + esc(v) + '</b><span>' + esc(l) + '</span></div>').join('') + '</div></div></section>';
  const nav = '<nav class="fnav" aria-label="' + esc(F.plate) + '"><div class="wrap">' + F.plates.map((pl, i) => '<a href="#plate-' + (i + 1) + '" data-fnav="' + (i + 1) + '"><b>' + (i + 1) + '</b>' + esc(pl.title) + '</a>').join('') + '</div></nav>';
  const plates = F.plates.map((pl, i) => {
    const n = i + 1, ids = fieldIds(n), main = ids.filter(id => FP(id).panel), more = ids.filter(id => !FP(id).panel);
    const meta = '<div class="meta"><span class="badge plan">' + esc(F.plate + ' ' + n) + '</span><span class="badge">' + esc(pl.stage) + '</span><span class="badge">' + esc(pl.period) + '</span></div>';
    const learn = '<div class="learn"><div><span class="k">' + esc(F.readL) + '</span><p>' + esc(pl.read) + '</p></div>' +
      (pl.lesson ? '<div><span class="k">' + esc(F.probL) + '</span><p><b>' + esc(pl.lesson[0]) + '.</b> ' + esc(pl.lesson[1]) + '.</p></div><div><span class="k">' + esc(F.reqL) + '</span><p>' + esc(pl.lesson[2]) + '.</p></div>' : '') +
      (pl.now ? '<div class="now"><span class="k">' + esc(F.nowL) + '</span><p>' + esc(pl.now) + '</p></div>' : '') +
      (pl.result ? '<div class="res"><span class="k" style="margin:0">' + esc(F.resultL) + '</span><span class="badge ' + (pl.resLv === 'bad' ? 'bad' : 'demo') + '">' + esc(pl.result) + '</span></div>' : '') + '</div>';
    const figs = '<div class="panels' + (main.length === 2 ? ' n2' : '') + '">' + main.map(id => {
      const c = fieldCaption(id), p = FP(id);
      return '<figure class="pfig"><button type="button" data-lb="' + id + '" aria-label="' + esc(F.open + ': ' + c.plate + '. ' + c.text) + '">' + fimg(id, c.text + ' ' + pl.cap) + '<span class="ltr" aria-hidden="true">' + p.panel + '</span><span class="zoom" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M5.5 1.5h-4v4M8.5 12.5h4v-4M1.5 1.5 6 6M12.5 12.5 8 8" fill="none" stroke="#fff" stroke-width="1.5"/></svg></span></button>' +
        '<figcaption><b>' + p.panel + '.</b>' + esc(c.text) + '<span>' + esc(c.when) + '</span></figcaption></figure>';
    }).join('') + '</div>';
    const arch = more.length ? '<div class="archive"><h3>' + esc(F.archiveH(more.length)) + '</h3><div class="agrid">' + more.map(id => {
      const c = fieldCaption(id);
      return '<figure class="afig"><button type="button" data-lb="' + id + '" aria-label="' + esc(F.open + ': ' + c.text) + '">' + fimg(id, c.text) + '</button><figcaption>' + esc(c.text) + '<span>' + esc(c.dateKnown ? c.when : F.noDate) + '</span></figcaption></figure>';
    }).join('') + '</div></div>' : '';
    return '<section class="plate" id="plate-' + n + '" data-plate-sec="' + n + '"><div class="wrap"><div class="plate-head"><div>' + meta + '<h2>' + esc(pl.title) + '</h2><p class="cap"><b>' + esc(pl.cap) + '</b> ' + esc(pl.site) + '.</p></div>' + learn + '</div>' + figs + arch + '</div></section>';
  }).join('');
  const close = sec('<div class="cta-band rv"><div><h2 class="h2" style="max-width:22ch">' + esc(F.ctaH) + '</h2><p class="lead" style="margin-top:16px">' + esc(F.ctaLead) + '</p><p class="register">' + esc(F.register) + '</p></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary" href="#planner">' + esc(P.title) + ARROW + '</a><a class="btn btn-ghost" href="#impact">' + esc(L().nav.impact) + '</a></div></div>');
  return hero + nav + plates + close;
}
function fieldPageMount(root) {
  const order = []; for (let n = 1; n <= 8; n++) order.push(...fieldIds(n));
  $$('[data-lb]', root).forEach(b => b.addEventListener('click', () => lightbox(order, order.indexOf(b.dataset.lb), b)));
  $$('[data-fnav]', root).forEach(a => a.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); const t = D.getElementById('plate-' + a.dataset.fnav); if (t) t.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); }));
  const links = $$('[data-fnav]', root);
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const n = e.target.dataset.plateSec; links.forEach(l => l.classList.toggle('on', l.dataset.fnav === n)); const on = links.find(l => l.dataset.fnav === n); if (on && on.parentNode.scrollTo) on.parentNode.scrollTo({ left: on.offsetLeft - 16, behavior: 'smooth' }); } }), { rootMargin: '-45% 0px -50% 0px' });
  $$('[data-plate-sec]', root).forEach(s => io.observe(s));
  return () => io.disconnect();
}

/* Viewer: keyboard (arrows, Escape), swipe, focus kept inside, focus restored on close */
function lightbox(list, i, opener) {
  const F = L().field;
  const box = D.createElement('div');
  box.className = 'lb'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', F.viewer);
  box.innerHTML = '<div class="lb-top"><span class="mono" data-lb-n></span><button type="button" class="lb-btn" data-lb-x aria-label="' + esc(F.close) + '">×</button></div>' +
    '<div class="lb-mid"><button type="button" class="lb-btn lb-prev" data-lb-p aria-label="' + esc(F.prev) + '">‹</button><div class="lb-img" data-lb-img></div><button type="button" class="lb-btn lb-next" data-lb-nx aria-label="' + esc(F.next) + '">›</button></div>' +
    '<div class="lb-cap" aria-live="polite" data-lb-cap></div>';
  D.body.appendChild(box); D.body.style.overflow = 'hidden';
  const show = (k) => {
    i = (k + list.length) % list.length; const id = list[i], c = fieldCaption(id);
    $('[data-lb-img]', box).innerHTML = fimg(id, c.text, true, true);
    $('[data-lb-n]', box).textContent = (i + 1) + ' ' + F.of + ' ' + list.length;
    $('[data-lb-cap]', box).innerHTML = '<div class="k">' + esc(c.plate + ' · ' + c.title) + '</div><p>' + esc(c.text) + '</p><small>' + esc(c.stage) + (c.dateKnown ? ' · ' + esc(c.when) : '') + '</small>';
    [list[i + 1], list[i - 1]].forEach(n => { if (n) { const im = new Image(); im.src = 'img/field/' + n + '.webp'; } });
    analytics.track('photo_view', { id });
  };
  const close = () => { D.removeEventListener('keydown', key); box.remove(); D.body.style.overflow = ''; if (opener && opener.focus) opener.focus(); };
  const key = (e) => {
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowRight') show(i + 1); else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'Tab') { const f = $$('button', box); const a = f[0], z = f[f.length - 1]; if (e.shiftKey && D.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && D.activeElement === z) { e.preventDefault(); a.focus(); } }
  };
  D.addEventListener('keydown', key);
  $('[data-lb-x]', box).addEventListener('click', close);
  $('[data-lb-p]', box).addEventListener('click', () => show(i - 1));
  $('[data-lb-nx]', box).addEventListener('click', () => show(i + 1));
  box.addEventListener('click', e => { if (e.target === box || e.target.matches('[data-lb-img]')) close(); });
  let sx = null;
  box.addEventListener('pointerdown', e => { sx = e.clientX; });
  box.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); });
  show(i);
  $('[data-lb-x]', box).focus();
  return close;
}
