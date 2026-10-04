/* ---------- Visual systems: hero signal map, geographic map, simulator, charts, architecture ---------- */
const CM_I = GEO.countries.findIndex(c => c.id === '120');
const PLAN_I = ['646', '404'].map(id => GEO.countries.findIndex(c => c.id === id));
const ISO2 = { '716': 'ZW', '894': 'ZM', '800': 'UG', '788': 'TN', '768': 'TG', '834': 'TZ', '748': 'SZ', '728': 'SS', '729': 'SD', '710': 'ZA', '706': 'SO', '694': 'SL', '690': 'SC', '686': 'SN', '678': 'ST', '646': 'RW', '566': 'NG', '562': 'NE', '516': 'NA', '508': 'MZ', '504': 'MA', '732': 'EH', '480': 'MU', '478': 'MR', '466': 'ML', '454': 'MW', '450': 'MG', '434': 'LY', '430': 'LR', '426': 'LS', '404': 'KE', '624': 'GW', '324': 'GN', '288': 'GH', '270': 'GM', '266': 'GA', '231': 'ET', '232': 'ER', '226': 'GQ', '818': 'EG', '262': 'DJ', '384': 'CI', '180': 'CD', '178': 'CG', '174': 'KM', '148': 'TD', '140': 'CF', '132': 'CV', '120': 'CM', '108': 'BI', '854': 'BF', '072': 'BW', '204': 'BJ', '024': 'AO', '012': 'DZ' };
const cName = i => { const c = GEO.countries[i]; const code = ISO2[c.id]; return code ? countryName(code) : c.name; };
const tip = (box) => { let t = box.querySelector('.tt'); if (!t) { t = D.createElement('div'); t.className = 'tt'; t.setAttribute('role', 'tooltip'); box.appendChild(t); } return t; };
const placeTip = (t, box, cx, cy, html) => {
  t.innerHTML = html; t.classList.add('on');
  const r = box.getBoundingClientRect(); const tw = t.offsetWidth, th = t.offsetHeight;
  let x = cx - r.left + 14, y = cy - r.top - th - 12;
  if (x + tw > r.width - 4) x = cx - r.left - tw - 14;
  if (y < 4) y = cy - r.top + 16;
  t.style.left = clamp(x, 4, Math.max(4, r.width - tw - 4)) + 'px'; t.style.top = y + 'px';
};

/* ---------- Hero: the intelligence layer, drawn as a living data grid ---------- */
function heroViz(wrap) {
  const cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d');
  const W = GEO.W, H = GEO.H, dots = GEO.dots, N = dots.length;
  const [fx, fy] = GEO.pts.foumbot, K = GEO.pts.kigali, Nb = GEO.pts.nairobi;
  const dist = new Float32Array(N), ph = new Float32Array(N), kind = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const [x, y, ci] = dots[i];
    dist[i] = Math.hypot(x - fx, y - fy);
    ph[i] = ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1;
    kind[i] = ci === CM_I ? 1 : PLAN_I.includes(ci) ? 2 : 0;
  }
  const steps = $$('.rs li', wrap), tags = $$('.tag', wrap);
  const cmPath = new Path2D(GEO.countries[CM_I].d), planPaths = PLAN_I.map(i => new Path2D(GEO.countries[i].d));
  const STAGE = [0.15, 1.5, 2.3, 3.5];
  let dpr = 1, s = 1, px = -1e4, py = -1e4, raf = 0, running = false, t0 = performance.now(), last = 0, stageSeen = -1;
  function size() {
    const w = cv.clientWidth || 600; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * dpr); cv.height = Math.round(w * H / W * dpr); s = w / W;
  }
  function curve(a, b, p) { // quadratic arc between two map points, lifted northwards
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.32;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]);
    const n = 40, m = Math.max(1, Math.round(n * p));
    for (let k = 1; k <= m; k++) { const u = k / n; const x = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0]; const y = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1]; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  function draw(t) {
    ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const reveal = t * 640, zone = clamp((t - 1.5) / 0.9, 0, 1), sig = t > 2.3 && !RM.matches;
    const scanX = t > 2.9 && !RM.matches ? (((t - 2.9) % 8) / 8) * (W + 300) - 150 : -1e4;
    if (zone > 0) { ctx.globalAlpha = zone; ctx.fillStyle = 'rgba(91,196,141,0.10)'; ctx.fill(cmPath); ctx.strokeStyle = 'rgba(91,196,141,0.55)'; ctx.lineWidth = 1.2; ctx.stroke(cmPath); ctx.globalAlpha = 1; }
    if (t > 4.6) { ctx.globalAlpha = clamp((t - 4.6) / 0.8, 0, 1); ctx.strokeStyle = 'rgba(143,221,245,0.45)'; ctx.lineWidth = 1; ctx.setLineDash([3, 4]); planPaths.forEach(pp => ctx.stroke(pp)); ctx.setLineDash([]); ctx.globalAlpha = 1; }
    const sz = 3.3;
    for (let i = 0; i < N; i++) {
      const a = clamp((reveal - dist[i]) / 140, 0, 1); if (a <= 0) continue;
      const x = dots[i][0], y = dots[i][1];
      let alpha = 0.26 * a, col = 0, grow = 0;
      if (kind[i] === 1 && zone > 0) { col = 1; alpha = (0.26 + 0.7 * zone) * a; grow = 0.9 * zone; }
      const ds = Math.abs(x - scanX); if (ds < 60) alpha = Math.min(1, alpha + (1 - ds / 60) * 0.35);
      if (sig) { const f = ((t * 0.16 + ph[i]) % 1); if (f < 0.014) { col = 2; alpha = 1 - f / 0.014 * 0.6; grow = 1.2; } }
      const dp = (x - px) * (x - px) + (y - py) * (y - py);
      if (dp < 6400) { const k = 1 - Math.sqrt(dp) / 80; alpha = Math.min(1, alpha + k * 0.55); grow += k * 1.6; if (col === 0) col = 3; }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = col === 1 ? '#5BC48D' : col === 2 ? '#8FDDF5' : col === 3 ? '#D9E6DF' : '#9FB1A8';
      const q = sz + grow; ctx.fillRect(x - q / 2, y - q / 2, q, q);
    }
    ctx.globalAlpha = 1;
    if (scanX > -200 && scanX < W + 200) {
      const g = ctx.createLinearGradient(scanX - 90, 0, scanX + 6, 0);
      g.addColorStop(0, 'rgba(143,221,245,0)'); g.addColorStop(1, 'rgba(143,221,245,0.10)');
      ctx.fillStyle = g; ctx.fillRect(scanX - 90, 0, 96, H);
      ctx.fillStyle = 'rgba(143,221,245,0.5)'; ctx.fillRect(scanX + 5, 0, 1, H);
    }
    if (t > 3.5) {
      const p = clamp((t - 3.5) / 1.3, 0, 1);
      ctx.save(); ctx.strokeStyle = 'rgba(143,221,245,0.8)'; ctx.lineWidth = 1.6; ctx.setLineDash([6, 7]); ctx.lineDashOffset = -t * 18;
      curve([fx, fy], K, p); curve([fx, fy], Nb, p); ctx.restore();
      if (p >= 1) [K, Nb].forEach(q => { ctx.strokeStyle = 'rgba(143,221,245,0.9)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(q[0], q[1], 6, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#8FDDF5'; ctx.beginPath(); ctx.arc(q[0], q[1], 2.4, 0, Math.PI * 2); ctx.fill(); });
    }
    if (t > 2.0) {
      for (let k = 0; k < 3; k++) {
        const u = ((t - 2.0) * 0.45 + k / 3) % 1; ctx.strokeStyle = 'rgba(91,196,141,' + (0.7 * (1 - u)).toFixed(3) + ')'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(fx, fy, 6 + u * 70, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.fillStyle = '#5BC48D'; ctx.shadowColor = 'rgba(91,196,141,.9)'; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(fx, fy, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#EDF2EE'; ctx.beginPath(); ctx.arc(fx, fy, 2, 0, Math.PI * 2); ctx.fill();
    }
    let st = -1; STAGE.forEach((v, k) => { if (t >= v) st = k; });
    if (st !== stageSeen) {
      stageSeen = st; steps.forEach((li, k) => li.classList.toggle('on', k <= st)); const sl = wrap.querySelector('[data-stage-l]'); if (sl && st >= 0) sl.textContent = (st === steps.length - 1 ? '● ' : '○ ') + steps[st].dataset.l;
      tags.forEach(tg => tg.classList.toggle('on', (tg.dataset.k === 'pilot' && st >= 1) || (tg.dataset.k !== 'pilot' && st >= 3)));
    }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (LOWEND && now - last < 32) return; last = now;
    draw((now - t0) / 1000);
  }
  const start = () => { if (running || RM.matches) return; running = true; raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  size();
  if (RM.matches) draw(9); else start();
  const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting && !D.hidden ? start() : stop())), { threshold: 0 });
  io.observe(cv);
  const vis = () => (D.hidden ? stop() : start());
  D.addEventListener('visibilitychange', vis);
  const ro = new ResizeObserver(() => { size(); if (RM.matches) draw(9); });
  ro.observe(cv);
  const mv = e => { const r = cv.getBoundingClientRect(); px = (e.clientX - r.left) / r.width * W; py = (e.clientY - r.top) / r.height * H; if (RM.matches) draw(9); };
  const lv = () => { px = py = -1e4; if (RM.matches) draw(9); };
  cv.addEventListener('pointermove', mv); cv.addEventListener('pointerleave', lv);
  return () => { stop(); io.disconnect(); ro.disconnect(); D.removeEventListener('visibilitychange', vis); };
}

