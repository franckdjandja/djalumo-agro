/* ---------- World corridor map: from the Foumbot production zone to African and world markets ----------
   Land is a dot grid (Natural Earth 1:110m); dots are zero length strokes, so they keep their size at any zoom.
   Routes: [key, group, status, destination]. 'today' = documented flows, 'target' = AfriFarm export target. */
const WM_R = [
  ['dla', 'cm', 'today', 'douala'], ['yde', 'cm', 'today', 'yaounde'], ['kri', 'cm', 'today', 'kribi'],
  ['gab', 'cemac', 'today', 'libreville'], ['gnq', 'cemac', 'today', 'bata'], ['tcd', 'cemac', 'today', 'ndjamena'], ['caf', 'cemac', 'today', 'bangui'],
  ['lagos', 'africa', 'target', 'lagos'], ['abidjan', 'africa', 'target', 'abidjan'], ['mombasa', 'africa', 'target', 'mombasa'], ['eaf', 'africa', 'target', 'kigali'],
  ['rotterdam', 'europe', 'target', 'rotterdam'], ['marseille', 'europe', 'target', 'marseille'],
  ['jebelali', 'gulf', 'target', 'jebelali'], ['shanghai', 'china', 'target', 'shanghai'], ['newyork', 'usa', 'target', 'newyork'], ['santos', 'latam', 'target', 'santos']
];
const WM_G = ['cm', 'cemac', 'africa', 'europe', 'gulf', 'china', 'usa', 'latam'];
const WM_FEED = { cemac: ['yde'], africa: ['dla'], europe: ['dla'], gulf: ['dla'], china: ['dla'], usa: ['dla'], latam: ['dla'] };
// node kind (z zone, p port, m market, c city), label level (0 always, higher = shown when zoomed in) and label placement [dx, dy, anchor] in px
const WM_N = {
  foumbot: ['z', 0, [10, -9, 'start']], douala: ['p', 0, [-6, 17, 'end']], kribi: ['p', 2, [-10, 12, 'end']], yaounde: ['c', 2, [9, 12, 'start']],
  kyeossi: ['c', 3, [9, 4, 'start']], libreville: ['m', 2, [-9, 4, 'end']], bata: ['m', 3, [-9, 4, 'end']], ndjamena: ['m', 2, [9, 4, 'start']], bangui: ['m', 2, [9, 4, 'start']],
  lagos: ['m', 1, [0, -10, 'middle']], abidjan: ['m', 1, [-9, 4, 'end']], mombasa: ['m', 1, [9, 8, 'start']], nairobi: ['c', 2, [6, -9, 'start']], kigali: ['m', 1, [-9, 4, 'end']],
  rotterdam: ['m', 0, [9, 0, 'start']], marseille: ['m', 1, [9, 6, 'start']], jebelali: ['m', 0, [9, 4, 'start']], shanghai: ['m', 0, [9, 4, 'start']],
  newyork: ['m', 0, [8, -9, 'start']], santos: ['m', 0, [-9, 10, 'end']]
};
const wmGroupOf = (k) => { const r = WM_R.find(x => x[3] === k); return r ? r[1] : k === 'nairobi' ? 'africa' : k === 'kyeossi' ? 'cemac' : 'cm'; };
const WMS = { group: 'all' };
const SEA_KMH = 14 * 1.852;

