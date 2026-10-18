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

/* ---------- Geographic intelligence map ---------- */
const MAP_STATE = { layers: { public: true, pilot: true, plan: true }, sel: CM_I };
function mapHTML() {
  const M = L().map;
  const opts = GEO.countries.map((c, i) => [i, cName(i)]).sort((a, b) => a[1].localeCompare(b[1], LANG))
    .map(([i, n]) => '<option value="' + i + '"' + (MAP_STATE.sel === i ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
  const layer = (k, label, sw) => '<button type="button" class="layer" data-layer="' + k + '" aria-pressed="' + MAP_STATE.layers[k] + '"><span class="sw" style="' + sw + '"></span><span class="lt">' + esc(label) + '</span><span class="tg" aria-hidden="true"></span></button>';
  return '<div class="mapwrap" id="map"><div class="map-stage" data-stage><div class="empty-out" style="position:absolute;inset:auto 16px 16px auto;border:0" data-loading><span class="mono small">' + esc(M.loading) + '</span></div></div>' +
    '<div class="map-side"><div><div class="fx-k" style="margin-bottom:10px">' + esc(M.layers) + '</div><div class="layers">' +
    layer('public', M.lPublic, 'background:rgba(43,122,143,.55)') + layer('pilot', M.lPilot, 'background:#127A5B') + layer('plan', M.lPlan, 'border:1px dashed #2B7A8F') +
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
    '<path data-l="public" d="' + dotsPath + '" fill="#2B7A8F" opacity=".22" pointer-events="none"/>' +
    '<g data-l="plan" pointer-events="none"><path d="' + arc(F, G.pts.kigali) + '" fill="none" stroke="#2B7A8F" stroke-width="1.4" stroke-dasharray="5 6" vector-effect="non-scaling-stroke" opacity=".85"/><path d="' + arc(F, G.pts.nairobi) + '" fill="none" stroke="#2B7A8F" stroke-width="1.4" stroke-dasharray="5 6" vector-effect="non-scaling-stroke" opacity=".85"/>' +
    [G.pts.kigali, G.pts.nairobi].map(p => '<circle data-r="5" cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="#FFFFFF" stroke="#2B7A8F" stroke-width="1.4" vector-effect="non-scaling-stroke"/>').join('') + '</g>' +
    '<g data-l="pilot" pointer-events="none"><circle data-r="16" cx="' + F[0] + '" cy="' + F[1] + '" r="16" fill="none" stroke="#127A5B" stroke-width="1.2" vector-effect="non-scaling-stroke"><animate attributeName="opacity" values=".9;0;.9" dur="2.4s" repeatCount="indefinite"/></circle><circle data-r="5.5" cx="' + F[0] + '" cy="' + F[1] + '" r="5.5" fill="#127A5B"/><text data-fs="13" x="' + (F[0] - 14) + '" y="' + (F[1] + 4) + '" text-anchor="end" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="13" fill="#0B231A" paint-order="stroke" stroke="#FFFFFF" stroke-width="4" stroke-linejoin="round">' + esc(M.pilotLabel) + '</text></g></svg>' +
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

/* ---------- Charts ---------- */
function landChart(box) {
  const T = L().data, W = 640, H = 236, X0 = 150, X1 = W - 70;
  const g1 = [[T.landA, 7.2, '#0D5C44'], [T.landB, 1.8, '#127A5B']], g2 = [[T.landC, 240, '#3F95AC'], [T.landD, 33, '#2B7A8F']];
  const grp = (y0, title, rows, max, unit) => {
    let s = '<text x="0" y="' + y0 + '" font-size="11" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif" letter-spacing=".08em">' + esc(title) + '</text>';
    rows.forEach(([lab, v, c], i) => {
      const y = y0 + 14 + i * 34, w = (X1 - X0) * v / max;
      s += '<text x="0" y="' + (y + 16) + '" font-size="13" fill="#3B564A">' + esc(lab) + '</text><rect x="' + X0 + '" y="' + y + '" width="' + (X1 - X0) + '" height="22" rx="4" fill="#EEF6F2"/><rect class="grow" data-tip="' + esc(lab + ' · ' + nf(v, v < 10 ? 1 : 0) + ' ' + unit) + '" x="' + X0 + '" y="' + y + '" width="' + w.toFixed(1) + '" height="22" rx="4" fill="' + c + '"/><text x="' + (X0 + w + 8) + '" y="' + (y + 16) + '" font-size="13" fill="#0B231A" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + (i === 1 && unit === 'k ha' ? '< ' : '') + nf(v, v < 10 ? 1 : 0) + '</text>';
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
    ['ERA5-Land', 1950, 2026, '#3F95AC', fr ? 'Réanalyse horaire, environ 9 km' : 'Hourly reanalysis, about 9 km'],
    ['FAOSTAT', 1961, 2026, '#0D5C44', fr ? 'Production et rendements par pays' : 'Production and yields by country'],
    ['NASA POWER', 1981, 2026, '#127A5B', fr ? 'Météo journalière' : 'Daily weather'],
    ['CHIRPS', 1981, 2026, '#9ACFDC', fr ? 'Pluie, environ 5 km' : 'Rainfall, about 5 km'],
    [fr ? 'Prix PAM Cameroun' : 'WFP prices, Cameroon', 2005, 2024, '#B0832A', fr ? 'Prix de marché, surtout au Nord' : 'Market prices, mainly northern regions'],
    ['Sentinel-2', 2015, 2026, '#2B7A8F', fr ? 'Indice de végétation des parcelles' : 'Vegetation index of plots'],
    ['Cam_Agri pilot', 2024.7, 2025.8, '#0B231A', fr ? 'Pilote terrain, 4 phases' : 'Field pilot, four phases'],
    [fr ? 'Journaux de saison' : 'AfriFarm season logs', 2027.2, 2028, 'plan', fr ? 'Prévu dès mars 2027' : 'Planned from March 2027']
  ];
  if (fr) rows[6][0] = 'Pilote Cam_Agri';
  const H = 30 + rows.length * 30 + 26;
  let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(T.covH) + '">';
  [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].forEach(y => { s += '<line x1="' + px(y) + '" x2="' + px(y) + '" y1="16" y2="' + (H - 22) + '" stroke="#D5E6DD"/><text x="' + px(y) + '" y="' + (H - 6) + '" font-size="11" text-anchor="middle" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + y + '</text>'; });
  s += '<line x1="' + px(2026.75) + '" x2="' + px(2026.75) + '" y1="10" y2="' + (H - 22) + '" stroke="#B0832A" stroke-dasharray="3 3"/><text x="' + (px(2026.75) - 4) + '" y="10" font-size="10" text-anchor="end" fill="#B0832A" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + (fr ? 'Aujourd’hui' : 'Today') + '</text>';
  rows.forEach(([lab, a, b, c, d], i) => {
    const y = 24 + i * 30; const w = Math.max(3, px(b) - px(a));
    s += '<text x="0" y="' + (y + 14) + '" font-size="12.5" fill="#3B564A">' + esc(lab) + '</text>';
    s += c === 'plan' ? '<rect class="grow" data-tip="' + esc(lab + ' · ' + d) + '" x="' + px(a) + '" y="' + (y + 2) + '" width="' + w + '" height="16" rx="3" fill="none" stroke="#2B7A8F" stroke-dasharray="3 3"/>'
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
  for (let w = 1; w <= WK + 1; w += 4) { const d = new Date(start.getTime() + (w - 1) * 7 * 864e5); s += '<line x1="' + px(w) + '" x2="' + px(w) + '" y1="22" y2="' + (H - 30) + '" stroke="#D5E6DD"/><text x="' + px(w) + '" y="' + (H - 16) + '" font-size="10.5" text-anchor="middle" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(A.week[0] + w) + '</text><text x="' + px(w) + '" y="' + (H - 3) + '" font-size="10" text-anchor="middle" fill="#8AA096" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(new Intl.DateTimeFormat(L().meta.locale, { day: 'numeric', month: 'short' }).format(d)) + '</text>'; }
  s += '<line x1="' + px(1) + '" x2="' + px(1) + '" y1="10" y2="' + (H - 30) + '" stroke="#B0832A" stroke-dasharray="3 3"/><text x="' + (px(1) + 4) + '" y="14" font-size="10" fill="#B0832A" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(A.now) + '</text>';
  A.road.forEach(([p, t, a, b, d, gate], i) => {
    const y = 30 + i * 40, x = px(a), w = px(b + 1) - px(a);
    s += '<text x="0" y="' + (y + 12) + '" font-size="11" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(p) + '</text><text x="0" y="' + (y + 27) + '" font-size="13" fill="#0B231A">' + esc(t) + '</text>';
    s += '<rect class="grow" data-tip="' + esc(p + ' · ' + t + ' · ' + A.week + ' ' + a + (LANG === 'fr' ? ' à ' : ' to ') + b + ' · ' + d) + '" x="' + x + '" y="' + (y + 4) + '" width="' + w + '" height="22" rx="4" fill="' + (i === 2 ? '#127A5B' : i === 0 ? 'rgba(18,122,91,.6)' : 'rgba(18,122,91,.28)') + '"/>';
    s += '<path data-tip="' + esc(A.gate + ' · ' + gate) + '" d="M' + (x + w) + ' ' + (y + 6) + 'l9 9-9 9-9-9z" fill="#B0832A" stroke="#FFFFFF" stroke-width="2"/>';
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
  let s = '<svg viewBox="0 0 400 400" role="img" aria-label="' + esc(T.flyH + ': ' + T.fly.join(', ')) + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#C0D7CB" stroke-width="1.2"/>' +
    '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="none" stroke="#127A5B" stroke-width="2" stroke-dasharray="60 770" stroke-linecap="round" class="fly-run"/>' +
    '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="15" fill="#0B231A" font-weight="600">AfriFarm</text><text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="11" fill="#667E73" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif">' + esc(T.flyH) + '</text>';
  T.fly.forEach((t, i) => {
    const [x, y] = pos[i];
    s += '<circle cx="' + x + '" cy="' + y + '" r="7" fill="#FFFFFF" stroke="' + (i === 3 ? '#2B7A8F' : '#127A5B') + '" stroke-width="1.6"/><text x="' + (x + (i === 1 ? -14 : i === 3 ? 14 : 0)) + '" y="' + (y + (i === 0 ? -16 : i === 2 ? 26 : 4)) + '" text-anchor="' + (i === 1 ? 'end' : i === 3 ? 'start' : 'middle') + '" font-size="12.5" fill="#3B564A">' + esc(t) + '</text>';
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
      s += '<path d="' + d + '" fill="none" stroke="' + (on ? '#127A5B' : '#D5E6DD') + '" stroke-width="' + (on ? 1.6 : 1) + '"' + (on ? ' stroke-dasharray="4 5" class="flowline"' : '') + ' opacity="' + (on ? .95 : .9) + '"/>';
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