/* ---------- Geographic intelligence map ---------- */
const MAP_STATE = { layers: { public: true, pilot: true, plan: true }, sel: CM_I };
function mapHTML() {
  const M = L().map;
  const opts = GEO.countries.map((c, i) => [i, cName(i)]).sort((a, b) => a[1].localeCompare(b[1], LANG))
    .map(([i, n]) => '<option value="' + i + '"' + (MAP_STATE.sel === i ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
  const layer = (k, label, sw) => '<button type="button" class="layer" data-layer="' + k + '" aria-pressed="' + MAP_STATE.layers[k] + '"><span class="sw" style="' + sw + '"></span><span class="lt">' + esc(label) + '</span><span class="tg" aria-hidden="true"></span></button>';
  return '<div class="mapwrap" id="map"><div class="map-stage" data-stage><div class="empty-out" style="position:absolute;inset:auto 16px 16px auto;border:0" data-loading><span class="mono small">' + esc(M.loading) + '</span></div></div>' +
    '<div class="map-side"><div><div class="fx-k" style="margin-bottom:10px">' + esc(M.layers) + '</div><div class="layers">' +
    layer('public', M.lPublic, 'background:rgba(143,221,245,.55)') + layer('pilot', M.lPilot, 'background:#5BC48D') + layer('plan', M.lPlan, 'border:1px dashed #8FDDF5') +
    '</div></div><div class="f"><label for="map-country">' + esc(M.selectAria) + '</label><select id="map-country" class="inp"><option value="">' + esc(M.select) + '</option>' + opts + '</select></div>' +
    '<div class="info" aria-live="polite" data-info></div><p class="small faint">' + esc(M.hint) + '</p></div></div>';
}
function mapMount(root) {
  const M = L().map, stage = $('[data-stage]', root), info = $('[data-info]', root), G = GEO;
  const NS = 'http://www.w3.org/2000/svg';
  let vb = { x: 0, y: 0, w: G.W, h: G.H }, anim = 0;
  const dotsPath = G.dots.map(d => 'M' + (d[0] - 1.3).toFixed(1) + ' ' + (d[1] - 1.3).toFixed(1) + 'h2.6v2.6h-2.6z').join('');
  const arc = (a, b) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.32; return 'M' + a[0] + ' ' + a[1] + 'Q' + mx + ' ' + my + ' ' + b[0] + ' ' + b[1]; };
  const F = G.pts.foumbot;
  stage.innerHTML = '<svg viewBox="0 0 ' + G.W + ' ' + G.H + '" role="group" aria-label="' + esc(L().home.mH) + '">' +
    '<g data-cs>' + G.countries.map((c, i) => '<path class="c" data-i="' + i + '" d="' + c.d + '"/>').join('') + '</g>' +
    '<path data-l="public" d="' + dotsPath + '" fill="#8FDDF5" opacity=".22" pointer-events="none"/>' +
    '<g data-l="plan" pointer-events="none"><path d="' + arc(F, G.pts.kigali) + '" fill="none" stroke="#8FDDF5" stroke-width="1.4" stroke-dasharray="5 6" vector-effect="non-scaling-stroke" opacity=".85"/><path d="' + arc(F, G.pts.nairobi) + '" fill="none" stroke="#8FDDF5" stroke-width="1.4" stroke-dasharray="5 6" vector-effect="non-scaling-stroke" opacity=".85"/>' +
    [G.pts.kigali, G.pts.nairobi].map(p => '<circle data-r="5" cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#0B100E" stroke="#8FDDF5" stroke-width="1.4" vector-effect="non-scaling-stroke"/>').join('') + '</g>' +
    '<g data-l="pilot" pointer-events="none"><circle data-r="16" cx="' + F[0] + '" cy="' + F[1] + '" r="16" fill="none" stroke="#5BC48D" stroke-width="1.2" vector-effect="non-scaling-stroke"><animate attributeName="opacity" values=".9;0;.9" dur="2.4s" repeatCount="indefinite"/></circle><circle data-r="5.5" cx="' + F[0] + '" cy="' + F[1] + '" r="5.5" fill="#5BC48D"/><text data-fs="13" x="' + (F[0] - 14) + '" y="' + (F[1] + 4) + '" text-anchor="end" font-family="Geist Mono, monospace" font-size="13" fill="#EDF2EE" paint-order="stroke" stroke="#070A09" stroke-width="4" stroke-linejoin="round">' + esc(M.pilotLabel) + '</text></g></svg>' +
    '<div class="map-ctrl"><button type="button" data-z="in" aria-label="' + esc(M.zoomIn) + '">+</button><button type="button" data-z="out" aria-label="' + esc(M.zoomOut) + '">−</button><button type="button" data-z="reset" aria-label="' + esc(M.reset) + '"><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 5V2h3M12 9v3H9M9 2h3v3M5 12H2V9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button></div>' +
    '<div class="map-scale">' + esc(M.scaleNote) + '</div>';
  const svg = $('svg', stage), paths = $$('path.c', svg), T = tip(stage);
  const scaled = $$('[data-r],[data-fs]', svg);
  function applyVB() {
    svg.setAttribute('viewBox', vb.x.toFixed(1) + ' ' + vb.y.toFixed(1) + ' ' + vb.w.toFixed(1) + ' ' + vb.h.toFixed(1));
    const k = vb.w / G.W;
    scaled.forEach(el => { if (el.dataset.r) el.setAttribute('r', (+el.dataset.r * Math.max(k, 0.18)).toFixed(2)); if (el.dataset.fs) { el.setAttribute('font-size', (+el.dataset.fs * Math.max(k, 0.18)).toFixed(2)); el.setAttribute('x', (F[0] - 14 * Math.max(k, .18)).toFixed(1)); el.setAttribute('y', (F[1] + 4 * Math.max(k, .18)).toFixed(1)); el.setAttribute('stroke-width', (4 * Math.max(k, .18)).toFixed(2)); } });
  }
  function constrain(v) {
    const w = clamp(v.w, 70, G.W), h = w * G.H / G.W;
    return { w, h, x: clamp(v.x, -w * 0.4, G.W - w * 0.6), y: clamp(v.y, -h * 0.4, G.H - h * 0.6) };
  }
  function goTo(target, instant) {
    target = constrain(target); cancelAnimationFrame(anim);
    if (instant || RM.matches) { vb = target; applyVB(); return; }
    const from = Object.assign({}, vb), t0 = performance.now(), dur = 380;
    const step = now => { const u = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - u, 3); vb = { x: from.x + (target.x - from.x) * e, y: from.y + (target.y - from.y) * e, w: from.w + (target.w - from.w) * e, h: from.h + (target.h - from.h) * e }; applyVB(); if (u < 1) anim = requestAnimationFrame(step); };
    anim = requestAnimationFrame(step);
  }
  function zoomAt(f, cx, cy) { const w = vb.w * f, h = vb.h * f; goTo({ x: cx - (cx - vb.x) * f, y: cy - (cy - vb.y) * f, w, h }, true); }
  function toMap(clientX, clientY) { const r = svg.getBoundingClientRect(); return [vb.x + (clientX - r.left) / r.width * vb.w, vb.y + (clientY - r.top) / r.height * vb.h]; }
  function status(i) { return i === CM_I ? 'pilot' : PLAN_I.includes(i) ? 'plan' : 'public'; }
  function paint() {
    paths.forEach((p, i) => { const st = status(i); p.classList.toggle('pilot', st === 'pilot' && MAP_STATE.layers.pilot); p.classList.toggle('plan', st === 'plan' && MAP_STATE.layers.plan); p.classList.toggle('sel', MAP_STATE.sel === i); });
    $$('[data-l]', svg).forEach(g => { g.style.display = MAP_STATE.layers[g.dataset.l] ? '' : 'none'; });
    $$('[data-layer]', root).forEach(b => b.setAttribute('aria-pressed', String(MAP_STATE.layers[b.dataset.layer])));
  }
  function renderInfo() {
    const i = MAP_STATE.sel;
    if (i == null || i < 0) { info.innerHTML = '<p class="faint small">' + esc(M.select) + '</p>'; return; }
    const st = status(i), bad = st === 'pilot' ? 'real' : st === 'plan' ? 'plan' : '';
    const stl = st === 'pilot' ? M.stPilot : st === 'plan' ? M.stPlan : M.stPublic;
    info.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h4>' + esc(cName(i)) + '</h4><span class="badge ' + bad + '">' + esc(stl) + '</span></div><dl class="kv">' +
      '<dt>' + esc(M.kField) + '</dt><dd>' + esc(st === 'pilot' ? M.fieldCm : M.fieldNone) + '</dd>' +
      '<dt>' + esc(M.kPublic) + '</dt><dd>' + esc(M.publicLayers) + '</dd>' +
      '<dt>' + esc(M.kNext) + '</dt><dd>' + esc(st === 'pilot' ? M.nextCm : st === 'plan' ? M.nextPlan : M.nextNone) + '</dd></dl>';
  }
  function select(i, zoom) {
    MAP_STATE.sel = i; paint(); renderInfo();
    const sel = $('#map-country', root); if (sel) sel.value = i == null ? '' : String(i);
    if (zoom && i != null) {
      const b = G.countries[i].b; const cw = b[1][0] - b[0][0], ch = b[1][1] - b[0][1];
      const w = Math.max(cw * 2.4, ch * 2.4 * G.W / G.H, 160);
      goTo({ x: (b[0][0] + b[1][0]) / 2 - w / 2, y: (b[0][1] + b[1][1]) / 2 - (w * G.H / G.W) / 2, w, h: w * G.H / G.W });
    }
    if (i != null) analytics.track('map_select', { country: G.countries[i].name });
  }
  // pointer: drag to pan (mouse/pen), pinch to zoom (touch), tap to select
  const pts = new Map(); let downPath = null, moved = false, startVB = null, pinch0 = 0, mid0 = null, down = null;
  svg.addEventListener('pointerdown', e => {
    pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false; down = [e.clientX, e.clientY]; startVB = Object.assign({}, vb); downPath = e.target.closest ? e.target.closest('path.c') : null;
    if (e.pointerType !== 'touch') { svg.setPointerCapture(e.pointerId); svg.classList.add('drag'); }
    if (pts.size === 2) { const [a, b] = Array.from(pts.values()); pinch0 = Math.hypot(a[0] - b[0], a[1] - b[1]); mid0 = toMap((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  });
  svg.addEventListener('pointermove', e => {
    if (pts.has(e.pointerId)) {
      pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2 && pinch0) {
        const [a, b] = Array.from(pts.values()); const d = Math.hypot(a[0] - b[0], a[1] - b[1]); const f = pinch0 / d;
        vb = startVB; zoomAt(f, mid0[0], mid0[1]); moved = true; return;
      }
      if (e.pointerType !== 'touch' && down) {
        const dx = e.clientX - down[0], dy = e.clientY - down[1];
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        if (moved) { const r = svg.getBoundingClientRect(); goTo({ x: startVB.x - dx / r.width * vb.w, y: startVB.y - dy / r.height * vb.h, w: vb.w, h: vb.h }, true); T.classList.remove('on'); return; }
      }
    }
    const p = e.target.closest && e.target.closest('path.c');
    if (p && e.pointerType === 'mouse') { const i = +p.dataset.i, st = status(i); placeTip(T, stage, e.clientX, e.clientY, '<b>' + esc(cName(i)) + '</b><br>' + esc(st === 'pilot' ? M.stPilot : st === 'plan' ? M.stPlan : M.stPublic)); }
    else if (!p) T.classList.remove('on');
  });
  const up = e => {
    const wasTap = !moved && pts.size === 1;
    pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; svg.classList.remove('drag');
    if (wasTap && e.type === 'pointerup' && downPath) select(+downPath.dataset.i, true);
    down = null;
  };
  svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
  svg.addEventListener('pointerleave', () => T.classList.remove('on'));
  svg.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); const [mx, my] = toMap(e.clientX, e.clientY); zoomAt(Math.exp(e.deltaY * 0.01), mx, my); }, { passive: false });
  svg.addEventListener('dblclick', e => { const [mx, my] = toMap(e.clientX, e.clientY); vb = Object.assign({}, vb); const f = 0.55; goTo({ x: mx - (mx - vb.x) * f, y: my - (my - vb.y) * f, w: vb.w * f, h: vb.h * f }); });
  $$('[data-z]', stage).forEach(b => b.addEventListener('click', () => {
    const z = b.dataset.z, cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2;
    if (z === 'reset') goTo({ x: 0, y: 0, w: G.W, h: G.H });
    else { const f = z === 'in' ? 0.6 : 1 / 0.6; goTo({ x: cx - vb.w * f / 2, y: cy - vb.h * f / 2, w: vb.w * f, h: vb.h * f }); }
  }));
  $$('[data-layer]', root).forEach(b => b.addEventListener('click', () => { const k = b.dataset.layer; MAP_STATE.layers[k] = !MAP_STATE.layers[k]; paint(); analytics.track('map_layer', { layer: k, on: MAP_STATE.layers[k] }); }));
  $('#map-country', root).addEventListener('change', e => { const v = e.target.value; select(v === '' ? null : +v, v !== ''); });
  applyVB(); paint(); renderInfo();
  const ld = $('[data-loading]', stage); if (ld) ld.remove();
  return () => cancelAnimationFrame(anim);
}