function worldHeroHTML() {
  const Wd = L().world, H = L().home, C = L().cta, S = L().sim;
  const cur = PL_CUR.map(c => '<option' + (PLAN.currency === c ? ' selected' : '') + '>' + c + '</option>').join('');
  const top = '<div class="wh-h"><h1 class="display" tabindex="-1">' + esc(Wd.h1) + '</h1>' + '<div class="hero-links"><a href="#planner" data-cta="hero_plan">' + esc(C.plan) + ' ›</a><a href="#field" data-cta="hero_field">' + esc(C.field) + ' ›</a></div>' + '</div>' +
    '<div class="wh-l"><p class="lead">' + esc(Wd.lead) + '</p>' +
    '<form class="try" data-try novalidate><label for="try-amt">' + esc(H.tryLabel) + '</label><div class="try-row"><div class="field"><input id="try-amt" class="tnum" inputmode="decimal" autocomplete="off" value="' + esc(nf(PLAN.capital)) + '" aria-label="' + esc(H.tryAria) + '"><select aria-label="' + esc(S.currency) + '" data-try-cur>' + cur + '</select></div><button class="btn btn-green" type="submit">' + esc(C.simulate) + ARROW + '</button></div></form>' +
    '<p class="try-note">' + esc(H.tryNote) + '</p></div>';
  const groups = '<button type="button" class="wm-g" data-g="all" aria-pressed="' + (WMS.group === 'all') + '"><i class="all"></i><span><b>' + esc(Wd.all) + '</b><small>' + esc(Wd.allD) + '</small></span><em></em></button>' +
    WM_G.map(g => { const st = WM_R.find(r => r[1] === g)[2]; return '<button type="button" class="wm-g" data-g="' + g + '" aria-pressed="' + (WMS.group === g) + '"><i class="' + st + '"></i><span><b>' + esc(Wd.groups[g][0]) + '</b><small>' + esc(Wd.groups[g][1]) + '</small></span><em>' + esc(Wd.status[st]) + '</em></button>'; }).join('');
  const map = '<div class="wm wh-map rv" data-wm><div class="wm-main"><div class="wm-stage" data-wm-stage><div class="wm-top"><span class="fx-k">' + esc(Wd.mapTitle) + '</span></div>' +
    '<div class="map-ctrl"><button type="button" data-z="in" aria-label="' + esc(Wd.zoomIn) + '">+</button><button type="button" data-z="out" aria-label="' + esc(Wd.zoomOut) + '">−</button><button type="button" data-z="reset" aria-label="' + esc(Wd.reset) + '"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5V2h3M12 9v3H9M9 2h3v3M5 12H2V9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button></div>' +
    '<div class="wm-legend" aria-hidden="true"><span><i class="lz"></i>' + esc(Wd.legend.zone) + '</span><span><i class="lp"></i>' + esc(Wd.legend.port) + '</span><span><i class="lt"></i>' + esc(Wd.legend.today) + '</span><span><i class="lx"></i>' + esc(Wd.legend.target) + '</span></div></div>' +
    '<aside class="wm-side"><div class="wm-side-h"><h3>' + esc(Wd.sideH) + '</h3><p>' + esc(Wd.sideP) + '</p></div><div class="wm-groups" role="group" aria-label="' + esc(Wd.sideH) + '">' + groups + '</div></aside></div>' +
    '<div class="wm-foot"><div class="wm-inset" data-wm-inset><h5>' + esc(Wd.insetH) + '</h5></div><div class="wm-detcol"><div class="wm-det" aria-live="polite" data-wm-det></div><p class="wm-note">' + esc(Wd.honest) + '</p></div></div></div>';
  const facts = '<div class="facts wh-f rv">' + Wd.facts.map(([v, u, l, s, url]) => '<div class="fact"><div class="v">' + esc(v) + '<small>' + esc(u) + '</small></div><p>' + esc(l) + '</p><a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(s) + ' ↗</a></div>').join('') + '</div>';
  return '<section class="whero"><div class="wrap whero-grid">' + top + map + facts + '</div></section>';
}

function worldDetHTML(g) {
  const Wd = L().world;
  if (g === 'all') return '<h4>' + esc(Wd.det.all[0]) + '</h4><p>' + esc(Wd.det.all[1]) + '</p><p class="wm-src">' + esc(Wd.hint) + '</p>';
  const rs = WM_R.filter(r => r[1] === g), st = rs[0][2];
  const rows = rs.map(([k, , , dest]) => {
    const R = GEOW.routes[k];
    const v = R.mode === 'sea' ? nf(R.km) + ' km · ' + Wd.days(nf(R.km / SEA_KMH / 24, 0)) : Wd.road;
    return '<div><dt>' + esc(Wd.places[dest][0]) + ' <span class="faint small">' + esc(Wd.places[dest][1]) + '</span></dt><dd>' + esc(v) + '</dd></div>';
  }).join('');
  const src = (Wd.srcs[g] || []).map(([t, u]) => '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(t) + ' ↗</a>').join('<br>');
  const sea = rs.some(r => GEOW.routes[r[0]].mode === 'sea');
  return '<div><span class="badge ' + (st === 'today' ? 'real' : 'plan') + '">' + esc(Wd.status[st]) + '</span></div><h4>' + esc(Wd.det[g][0]) + '</h4><p>' + esc(Wd.det[g][1]) + '</p>' +
    '<dl class="wm-dl">' + rows + '</dl>' + (sea ? '<p class="wm-src">' + esc(Wd.noteSea) + '</p>' : '') + (src ? '<p class="wm-src"><b>' + esc(Wd.srcL) + '</b><br>' + src + '</p>' : '');
}

function worldMount(root) {
  const G = GEOW, Wd = L().world, NS = 'http://www.w3.org/2000/svg';
  const stage = $('[data-wm-stage]', root), det = $('[data-wm-det]', root), insetBox = $('[data-wm-inset]', root);
  // static layers
  const dotD = k => G.dots.filter(d => d[2] === k).map(d => 'M' + d[0] + ' ' + d[1] + 'h0').join('');
  const routes = WM_R.map(([k, g, st]) => '<path class="rt ' + st + '" data-r="' + k + '" data-g="' + g + '" d="' + G.routes[k].d + '"/>').join('');
  const hits = WM_R.map(([k, g]) => '<path class="hit" data-r="' + k + '" data-g="' + g + '" d="' + G.routes[k].d + '"/>').join('');
  const nodes = Object.keys(WM_N).map(k => {
    const [x, y] = G.pts[k], kind = WM_N[k][0], g = wmGroupOf(k), st = (WM_R.find(r => r[3] === k) || [0, 0, 'today'])[2];
    let mk;
    if (kind === 'z') mk = '<circle class="ring" cx="' + x + '" cy="' + y + '" fill="none" stroke="#17794D" stroke-width="1.4" vector-effect="non-scaling-stroke"/><circle class="ring" cx="' + x + '" cy="' + y + '" fill="none" stroke="#17794D" stroke-width="1.4" vector-effect="non-scaling-stroke"/><circle class="mk dot z" data-px="6" cx="' + x + '" cy="' + y + '" fill="#17794D" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>';
    else if (kind === 'p') mk = '<rect class="mk sq" data-px="5" data-cx="' + x + '" data-cy="' + y + '" x="' + x + '" y="' + y + '" fill="#0B2E59" stroke="#fff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>';
    else mk = '<circle class="mk dot ' + (kind === 'c' ? 'c' : 'm ' + st) + '" data-px="' + (kind === 'c' ? 3.2 : 4.4) + '" cx="' + x + '" cy="' + y + '" fill="#fff" stroke="' + (st === 'today' ? '#17794D' : '#1F5FAD') + '" stroke-width="2" vector-effect="non-scaling-stroke"/>';
    return '<g class="pt" data-n="' + k + '" data-g="' + g + '" tabindex="0" role="button" aria-label="' + esc(Wd.places[k][0] + ', ' + Wd.places[k][1]) + '">' + mk + '<text class="lbl' + (kind === 'c' ? ' sm' : '') + '" data-l="' + k + '" x="' + x + '" y="' + y + '">' + esc(Wd.places[k][0]) + '</text></g>';
  }).join('');
  stage.insertAdjacentHTML('afterbegin', '<svg class="wm-svg" viewBox="0 0 ' + G.W + ' ' + G.H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="' + esc(Wd.mapAria) + '">' +
    '<path class="sph" d="' + G.sphere + '"/><path class="grat" d="' + G.grat + '"/><path class="lnd" d="' + G.land + '" opacity="0"/>' +
    '<path class="dk0" d="' + dotD(0) + '" stroke="#BFCBDA" stroke-linecap="round" stroke-width="2.6" vector-effect="non-scaling-stroke" fill="none"/>' +
    '<path class="dk1" d="' + dotD(1) + '" stroke="#8FA9C6" stroke-linecap="round" stroke-width="2.8" vector-effect="non-scaling-stroke" fill="none"/>' +
    '<path class="afo" d="' + G.af + '" fill="none" stroke="#B9C7D7" stroke-width=".8" vector-effect="non-scaling-stroke" opacity="0"/>' +
    '<path class="cmo" d="' + G.cm + '"/>' +
    '<path class="dk2" d="' + dotD(2) + '" stroke="#17794D" stroke-linecap="round" stroke-width="3" vector-effect="non-scaling-stroke" fill="none"/>' +
    '<g data-routes>' + routes + '</g><g data-parts></g><g data-hits>' + hits + '</g><g data-nodes>' + nodes + '</g></svg>');
  const svg = $('svg.wm-svg', stage), T = tip(stage);
  const parts = $('[data-parts]', svg), afo = $('.afo', svg), lnd = $('.lnd', svg), rings = $$('.ring', svg);

  // inset: Cameroon, field to port
  const I = G.inset;
  const iRoutes = Object.entries(I.routes).map(([k, d]) => { const r = WM_R.find(x => x[0] === k); const g = r ? r[1] : 'sea'; return '<path class="rt ' + (k.startsWith('sea') ? 'target' : 'today') + '" data-r="' + k + '" data-g="' + g + '" d="' + d + '" style="stroke-width:' + (k.startsWith('sea') ? 2 : 2.6) + '"/>'; }).join('');
  const iLbl = { foumbot: [10, -8, 'start'], douala: [-10, 5, 'end'], kribi: [-10, 6, 'end'], yaounde: [10, 6, 'start'], kyeossi: [10, 14, 'start'], libreville: [10, 6, 'start'], bata: [-10, 5, 'end'], ndjamena: [-10, 5, 'end'], bangui: [-10, -10, 'end'], penja: [-10, -6, 'end'] };
  const iPts = Object.entries(I.pts).map(([k, [x, y]]) => {
    const kind = (WM_N[k] || ['c'])[0], [dx, dy, a] = iLbl[k];
    const mk = kind === 'z' ? '<circle class="iz" cx="' + x + '" cy="' + y + '" r="9" stroke-width="3"/>' : kind === 'p' ? '<rect class="ip" x="' + (x - 7) + '" y="' + (y - 7) + '" width="14" height="14" transform="rotate(45 ' + x + ' ' + y + ')" stroke-width="2.5"/>' : k === 'penja' ? '<circle class="ib" cx="' + x + '" cy="' + y + '" r="6" stroke-width="2.5"/>' : '<circle class="ic" cx="' + x + '" cy="' + y + '" r="7" stroke-width="3"/>';
    return '<g class="pt" data-g="' + (k === 'penja' ? 'europe' : wmGroupOf(k)) + '">' + mk + '<text x="' + (x + dx) + '" y="' + (y + dy) + '" text-anchor="' + a + '" font-size="' + (kind === 'z' ? 23 : 20) + '" font-weight="' + (kind === 'z' || kind === 'p' ? 700 : 600) + '" fill="#0B2E59" paint-order="stroke" stroke="#fff" stroke-width="6" stroke-linejoin="round" >' + esc(Wd.places[k][0]) + '</text></g>';
  }).join('');
  insetBox.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 ' + I.W + ' ' + I.H + '" role="img" aria-label="' + esc(Wd.insetAria) + '"><rect class="sea" width="' + I.W + '" height="' + I.H + '"/>' +
    I.countries.map(c => '<path class="ct' + (c.id === '120' ? ' cm' : '') + '" d="' + c.d + '" stroke-width="' + (c.id === '120' ? 2 : 1.2) + '"/>').join('') +
    '<g class="wm-svg">' + iRoutes + '</g><g data-iparts></g>' + iPts + '</svg>');
  const isvg = $('svg', insetBox), iparts = $('[data-iparts]', isvg);

  // view box management
  let vb = { x: 0, y: 0, w: G.W, h: G.H }, anim = 0;
  const aspect = () => { const r = stage.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r.width / r.height : 2; };
  const scaleK = () => (stage.getBoundingClientRect().width || 900) / vb.w; // px per unit
  let full = null;
  function homeView() {
    const a = aspect();
    if (!full) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; $$('path.rt', svg).forEach(p => { const b = p.getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); }); full = { x0: x0 - 70, y0: y0 - 70, x1: x1 + 110, y1: y1 + 60 }; }
    if (a < 1.25) { const h = G.H * 0.9, w = h * a, cx = G.pts.douala[0] - 30; return { x: clamp(cx - w / 2, 0, G.W - w), y: (G.H - h) / 2 + 10, w, h }; }
    let w = full.x1 - full.x0, h = full.y1 - full.y0;
    if (w / h < a) w = h * a; else h = w / a;
    return { x: (full.x0 + full.x1) / 2 - w / 2, y: (full.y0 + full.y1) / 2 - h / 2, w, h };
  }
  function constrain(v) {
    const a = aspect(), w = clamp(v.w, 150, G.W * 1.3), h = w / a;
    return { w, h, x: clamp(v.x, -w * 0.25, G.W - w * 0.75), y: clamp(v.y, -h * 0.25, G.H - h * 0.75) };
  }
  function applyVB() {
    svg.setAttribute('viewBox', vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + vb.w.toFixed(1) + ' ' + vb.h.toFixed(1));
    const k = scaleK(), z = G.W / vb.w;
    $$('.mk', svg).forEach(m => {
      const px = +m.dataset.px / k;
      if (m.tagName === 'rect') { const cx = +m.dataset.cx, cy = +m.dataset.cy; m.setAttribute('x', cx - px); m.setAttribute('y', cy - px); m.setAttribute('width', 2 * px); m.setAttribute('height', 2 * px); m.setAttribute('transform', 'rotate(45 ' + cx + ' ' + cy + ')'); }
      else m.setAttribute('r', px);
    });
    const lv = z >= 6 ? 3 : z >= 3.4 ? 2 : z >= 1.7 ? 1 : 0;
    $$('.pt', svg).forEach(p => { p.style.display = WM_N[p.dataset.n][1] <= lv + 1 ? '' : 'none'; });
    $$('.lbl', svg).forEach(t => {
      const n = t.dataset.l, [x, y] = G.pts[n], [dx, dy, a] = WM_N[n][2];
      const show = WM_N[n][1] <= lv; t.style.display = show ? '' : 'none'; if (!show) return;
      t.setAttribute('x', x + dx / k); t.setAttribute('y', y + dy / k); t.setAttribute('text-anchor', a);
      t.setAttribute('font-size', ((WM_N[n][0] === 'z' || WM_N[n][0] === 'p') ? 13.5 : 12.5) / k); t.setAttribute('stroke-width', 4 / k);
      if (n === 'douala') t.textContent = lv < 2 ? Wd.places.douala[0] + ' · ' + Wd.places.kribi[0] : Wd.places.douala[0];
    });
    afo.setAttribute('opacity', clamp((z - 1.6) / 1.4, 0, 1).toFixed(2)); lnd.setAttribute('opacity', clamp((z - 1.3) / 1.2, 0, 1).toFixed(2));
    if (RM.matches) rings.forEach((r, i) => { r.setAttribute('r', ((10 + i * 8) / k).toFixed(2)); r.setAttribute('opacity', '.35'); });
  }
  function goTo(t, instant) {
    t = constrain(t); cancelAnimationFrame(anim);
    if (instant || RM.matches) { vb = t; applyVB(); return; }
    const from = Object.assign({}, vb), t0 = performance.now(), dur = 650;
    const step = now => { const u = clamp((now - t0) / dur, 0, 1), e = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; vb = { x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e, w: from.w + (t.w - from.w) * e, h: from.h + (t.h - from.h) * e }; applyVB(); if (u < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function fitGroup(g) {
    if (g === 'all') return goTo(homeView());
    const keys = WM_R.filter(r => r[1] === g).map(r => r[0]).concat(WM_FEED[g] || []);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    keys.forEach(k => { const b = $('path.rt[data-r="' + k + '"]', svg).getBBox(); x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height); });
    const a = aspect(), pad = 0.18, bw = (x1 - x0) * (1 + 2 * pad), bh = (y1 - y0) * (1 + 2 * pad);
    let w = Math.max(bw, bh * a, 300); const h = w / a;
    goTo({ x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h });
  }
  function paint() {
    const g = WMS.group, on = k => g !== 'all' && (WM_R.find(r => r[0] === k)[1] === g || (WM_FEED[g] || []).includes(k));
    $$('path.rt', svg).forEach(p => { const k = p.dataset.r; p.classList.toggle('on', on(k)); p.classList.toggle('dim', g !== 'all' && !on(k)); });
    $$('.pt', svg).forEach(p => { const n = p.dataset.n, ng = p.dataset.g; const keep = g === 'all' || ng === g || n === 'foumbot' || n === 'douala' || n === 'kribi' || (g === 'cemac' && n === 'yaounde'); p.classList.toggle('dim', !keep); });
    $$('path.rt', isvg).forEach(p => { const k = p.dataset.r; const r = WM_R.find(x => x[0] === k); const inG = r ? (r[1] === g || (WM_FEED[g] || []).includes(k)) : g !== 'cm' && g !== 'cemac'; p.classList.toggle('dim', g !== 'all' && !inG); p.classList.toggle('on', g !== 'all' && inG); });
    $$('.wm-g', root).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === g)));
    det.innerHTML = worldDetHTML(g);
  }
  function select(g, fit) { WMS.group = g; paint(); if (fit) fitGroup(g); analytics.track('world_corridor', { group: g }); }

  // flowing particles, sampled once per route
  const sample = (p, step) => { const L0 = p.getTotalLength(), n = Math.max(2, Math.ceil(L0 / step)), a = new Float32Array(n * 2 + 2); for (let i = 0; i <= n; i++) { const q = p.getPointAtLength(L0 * i / n); a[2 * i] = q.x; a[2 * i + 1] = q.y; } return { a, n, len: L0 }; };
  const flows = [];
  function buildFlows() {
    parts.innerHTML = ''; iparts.innerHTML = ''; flows.length = 0;
    WM_R.forEach(([k, g, st]) => {
      const p = $('path.rt[data-r="' + k + '"]', svg), s = sample(p, 1.5), sea = G.routes[k].mode === 'sea';
      const n = sea ? Math.max(2, Math.min(5, Math.round(s.len / 260))) : 2;
      for (let i = 0; i < n; i++) { const c = D.createElementNS(NS, 'circle'); c.setAttribute('class', 'part ' + st); parts.appendChild(c); flows.push({ c, s, off: i / n, v: sea ? 46 : 14, k, g, inset: false }); }
    });
    $$('path.rt', isvg).forEach(p => {
      const k = p.dataset.r, s = sample(p, 3), sea = k.startsWith('sea');
      for (let i = 0; i < 2; i++) { const c = D.createElementNS(NS, 'circle'); c.setAttribute('r', 4.2); c.setAttribute('class', 'ipart' + (sea ? ' sea' : '')); c.setAttribute('stroke-width', 1.5); iparts.appendChild(c); flows.push({ c, s, off: i / 2, v: 60, k, g: p.dataset.g, inset: true }); }
    });
  }
  let raf = 0, running = false, t0 = performance.now(), last = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (LOWEND && now - last < 33) return; last = now;
    const t = Math.max(0, now - t0) / 1000, k = scaleK(), r = 2.6 / k, g = WMS.group;
    flows.forEach(f => {
      const u = (((t * f.v / f.s.len) + f.off) % 1 + 1) % 1, idx = u * f.s.n, i = Math.floor(idx), fr = idx - i, a = f.s.a;
      const x = a[2 * i] + (a[2 * i + 2] - a[2 * i]) * fr, y = a[2 * i + 1] + (a[2 * i + 3] - a[2 * i + 1]) * fr;
      f.c.setAttribute('cx', x.toFixed(2)); f.c.setAttribute('cy', y.toFixed(2));
      if (!f.inset) f.c.setAttribute('r', r.toFixed(2));
      const vis = g === 'all' || f.g === g || (WM_FEED[g] || []).includes(f.k) || (f.inset && f.g === 'sea' && g !== 'cm' && g !== 'cemac');
      f.c.style.opacity = vis ? (u < .06 ? u / .06 : u > .94 ? (1 - u) / .06 : 1) : 0;
    });
    rings.forEach((c, i) => { const u = ((t * 0.5) + i / 2) % 1; c.setAttribute('r', ((6 + u * 22) / k).toFixed(2)); c.setAttribute('opacity', (0.75 * (1 - u)).toFixed(2)); });
  }
  const start = () => { if (running || RM.matches) return; running = true; raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  // pointer: drag to pan, pinch to zoom, wheel with Ctrl, hover tips, click to select
  const ptrs = new Map(); let moved = false, startVB = null, pinch0 = 0, mid0 = null, down = null;
  const toMap = (cx, cy) => { const r = svg.getBoundingClientRect(); const s = Math.min(r.width / vb.w, r.height / vb.h); const ox = (r.width - vb.w * s) / 2, oy = (r.height - vb.h * s) / 2; return [vb.x + (cx - r.left - ox) / s, vb.y + (cy - r.top - oy) / s]; };
  function zoomAt(f, cx, cy) { goTo({ x: cx - (cx - vb.x) * f, y: cy - (cy - vb.y) * f, w: vb.w * f, h: vb.h * f }, true); }
  svg.addEventListener('pointerdown', e => {
    ptrs.set(e.pointerId, [e.clientX, e.clientY]); moved = false; down = [e.clientX, e.clientY]; startVB = Object.assign({}, vb);
    if (e.pointerType !== 'touch') { try { svg.setPointerCapture(e.pointerId); } catch (x) { /* capture unavailable */ } svg.classList.add('drag'); }
    if (ptrs.size === 2) { const [a, b] = Array.from(ptrs.values()); pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); mid0 = toMap((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  });
  svg.addEventListener('pointermove', e => {
    if (ptrs.has(e.pointerId)) {
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2 && pinch0) { const [a, b] = Array.from(ptrs.values()); vb = startVB; zoomAt(pinch0 / Math.hypot(a[0] - b[0], a[1] - b[1]), mid0[0], mid0[1]); moved = true; return; }
      if (down) {
        const dx = e.clientX - down[0], dy = e.clientY - down[1];
        if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
        if (moved) { const r = svg.getBoundingClientRect(), s = Math.min(r.width / vb.w, r.height / vb.h); goTo({ x: startVB.x - dx / s, y: startVB.y - dy / s, w: vb.w, h: vb.h }, true); T.classList.remove('on'); return; }
      }
    }
    if (e.pointerType !== 'mouse') return;
    const n = e.target.closest && e.target.closest('.pt'), h = e.target.closest && e.target.closest('.hit');
    if (n) { const k = n.dataset.n, R = WM_R.find(r => r[3] === k); placeTip(T, stage, e.clientX, e.clientY, '<b>' + esc(Wd.places[k][0]) + '</b> · ' + esc(Wd.places[k][1]) + (R ? '<small>' + esc(Wd.status[R[2]]) + (G.routes[R[0]].mode === 'sea' ? ' · ' + nf(G.routes[R[0]].km) + ' km' : '') + '</small>' : '')); }
    else if (h) { const R = WM_R.find(r => r[0] === h.dataset.r); placeTip(T, stage, e.clientX, e.clientY, '<b>' + esc(Wd.groups[R[1]][0]) + '</b> · ' + esc(Wd.places[R[3]][0]) + '<small>' + esc(Wd.status[R[2]]) + (G.routes[R[0]].mode === 'sea' ? ' · ' + nf(G.routes[R[0]].km) + ' km' : '') + '</small>'); }
    else T.classList.remove('on');
  });
  const up = e => {
    const wasTap = !moved && ptrs.size === 1;
    ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; svg.classList.remove('drag');
    if (wasTap && e.type === 'pointerup') { const n = e.target.closest && e.target.closest('.pt'), h = e.target.closest && e.target.closest('.hit'); const g = n ? n.dataset.g : h ? h.dataset.g : null; if (g) select(g, true); }
    down = null;
  };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('pointerleave', () => T.classList.remove('on'));
  svg.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const [mx, my] = toMap(e.clientX, e.clientY); zoomAt(Math.exp(e.deltaY * 0.01), mx, my); }, { passive: false });
  svg.addEventListener('keydown', e => { const n = e.target.closest && e.target.closest('.pt'); if (n && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); select(n.dataset.g, true); } });
  $$('[data-z]', stage).forEach(b => b.addEventListener('click', () => {
    const z = b.dataset.z, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    if (z === 'reset') { WMS.group = 'all'; paint(); goTo(homeView()); }
    else { const f = z === 'in' ? 0.6 : 1 / 0.6; goTo({ x: cx - vb.w * f / 2, y: cy - vb.h * f / 2, w: vb.w * f, h: vb.h * f }); }
  }));
  $$('.wm-g', root).forEach(b => b.addEventListener('click', () => { select(b.dataset.g, true); if (window.innerWidth < 1080) { const r = stage.getBoundingClientRect(); if (r.top < 60 || r.bottom > window.innerHeight) stage.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'center' }); } }));

  vb = constrain(homeView()); applyVB(); paint();
  if (WMS.group !== 'all') fitGroup(WMS.group);
  buildFlows();
  if (RM.matches) { flows.forEach(f => f.c.remove()); } else start();
  const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting && !D.hidden ? start() : stop())), { threshold: 0 });
  io.observe(stage);
  const vis = () => (D.hidden ? stop() : start());
  D.addEventListener('visibilitychange', vis);
  let lastA = aspect();
  const ro = new ResizeObserver(() => { const a = aspect(); if (Math.abs(a - lastA) > 0.01) { lastA = a; vb = constrain(WMS.group === 'all' ? homeView() : vb); } applyVB(); });
  ro.observe(stage);
  return () => { stop(); io.disconnect(); ro.disconnect(); cancelAnimationFrame(anim); D.removeEventListener('visibilitychange', vis); };
}