/* ---------- Season Simulator ---------- */
const RATES = { USD: 1, XAF: 564, EUR: 0.86, RWF: 1450, KES: 129, NGN: 1500 };
const CROPS = { tomato: [5, 10, 8], cucumber: [0, 11, 8], greenbean: [0, 11, 8], zucchini: [0, 10, 8], pepper: [6, 9, 17] };
const WET = [0, 0, 1, 2, 2, 2, 3, 3, 3, 2, 1, 0];   // simplified rain regime, West Cameroon highlands (one rainy season, about March to November)
const HEAT = [1, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1]; // late dry season is the hottest period
const COST_HA = 10000, EQUIP = 5000, RES = 0.10, WPM = 4.345;
const SPLIT = [['seeds', 0.20, '#5BC48D'], ['labour', 0.20, '#4AA97A'], ['fert', 0.15, '#3E8F68'], ['pack', 0.15, '#8FDDF5'], ['protect', 0.10, '#6FB9CF'], ['rent', 0.10, '#5A93A6'], ['agro', 0.10, '#C9A24B']];
const SIM = { amount: 2500000, cur: 'XAF', mode: 'budget', crop: 'tomato', area: 1, month: 2, irrig: false, equip: false };

function riskOf(crop, start, irrig) {
  const [n, g, h] = CROPS[crop];
  const fl = Math.floor(start + Math.max(0, n + g - 3) / WPM) % 12;
  const h0 = start + (n + g) / WPM, h1 = start + (n + g + h) / WPM;
  const hm = []; for (let m = Math.floor(h0); m <= Math.floor(h1 - 0.01); m++) hm.push(m % 12);
  const cyc = []; for (let m = start; m <= Math.floor(h1 - 0.01); m++) cyc.push(m % 12);
  const dry = cyc.reduce((a, m) => a + (WET[m] === 0 ? 2 : WET[m] === 1 ? 1 : 0), 0) / cyc.length;
  let water = dry >= 1.2 ? 2 : dry >= 0.5 ? 1 : 0;
  const wmax = Math.max(WET[fl], ...hm.map(m => WET[m]));
  const disease = wmax >= 3 ? 2 : wmax === 2 ? 1 : 0;
  let heat = HEAT[fl];
  if (irrig) { water = Math.max(0, water - 1); heat = Math.max(0, heat - 1); }
  const sum = water + disease + heat;
  return { water, disease, heat, all: sum >= 4 ? 2 : sum >= 2 ? 1 : 0, sum, fl, h0: Math.floor(h0) % 12 };
}
function simCompute(st) {
  const K = (+st.amount || 0) / RATES[st.cur];
  const E = st.equip ? EQUIP : 0, R = K * RES;
  const cap = (K - E - R) / COST_HA;
  let area, state = 'ok', free = 0, need = 0;
  if (st.mode === 'budget') { area = Math.max(cap, 0); if (cap <= 0) state = 'neg'; }
  else {
    const req = Math.max(0, +st.area || 0);
    if (cap >= req) { area = req; free = K - E - R - req * COST_HA; }
    else { area = Math.max(cap, 0); need = (req * COST_HA + E) / (1 - RES); state = cap <= 0 ? 'neg' : 'short'; }
  }
  const tier = K < 10 ? -1 : K < 1000 ? 0 : K < 10000 ? 1 : K < 100000 ? 2 : 3;
  const weeks = CROPS[st.crop].reduce((a, b) => a + b, 0);
  const risks = Array.from({ length: 12 }, (_, m) => riskOf(st.crop, m, st.irrig));
  let best = 0; risks.forEach((r, m) => { const b = risks[best]; const dm = x => Math.min(Math.abs(x - st.month), 12 - Math.abs(x - st.month)); if (r.sum < b.sum || (r.sum === b.sum && dm(m) < dm(best))) best = m; });
  return { K, E, R, area, state, free, need, tier, weeks, risks, best, variable: area * COST_HA };
}
const fmtArea = (ha) => {
  if (ha <= 0) return '0 m²';
  if (ha < 0.1) { const m2 = ha * 10000; return (m2 < 1 ? '< 1' : nf(m2, m2 < 10 ? 1 : 0)) + ' m²'; }
  return nf(ha, ha < 10 ? 2 : ha < 100 ? 1 : 0) + ' ha';
};
const startDate = (m) => { const now = new Date(); const y = now.getMonth() >= m ? now.getFullYear() + 1 : now.getFullYear(); return new Date(y, m, 1); };
const fmtDate = (d) => new Intl.DateTimeFormat(L().meta.locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(d);

function simHTML() {
  const S = L().sim, st = SIM;
  const cur = Object.keys(RATES).map(c => '<option value="' + c + '"' + (st.cur === c ? ' selected' : '') + '>' + c + '</option>').join('');
  const months = Array.from({ length: 12 }, (_, m) => '<option value="' + m + '"' + (st.month === m ? ' selected' : '') + '>' + esc(monthName(m)) + '</option>').join('');
  const crops = Object.keys(CROPS).map(c => '<button type="button" data-crop="' + c + '" aria-pressed="' + (st.crop === c) + '">' + esc(S.crops[c]) + '<span class="mono" style="display:block;font-size:10px;color:var(--fg-3);letter-spacing:.08em;margin-top:2px">' + (c === 'tomato' ? S.cropTag.tomato : S.cropTag.other) + '</span></button>').join('');
  return '<div class="panel sim" id="sim">' +
    '<form class="sim-in" data-sim novalidate onsubmit="return false">' +
    '<div class="blk-t"><h4>' + esc(L().home.sEyebrow.replace(/^\d+ · /, '')) + '</h4><span class="badge demo">' + esc(S.badge) + '</span></div>' +
    '<div class="row2"><div class="f"><label for="sim-amount">' + esc(S.capital) + '</label><input class="inp tnum" id="sim-amount" inputmode="decimal" autocomplete="off" value="' + esc(nf(st.amount)) + '"></div>' +
    '<div class="f"><label for="sim-cur">' + esc(S.currency) + '</label><select class="inp" id="sim-cur">' + cur + '</select></div></div>' +
    '<div class="f"><span class="lbl" id="sim-mode-l">' + esc(S.approach) + '</span><div class="seg" role="group" aria-labelledby="sim-mode-l"><button type="button" data-mode="budget" aria-pressed="' + (st.mode === 'budget') + '">' + esc(S.budgetFirst) + '</button><button type="button" data-mode="crop" aria-pressed="' + (st.mode === 'crop') + '">' + esc(S.cropFirst) + '</button></div></div>' +
    '<div class="f"><span class="lbl" id="sim-crop-l">' + esc(S.crop) + '</span><div class="crops" role="group" aria-labelledby="sim-crop-l">' + crops + '</div></div>' +
    '<div class="f" data-area' + (st.mode === 'crop' ? '' : ' hidden') + '><label for="sim-area">' + esc(S.area) + ' (' + S.areaUnit + ')</label><input class="inp tnum" id="sim-area" type="number" min="0.01" max="100000" step="0.01" inputmode="decimal" value="' + st.area + '"></div>' +
    '<div class="f"><label for="sim-month">' + esc(S.month) + '</label><select class="inp" id="sim-month">' + months + '</select><span class="hint">' + esc(S.monthHint) + '</span></div>' +
    '<label class="chk"><input type="checkbox" id="sim-irrig"' + (st.irrig ? ' checked' : '') + '> ' + esc(S.irrig) + '</label>' +
    '<label class="chk"><input type="checkbox" id="sim-equip"' + (st.equip ? ' checked' : '') + '> ' + esc(S.equip) + '</label>' +
    '<p class="notice" style="margin-top:auto">' + S.assume + '</p></form><div class="sim-out" data-out aria-live="polite"></div></div>';
}
function simRender(root) {
  const S = L().sim, st = SIM, r = simCompute(st), out = $('[data-out]', root);
  const [n, g, h] = CROPS[st.crop];
  const tierName = r.tier < 0 ? '·' : S.tiers[r.tier];
  const m2 = r.area * 10000;
  const scale = S.scale.find(x => m2 < x[0]);
  let status = '';
  if (r.tier < 0) status = S.tooSmall;
  else if (r.state === 'neg') status = S.feasibleNeg;
  else if (r.state === 'short') status = S.feasibleNo(fmtArea(r.area), money(r.need * RATES[st.cur], st.cur));
  else if (st.mode === 'crop') status = S.feasibleOk;
  const kpis = '<div class="kpis"><div><div class="k">' + esc(S.kArea) + '</div><div class="v">' + fmtArea(r.area) + '</div><div class="s">' + esc(r.area > 0 && scale ? scale[1] : '') + '</div></div>' +
    '<div><div class="k">' + esc(S.kTier) + '</div><div class="v" style="font-size:clamp(20px,2vw,26px)">' + esc(tierName) + '</div><div class="s">' + esc(S.capitalUsd) + ' · ' + money(r.K, 'USD') + '</div></div>' +
    '<div><div class="k">' + esc(S.kCycle) + '</div><div class="v">' + r.weeks + '<small>' + esc(S.weeks) + '</small></div><div class="s">' + esc(S.crops[st.crop]) + ' · ' + esc(monthName(st.month)) + '</div></div></div>' +
    (status ? '<p class="notice" style="border-left-color:' + (r.state === 'ok' && r.tier >= 0 ? 'var(--green)' : 'var(--warn)') + '">' + esc(status) + '</p>' : '');
  // calendar
  const PW = Math.max(300, Math.round(out.clientWidth || 640)), narrow = PW < 480;
  out.dataset.w = PW;
  const totalW = n + g + h, spanM = Math.ceil(totalW / WPM) + 1, CW = PW, X0 = narrow ? 84 : 112, X1 = CW - 12, px = w => X0 + (w / (spanM * WPM)) * (X1 - X0);
  const sd = startDate(st.month), add = w => new Date(sd.getTime() + w * 7 * 864e5);
  let cal = '<svg viewBox="0 0 ' + CW + ' 138" role="img" aria-label="' + esc(S.calT + ': ' + S.firstHarvest + ' ' + fmtDate(add(n + g))) + '">';
  for (let k = 0; k <= spanM; k++) { const x = px(k * WPM); cal += '<line x1="' + x + '" x2="' + x + '" y1="10" y2="104" stroke="#1B2521"/>' + (k < spanM ? '<text x="' + (x + 4) + '" y="124" font-size="11" fill="#6F7C76" font-family="Geist Mono, monospace">' + esc(monthName(st.month + k, 'short')) + '</text>' : ''); }
  const bar = (y, w0, w1, col, lab) => w1 > w0 ? '<text x="0" y="' + (y + 13) + '" font-size="12" fill="#AAB6B0">' + esc(lab) + '</text><rect class="grow" x="' + px(w0) + '" y="' + y + '" width="' + Math.max(2, px(w1) - px(w0)) + '" height="18" rx="4" fill="' + col + '"/>' : '';
  cal += bar(16, 0, n, 'rgba(143,221,245,.55)', S.nursery) + bar(46, n, n + g, 'rgba(91,196,141,.45)', S.growth) + bar(76, n + g, totalW, '#5BC48D', S.harvest);
  const fw = Math.max(0, n + g - 3); cal += '<path d="M' + px(fw) + ' 49l6 6-6 6-6-6z" fill="#C9A24B"><title>' + esc(S.flowering) + '</title></path>';
  const fhTxt = S.firstHarvest + ' · ' + fmtDate(add(n + g)), fhW = fhTxt.length * 6.7, fhX = px(n + g) + 4, fhEnd = fhX + fhW > CW - 2;
  cal += '<text x="' + (fhEnd ? CW - 2 : fhX) + '" y="72" text-anchor="' + (fhEnd ? 'end' : 'start') + '" font-size="11" fill="#EDF2EE" font-family="Geist Mono, monospace" paint-order="stroke" stroke="#0B100E" stroke-width="4">' + esc(fhTxt) + '</text></svg>';
  // budget split
  const parts = [];
  if (r.variable > 0) SPLIT.forEach(([k, p, c]) => parts.push([S.lines[k], r.variable * p, c]));
  if (r.E > 0 && r.state !== 'neg') parts.push([S.lines.equip, r.E, '#E2C67E']);
  parts.push([S.lines.reserve, r.R, '#3A4842']);
  const rest = Math.max(0, r.K - parts.reduce((a, p) => a + p[1], 0)); if (rest > r.K * 0.005) parts.push([S.lines.free, rest, '#1F2925']);
  const tot = Math.max(r.K, 1e-9);
  const split = '<div class="split" role="img" aria-label="' + esc(S.budT) + '">' + parts.map(p => '<span style="width:' + (p[1] / tot * 100).toFixed(2) + '%;background:' + p[2] + '" title="' + esc(p[0]) + '"></span>').join('') + '</div><div class="split-legend">' + parts.map(p => '<div><span><i style="background:' + p[2] + '"></i>' + esc(p[0]) + '</span><b>' + money(p[1] * RATES[st.cur], st.cur) + ' <em>' + nf(p[1] / tot * 100, 0) + '%</em></b></div>').join('') + '</div>';
  // risk heatmap
  const RC = ['rgba(91,196,141,.42)', 'rgba(226,178,74,.55)', 'rgba(226,106,82,.70)'];
  const HW = PW, HX = narrow ? 92 : 128, cw = (HW - HX - 4) / 12, rowsK = ['water', 'disease', 'heat', 'all'];
  let hm = '<svg viewBox="0 0 ' + HW + ' 186" role="img" aria-label="' + esc(S.riskT + '. ' + S.bestLine(monthName(r.best), monthName(st.month))) + '">';
  rowsK.forEach((k, ri) => {
    const y = 26 + ri * 34 + (k === 'all' ? 8 : 0);
    hm += '<text x="0" y="' + (y + 18) + '" font-size="' + (narrow ? 10.5 : 12) + '" fill="' + (k === 'all' ? '#EDF2EE' : '#AAB6B0') + '"' + (k === 'all' ? ' font-weight="600"' : '') + '>' + esc(S.rows[k]) + '</text>';
    r.risks.forEach((rk, m) => { hm += '<rect data-m="' + m + '" x="' + (HX + m * cw + 1.5) + '" y="' + y + '" width="' + (cw - 3) + '" height="28" rx="4" fill="' + RC[rk[k]] + '" style="cursor:pointer"/>'; });
  });
  for (let m = 0; m < 12; m++) hm += '<text x="' + (HX + m * cw + cw / 2) + '" y="180" font-size="10.5" text-anchor="middle" fill="' + (m === st.month ? '#EDF2EE' : '#6F7C76') + '" font-family="Geist Mono, monospace">' + esc(monthName(m, 'narrow')) + '</text>';
  hm += '<rect x="' + (HX + st.month * cw) + '" y="22" width="' + cw + '" height="146" rx="6" fill="none" stroke="#EDF2EE" stroke-width="1.5"/>';
  hm += '<text x="' + (HX + r.best * cw + cw / 2) + '" y="14" font-size="10" text-anchor="middle" fill="#5BC48D" font-family="Geist Mono, monospace" letter-spacing=".08em">' + esc(S.best.toUpperCase()) + '</text><path d="M' + (HX + r.best * cw + cw / 2 - 4) + ' 17h8l-4 4z" fill="#5BC48D"/></svg>';
  const legend = '<div class="risk-legend">' + S.lv.map((l, i) => '<span><i style="background:' + RC[i] + '"></i>' + esc(l) + '</span>').join('') + '<span><i style="background:none;border:1.5px solid #EDF2EE"></i>' + esc(S.yours) + '</span></div>';
  const conf = '<div class="card" style="padding:18px"><div class="blk-t" style="margin-bottom:8px"><h4>' + esc(S.confT) + '</h4><span class="mono" style="color:var(--warn)">' + esc(S.confV) + '</span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:10px">' + [1, 0, 0, 0].map(on => '<span style="height:6px;border-radius:3px;background:' + (on ? 'var(--warn)' : 'var(--line-2)') + '"></span>').join('') + '</div><p class="small muted">' + esc(S.confD) + '</p></div>';
  const lock = '<div class="card" style="padding:18px"><div class="blk-t" style="margin-bottom:8px"><h4>' + esc(S.lockT) + '</h4><svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true"><rect x="1" y="7" width="12" height="8" rx="2" fill="none" stroke="#6F7C76"/><path d="M4 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="#6F7C76"/></svg></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">' + S.scen.map(x => '<div style="border:1px dashed var(--line-2);border-radius:8px;padding:8px;font-size:12px;color:var(--fg-3)">' + esc(x) + '<div class="mono" style="margin-top:4px;color:var(--fg-3)">· · ·</div></div>').join('') + '</div><p class="small muted">' + esc(S.lockD) + '</p><p class="mono small faint" style="margin-top:10px">M<sub>q</sub> = A* × (Y<sub>q</sub> × P<sub>q</sub> − c) − E</p></div>';
  out.innerHTML = kpis +
    '<div><div class="blk-t"><h4>' + esc(S.calT) + '</h4><span>' + esc(S.calS) + '</span></div><div class="chart-box nomin">' + cal + '</div></div>' +
    '<div><div class="blk-t"><h4>' + esc(S.budT) + '</h4><span>' + esc(S.budS) + '</span></div>' + split + '</div>' +
    '<div><div class="blk-t"><h4>' + esc(S.riskT) + '</h4><span>' + esc(S.riskS) + '</span></div><div class="chart-box nomin" data-heat>' + hm + '</div>' + legend + '<p class="small muted" style="margin-top:10px">' + esc(S.bestLine(monthName(r.best), monthName(st.month))) + '</p></div>' +
    '<div class="g2">' + conf + lock + '</div>';
  const box = $('[data-heat]', out), T = tip(box);
  box.addEventListener('pointermove', e => {
    const c = e.target.closest('rect[data-m]'); if (!c) { T.classList.remove('on'); return; }
    const m = +c.dataset.m, rk = r.risks[m];
    placeTip(T, box, e.clientX, e.clientY, '<b>' + esc(S.tt(monthName(m), monthName(rk.fl), monthName(rk.h0))) + '</b><br>' + ['water', 'disease', 'heat'].map(k => esc(S.rows[k]) + ' · ' + esc(S.lv[rk[k]])).join('<br>'));
  });
  box.addEventListener('pointerleave', () => T.classList.remove('on'));
  box.addEventListener('click', e => { const c = e.target.closest('rect[data-m]'); if (!c) return; SIM.month = +c.dataset.m; const sel = $('#sim-month', root); if (sel) sel.value = SIM.month; simRender(root); analytics.track('sim_window', { month: SIM.month }); });
}
function simMount(root) {
  const form = $('[data-sim]', root); let tTrack = 0;
  const parseAmt = v => { const s = String(v).replace(/[^\d.,]/g, ''); const norm = s.replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.'); return Math.max(0, Math.min(1e12, parseFloat(norm) || 0)); };
  const changed = () => { simRender(root); clearTimeout(tTrack); tTrack = setTimeout(() => analytics.track('sim_run', { crop: SIM.crop, mode: SIM.mode, cur: SIM.cur, tier: simCompute(SIM).tier }), 800); };
  form.addEventListener('input', e => {
    const id = e.target.id;
    if (id === 'sim-amount') SIM.amount = parseAmt(e.target.value);
    else if (id === 'sim-area') SIM.area = Math.max(0, parseFloat(e.target.value) || 0);
    else if (id === 'sim-month') SIM.month = +e.target.value;
    else if (id === 'sim-cur') SIM.cur = e.target.value;
    else if (id === 'sim-irrig') SIM.irrig = e.target.checked;
    else if (id === 'sim-equip') SIM.equip = e.target.checked;
    changed();
  });
  let lastW = 0; const out = $('[data-out]', root);
  const ro = new ResizeObserver(() => { const w = out.clientWidth; if (Math.abs(w - lastW) > 24) { lastW = w; simRender(root); } });
  ro.observe(out);
  form.addEventListener('change', e => { if (e.target.id === 'sim-amount') e.target.value = nf(SIM.amount); });
  form.addEventListener('click', e => {
    const m = e.target.closest('[data-mode]'), c = e.target.closest('[data-crop]');
    if (m) { SIM.mode = m.dataset.mode; $$('[data-mode]', form).forEach(b => b.setAttribute('aria-pressed', String(b === m))); $('[data-area]', form).hidden = SIM.mode !== 'crop'; changed(); }
    if (c) { SIM.crop = c.dataset.crop; $$('[data-crop]', form).forEach(b => b.setAttribute('aria-pressed', String(b === c))); changed(); }
  });
  simRender(root);
  return () => ro.disconnect();
}

/* ---------- Charts ---------- */
function landChart(box) {
  const T = L().data, W = 640, H = 236, X0 = 150, X1 = W - 70;
  const g1 = [[T.landA, 7.2, '#3E8F68'], [T.landB, 1.8, '#5BC48D']], g2 = [[T.landC, 240, '#5A93A6'], [T.landD, 33, '#8FDDF5']];
  const grp = (y0, title, rows, max, unit) => {
    let s = '<text x="0" y="' + y0 + '" font-size="11" fill="#6F7C76" font-family="Geist Mono, monospace" letter-spacing=".08em">' + esc(title.toUpperCase()) + '</text>';
    rows.forEach(([lab, v, c], i) => {
      const y = y0 + 14 + i * 34, w = (X1 - X0) * v / max;
      s += '<text x="0" y="' + (y + 16) + '" font-size="13" fill="#AAB6B0">' + esc(lab) + '</text><rect x="' + X0 + '" y="' + y + '" width="' + (X1 - X0) + '" height="22" rx="4" fill="#131B18"/><rect class="grow" data-tip="' + esc(lab + ' · ' + nf(v, v < 10 ? 1 : 0) + ' ' + unit) + '" x="' + X0 + '" y="' + y + '" width="' + w.toFixed(1) + '" height="22" rx="4" fill="' + c + '"/><text x="' + (X0 + w + 8) + '" y="' + (y + 16) + '" font-size="13" fill="#EDF2EE" font-family="Geist Mono, monospace">' + (i === 1 && unit === 'k ha' ? '< ' : '') + nf(v, v < 10 ? 1 : 0) + '</text>';
    });
    return s;
  };
  box.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(T.landH + ' ' + T.landA + ' 7.2 M ha; ' + T.landB + ' 1.8 M ha; ' + T.landC + ' 240,000 ha; ' + T.landD + ' 33,000 ha.') + '">' + grp(14, T.landT1, g1, 7.2, 'M ha') + grp(132, T.landT2, g2, 240, 'k ha') + '</svg>';
  bindTips(box);
}
function coverageChart(box) {
  const T = L().data, W = 640, X0 = 150, X1 = W - 16, Y0 = 1950, Y1 = 2028, px = y => X0 + (y - Y0) / (Y1 - Y0) * (X1 - X0);
  const fr = LANG === 'fr';
  const rows = [
    ['ERA5-Land', 1950, 2026, '#5A93A6', fr ? 'Réanalyse horaire, environ 9 km' : 'Hourly reanalysis, about 9 km'],
    ['FAOSTAT', 1961, 2026, '#3E8F68', fr ? 'Production et rendements par pays' : 'Production and yields by country'],
    ['NASA POWER', 1981, 2026, '#5BC48D', fr ? 'Météo journalière' : 'Daily weather'],
    ['CHIRPS', 1981, 2026, '#6FB9CF', fr ? 'Pluie, environ 5 km' : 'Rainfall, about 5 km'],
    [fr ? 'Prix PAM Cameroun' : 'WFP prices, Cameroon', 2005, 2024, '#C9A24B', fr ? 'Prix de marché, surtout au Nord' : 'Market prices, mainly northern regions'],
    ['Sentinel-2', 2015, 2026, '#8FDDF5', fr ? 'Indice de végétation des parcelles' : 'Vegetation index of plots'],
    ['Cam_Agri pilot', 2024.7, 2025.8, '#EDF2EE', fr ? 'Pilote terrain, 4 phases' : 'Field pilot, four phases'],
    [fr ? 'Journaux de saison' : 'AfriFarm season logs', 2027.2, 2028, 'plan', fr ? 'Prévu dès mars 2027' : 'Planned from March 2027']
  ];
  if (fr) rows[6][0] = 'Pilote Cam_Agri';
  const H = 30 + rows.length * 30 + 26;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(T.covH) + '">';
  [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].forEach(y => { s += '<line x1="' + px(y) + '" x2="' + px(y) + '" y1="16" y2="' + (H - 22) + '" stroke="#1B2521"/><text x="' + px(y) + '" y="' + (H - 6) + '" font-size="11" text-anchor="middle" fill="#6F7C76" font-family="Geist Mono, monospace">' + y + '</text>'; });
  s += '<line x1="' + px(2026.75) + '" x2="' + px(2026.75) + '" y1="10" y2="' + (H - 22) + '" stroke="#C9A24B" stroke-dasharray="3 3"/><text x="' + (px(2026.75) - 4) + '" y="10" font-size="10" text-anchor="end" fill="#C9A24B" font-family="Geist Mono, monospace">' + (fr ? 'AUJOURD’HUI' : 'TODAY') + '</text>';
  rows.forEach(([lab, a, b, c, d], i) => {
    const y = 24 + i * 30; const w = Math.max(3, px(b) - px(a));
    s += '<text x="0" y="' + (y + 14) + '" font-size="12.5" fill="#AAB6B0">' + esc(lab) + '</text>';
    s += c === 'plan' ? '<rect class="grow" data-tip="' + esc(lab + ' · ' + d) + '" x="' + px(a) + '" y="' + (y + 2) + '" width="' + w + '" height="16" rx="3" fill="none" stroke="#8FDDF5" stroke-dasharray="3 3"/>'
      : '<rect class="grow" data-tip="' + esc(lab + ' · ' + Math.floor(a) + (b >= 2026 ? (fr ? ' à aujourd’hui' : ' to present') : (fr ? ' à ' : ' to ') + Math.floor(b)) + ' · ' + d) + '" x="' + px(a) + '" y="' + (y + 2) + '" width="' + w + '" height="16" rx="3" fill="' + c + '" opacity=".9"/>';
  });
  box.innerHTML = s + '</svg>';
  bindTips(box);
}
function roadChart(box) {
  const A = L().about, W = 760, X0 = 150, X1 = W - 20, WK = 32, px = w => X0 + (w - 1) / WK * (X1 - X0);
  const start = new Date(2026, 9, 5);
  const H = 40 + A.road.length * 40 + 34;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(A.roadH) + '">';
  for (let w = 1; w <= WK + 1; w += 4) { const d = new Date(start.getTime() + (w - 1) * 7 * 864e5); s += '<line x1="' + px(w) + '" x2="' + px(w) + '" y1="22" y2="' + (H - 30) + '" stroke="#1B2521"/><text x="' + px(w) + '" y="' + (H - 16) + '" font-size="10.5" text-anchor="middle" fill="#6F7C76" font-family="Geist Mono, monospace">' + esc(A.week[0] + w) + '</text><text x="' + px(w) + '" y="' + (H - 3) + '" font-size="10" text-anchor="middle" fill="#4E5A55" font-family="Geist Mono, monospace">' + esc(new Intl.DateTimeFormat(L().meta.locale, { day: 'numeric', month: 'short' }).format(d)) + '</text>'; }
  s += '<line x1="' + px(1) + '" x2="' + px(1) + '" y1="10" y2="' + (H - 30) + '" stroke="#C9A24B" stroke-dasharray="3 3"/><text x="' + (px(1) + 4) + '" y="14" font-size="10" fill="#C9A24B" font-family="Geist Mono, monospace">' + esc(A.now.toUpperCase()) + '</text>';
  A.road.forEach(([p, t, a, b, d, gate], i) => {
    const y = 30 + i * 40, x = px(a), w = px(b + 1) - px(a);
    s += '<text x="0" y="' + (y + 12) + '" font-size="11" fill="#6F7C76" font-family="Geist Mono, monospace">' + esc(p.toUpperCase()) + '</text><text x="0" y="' + (y + 27) + '" font-size="13" fill="#EDF2EE">' + esc(t) + '</text>';
    s += '<rect class="grow" data-tip="' + esc(p + ' · ' + t + ' · ' + A.week + ' ' + a + (LANG === 'fr' ? ' à ' : ' to ') + b + ' · ' + d) + '" x="' + x + '" y="' + (y + 4) + '" width="' + w + '" height="22" rx="4" fill="' + (i === 2 ? '#5BC48D' : i === 0 ? 'rgba(91,196,141,.6)' : 'rgba(91,196,141,.28)') + '"/>';
    s += '<path data-tip="' + esc(A.gate + ' · ' + gate) + '" d="M' + (x + w) + ' ' + (y + 6) + 'l9 9-9 9-9-9z" fill="#C9A24B" stroke="#070A09" stroke-width="2"/>';
  });
  box.innerHTML = s + '</svg>';
  bindTips(box);
}
function bindTips(box) {
  const T = tip(box);
  box.addEventListener('pointermove', e => { const el = e.target.closest('[data-tip]'); if (!el) { T.classList.remove('on'); return; } placeTip(T, box, e.clientX, e.clientY, esc(el.dataset.tip)); });
  box.addEventListener('pointerleave', () => T.classList.remove('on'));
}
function flywheel(box) {
  const T = L().data, cx = 200, cy = 200, R = 132;
  const pos = [[cx, cy - R], [cx + R, cy], [cx, cy + R], [cx - R, cy]];
  let s = '<svg viewBox="0 0 400 400" role="img" aria-label="' + esc(T.flyH + ': ' + T.fly.join(', ')) + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#26332E" stroke-width="1.2"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#5BC48D" stroke-width="2" stroke-dasharray="60 770" stroke-linecap="round" class="fly-run"/>' +
    '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="15" fill="#EDF2EE" font-weight="600">AfriFarm</text><text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="11" fill="#6F7C76" font-family="Geist Mono, monospace">' + esc(T.flyH.toUpperCase()) + '</text>';
  T.fly.forEach((t, i) => {
    const [x, y] = pos[i];
    s += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#070A09" stroke="' + (i === 3 ? '#8FDDF5' : '#5BC48D') + '" stroke-width="1.6"/><text x="' + (x + (i === 1 ? -14 : i === 3 ? 14 : 0)) + '" y="' + (y + (i === 0 ? -16 : i === 2 ? 26 : 4)) + '" text-anchor="' + (i === 1 ? 'end' : i === 3 ? 'start' : 'middle') + '" font-size="12.5" fill="#AAB6B0">' + esc(t) + '</text>';
  });
  box.innerHTML = s + '</svg>';
}

/* ---------- Architecture ---------- */
const ARCH_COLS = [['weather', 'satellite', 'soil', 'crop', 'ops', 'markets', 'history'], ['ref', 'ml', 'expert', 'seasons'], ['analytics', 'ai', 'predict', 'optim'], ['plan', 'alerts', 'dash', 'api']];
const ARCH_LINKS = [['weather', 'ref'], ['weather', 'ml'], ['satellite', 'ml'], ['soil', 'ref'], ['soil', 'ml'], ['crop', 'ref'], ['ops', 'seasons'], ['markets', 'ml'], ['markets', 'seasons'], ['history', 'ml'], ['history', 'seasons'], ['ref', 'analytics'], ['ref', 'predict'], ['ml', 'ai'], ['ml', 'predict'], ['expert', 'predict'], ['expert', 'optim'], ['seasons', 'analytics'], ['seasons', 'ai'], ['analytics', 'dash'], ['analytics', 'api'], ['ai', 'plan'], ['ai', 'alerts'], ['predict', 'plan'], ['predict', 'alerts'], ['predict', 'dash'], ['optim', 'plan']];
let ARCH_SEL = 'plan';
function archHTML() {
  const A = L().arch, I = L().intel;
  return '<div class="arch" data-arch style="position:relative"><svg class="arch-links" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:1"></svg>' +
    ARCH_COLS.map((col, ci) => '<div class="arch-col" style="z-index:2"><div class="ch"><span>' + esc(I.cols[ci]) + '</span><span>0' + (ci + 1) + '</span></div>' +
      col.map(k => '<button type="button" class="node' + (ci === 1 ? ' engine' : '') + '" data-node="' + k + '" aria-pressed="' + (ARCH_SEL === k) + '">' + esc(A.nodes[k][0]) + '</button>').join('') +
      (ci === 3 ? '<p class="small faint" style="margin-top:6px">' + (LANG === 'fr' ? 'Agriculteurs · investisseurs · coopératives · prêteurs · institutions' : 'Farmers · investors · cooperatives · lenders · institutions') + '</p>' : '') + '</div>').join('') +
    '</div><div class="panel arch-detail" data-arch-detail aria-live="polite"></div>';
}
function archMount(root) {
  const box = $('[data-arch]', root), svg = $('.arch-links', box), det = $('[data-arch-detail]', root), A = L().arch;
  const related = k => { const up = new Set([k]), down = new Set([k]); let ch = true; while (ch) { ch = false; ARCH_LINKS.forEach(([a, b]) => { if (down.has(a) && !down.has(b)) { down.add(b); ch = true; } if (up.has(b) && !up.has(a)) { up.add(a); ch = true; } }); } return new Set([...up, ...down]); };
  function draw() {
    const br = box.getBoundingClientRect(); svg.setAttribute('viewBox', '0 0 ' + br.width + ' ' + br.height);
    const narrow = br.width < 560; const rel = related(ARCH_SEL);
    let s = '';
    if (!narrow) ARCH_LINKS.forEach(([a, b]) => {
      const ea = $('[data-node="' + a + '"]', box).getBoundingClientRect(), eb = $('[data-node="' + b + '"]', box).getBoundingClientRect();
      const on = rel.has(a) && rel.has(b);
      let d;
      if (eb.left > ea.right - 2) { const x1 = ea.right - br.left, y1 = ea.top + ea.height / 2 - br.top, x2 = eb.left - br.left, y2 = eb.top + eb.height / 2 - br.top, mx = (x1 + x2) / 2; d = 'M' + x1 + ' ' + y1 + 'C' + mx + ' ' + y1 + ' ' + mx + ' ' + y2 + ' ' + x2 + ' ' + y2; }
      else { const x1 = ea.left + ea.width / 2 - br.left, y1 = ea.bottom - br.top, x2 = eb.left + eb.width / 2 - br.left, y2 = eb.top - br.top, my = (y1 + y2) / 2; d = 'M' + x1 + ' ' + y1 + 'C' + x1 + ' ' + my + ' ' + x2 + ' ' + my + ' ' + x2 + ' ' + y2; }
      s += '<path d="' + d + '" fill="none" stroke="' + (on ? '#5BC48D' : '#1F2A26') + '" stroke-width="' + (on ? 1.6 : 1) + '"' + (on ? ' stroke-dasharray="4 5" class="flowline"' : '') + ' opacity="' + (on ? .95 : .9) + '"/>';
    });
    svg.innerHTML = s;
    $$('[data-node]', box).forEach(n => { n.style.opacity = rel.has(n.dataset.node) ? '1' : '.45'; n.setAttribute('aria-pressed', String(n.dataset.node === ARCH_SEL)); });
    const nd = A.nodes[ARCH_SEL];
    det.innerHTML = '<div><div class="fx-k">' + esc(L().intel.cols[ARCH_COLS.findIndex(c => c.includes(ARCH_SEL))]) + '</div><h4 style="margin-top:6px">' + esc(nd[0]) + '</h4><span class="badge ' + (nd[2] === 'MVP' ? 'real' : 'plan') + '" style="margin-top:10px">' + esc(A.rel + ' · ' + nd[2]) + '</span></div><p class="muted">' + esc(nd[1]) + '</p>';
  }
  box.addEventListener('click', e => { const n = e.target.closest('[data-node]'); if (!n) return; ARCH_SEL = n.dataset.node; draw(); analytics.track('arch_select', { node: ARCH_SEL }); });
  const ro = new ResizeObserver(() => draw()); ro.observe(box);
  draw();
  return () => ro.disconnect();
}
