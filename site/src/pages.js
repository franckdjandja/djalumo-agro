/* ---------- Page templates, router, chrome ---------- */
const NAV = ['planner', 'field', 'platform', 'intelligence', 'solutions', 'data', 'impact', 'about', 'contact'];
const ey = () => ''; // v4: no label or rule above titles
const head = (e, h, lead) => '<div class="sec-head rv"><h2 class="h2">' + esc(h) + '</h2>' + (lead ? '<p class="lead">' + esc(lead) + '</p>' : '<span></span>') + '</div>';
const sec = (inner, attrs) => '<section class="sec"' + (attrs || '') + '><div class="wrap">' + inner + '</div></section>';
const pageHero = (e, h, lead, extra) => '<section class="page-hero"><div class="wrap" style="position:relative"><h1 class="display" tabindex="-1">' + esc(h) + '</h1><p class="lead">' + esc(lead) + '</p>' + (extra || '') + '</div></section>';
const rel = (k) => { const B = L().badge; const m = { mvp: ['real', B.mvp], v2: ['plan', B.v2], v3: ['plan', B.v3], v4: ['plan', B.v4], grow: ['real', L().intel.grow] }[k]; return '<span class="badge ' + m[0] + '">' + esc(m[1]) + '</span>'; };
const table = (cols, rows, cls) => '<div class="tbl-wrap rv"><table class="tbl ' + (cls || '') + '"><thead><tr>' + cols.map(c => '<th scope="col">' + esc(c) + '</th>').join('') + '</tr></thead><tbody>' + rows.map(r => '<tr>' + r.map((c, i) => i === 0 ? '<td>' + c + '</td>' : '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
const ctaBand = () => { const H = L().home, C = L().cta; return sec('<div class="cta-band rv"><div><h2 class="h2" style="max-width:20ch">' + esc(H.cH) + '</h2><p class="lead" style="margin-top:16px">' + esc(H.cLead) + '</p></div><div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn-primary" href="#demo">' + esc(C.demo) + ARROW + '</a><a class="btn btn-ghost" href="#contact">' + esc(C.contact) + '</a></div></div>'); };
const nlBand = (id) => { const N = L().newsletter; return sec('<div class="nl rv"><div>' + ey(N.eyebrow) + '<h2 class="h2" style="margin-top:16px;font-size:clamp(26px,3vw,40px)">' + esc(N.h) + '</h2><p class="muted" style="margin-top:12px;max-width:52ch">' + esc(N.d) + '</p></div>' + formHTML('newsletter', id, { compact: true }) + '</div>'); };
const lazy = []; // [selector, mount] pairs mounted when near the viewport

const PAGES = {
  home: {
    html() {
      const H = L().home;
      const evidence = sec(fieldHomeHTML(), ' id="evidence"');
      const problem = sec(head(H.pEyebrow, H.pH, H.pLead) +
        '<div class="cols-5 rv">' + H.factors.map((f, i) => '<div><div class="fx-k">' + esc(f.k) + '</div><div class="fx-t">' + esc(f.t) + '</div><p class="fx-d">' + esc(f.d) + '</p><div class="fx-m"><b>' + esc(H.consequence) + '</b>' + esc(f.m) + '</div></div>').join('') + '</div>' +
        '<div class="stats rv">' + H.stats.map(s => '<div class="stat"><div class="v">' + esc(s.v) + '<small>' + esc(s.u) + '</small></div><div class="l">' + esc(s.l) + '</div></div>').join('') + '</div><p class="src">' + H.statsSrc + '</p>' +
        '<p class="close-line rv">' + esc(H.pClose) + '</p>');
      const how = sec(head(H.hEyebrow, H.hH, H.hLead) + '<div class="pipe rv"><span class="pulse" aria-hidden="true"></span>' + H.steps.map((s, i) => '<div class="st"><div class="n">' + (i + 1) + '</div><h3>' + esc(s.t) + '</h3><p>' + esc(s.d) + '</p></div>').join('') + '</div>');
      const sim = sec(head(H.sEyebrow, H.sH, H.sLead) + '<div class="panel planner home-planner" data-plroot>' + plannerFormHTML(true) + '<div class="planner-out" data-pout aria-live="polite"></div></div>', ' id="simulator"');
      const tiers = sec(head(H.tEyebrow, H.tH, H.tLead) + tiersHTML());
      return worldHeroHTML() + evidence + problem + how + sim + tiers + nlBand('nl-home') + ctaBand();
    },
    mount(root) {
      Router.cleanups.push(worldMount(root));
      Router.cleanups.push(plannerMount($('[data-plroot]', root), true));
      fieldHomeMount(root);
      const tf = $('[data-try]', root);
      tf.addEventListener('submit', e => {
        e.preventDefault();
        const raw = $('#try-amt', tf).value; const s = String(raw).replace(/[^\d.,]/g, '').replace(/[.,](?=\d{3}(\D|$))/g, '').replace(',', '.');
        PLAN.capital = Math.max(0, Math.min(1e12, parseFloat(s) || 0)); PLAN.currency = $('[data-try-cur]', tf).value;
        const a = $('#pl-cap', root), c = $('#pl-cur', root); if (a) a.value = nf(PLAN.capital); if (c) c.value = PLAN.currency;
        plannerRender($('[data-plroot]', root), true);
        const t = $('#simulator', root); t.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' });
        setTimeout(() => { const o = $('[data-pout]', root); if (o) { o.setAttribute('tabindex', '-1'); o.focus({ preventScroll: true }); } }, RM.matches ? 0 : 600);
        analytics.track('cta_click', { cta: 'hero_simulate', cur: PLAN.currency });
      });
    }
  },

  field: {
    html() { return fieldPageHTML(); },
    mount(root) { Router.cleanups.push(fieldPageMount(root)); }
  },

  planner: {
    html() {
      const P = L().planner;
      return pageHero(P.eyebrow, P.h1, P.lead) + sec('<div class="panel planner" data-plroot>' + plannerFormHTML(false) + '<div class="planner-out" data-pout aria-live="polite"></div></div>', ' id="plan"') + ctaBand();
    },
    mount(root) { Router.cleanups.push(plannerMount($('[data-plroot]', root), false)); }
  },

  platform: {
    html() {
      const P = L().platform, C = L().cta;
      return pageHero(P.eyebrow, P.h1, P.lead) +
        sec(head('01 · ' + P.eyebrow, P.waysH, P.currency) + '<div class="g2 rv">' + P.ways.map(w => '<div class="card" style="padding:28px"><div class="top"><span class="badge real">' + esc(w.k) + '</span></div><p class="quote">' + esc(w.q) + '</p><p style="margin-top:14px">' + esc(w.d) + '</p></div>').join('') + '</div><div style="margin-top:24px"><a class="btn btn-ghost" href="#home" data-to-sim>' + esc(C.sim) + ARROW + '</a></div>') +
        sec(head('02 · ' + P.planEyebrow, P.planH, P.planLead) + '<div class="plan-grid rv">' + P.plan.map(([t, d, live], i) => '<div><span class="lede-num">' + (i + 1) + '</span><div><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p></div>' + (live ? '<span class="badge real">' + esc(P.live) + '</span>' : '<span></span>') + '</div>').join('') + '</div>') +
        sec(head('03 · ' + P.prodEyebrow, P.prodH) + table(P.prodCols, P.products.map(r => ['<b>' + esc(r[0]) + '</b>', esc(r[1]), esc(r[2]), rel(r[3])]))) +
        sec(head('04 · ' + P.modEyebrow, P.modH) + '<div class="g3 rv">' + P.modules.map(([t, d, r], i) => '<div class="card"><div class="top"><span class="idx">M' + String(i + 1).padStart(2, '0') + '</span>' + rel(r) + '</div><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p></div>').join('') + '</div>') +
        sec(head('05 · ' + P.cycleEyebrow, P.cycleH) + '<div class="pipe c3 rv"><span class="pulse" aria-hidden="true"></span>' + P.cycle.map(([t, d], i) => '<div class="st"><div class="n">' + (i + 1) + '</div><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p></div>').join('') + '</div>') +
        sec(head('06 · ' + P.prinEyebrow, P.prinH) + '<div class="tiers rv">' + P.principles.map(([t, d]) => '<div><h3 style="font-size:19px">' + esc(t) + '</h3><p>' + esc(d) + '</p></div>').join('') + '</div>') +
        ctaBand();
    },
    mount(root) { const b = $('[data-to-sim]', root); if (b) b.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); Router.go('home', 'simulator'); }); }
  },

  intelligence: {
    html() {
      const I = L().intel;
      return pageHero(I.eyebrow, I.h1, I.lead) +
        sec(head('01 · ' + I.archEyebrow, I.archH, I.archLead) + '<div class="rv">' + archHTML() + '</div>') +
        sec(head('02 · ' + I.layersEyebrow, I.layersH) + table(I.layerCols, I.layers.map(r => ['<b>' + esc(r[0]) + '</b>', esc(r[1]), esc(r[2]), rel(r[3])]))) +
        sec(head('03 · ' + I.modelsEyebrow, I.modelsH) + table([LANG === 'fr' ? 'Modèle' : 'Model'].concat(I.modelCols), I.models.map((r, i) => ['<b>' + esc(I.modelNames[i]) + '</b>', esc(r[0]), esc(r[1]), esc(r[2]), esc(r[3])]))) +
        sec(head('04 · ' + I.xaiEyebrow, I.xaiH, I.xaiLead) + '<div class="xai rv"><div class="card" style="padding:26px"><div class="top"><span class="idx">' + esc(I.xaiCard) + '</span><span class="badge demo">' + esc(L().badge.demo) + '</span></div><div style="display:flex;align-items:center;gap:10px"><span style="width:10px;height:10px;border-radius:50%;background:var(--crit);box-shadow:0 0 0 5px rgba(226,106,82,.12)"></span><h3 style="font-size:22px">' + esc(I.xaiFlag) + '</h3></div><p style="font-size:17px;color:var(--fg);margin-top:14px;line-height:1.5">' + esc(I.xaiText) + '</p></div>' +
          '<div class="card" style="padding:26px"><div class="top"><span class="idx">' + esc(I.xaiDrivers) + '</span></div>' + I.drivers.map(([t, dir], i) => '<div class="drv"><span>' + esc(t) + '</span><span class="bar" title="' + esc(dir > 0 ? I.raises : I.lowers) + '"><i style="' + (dir > 0 ? 'left:50%;width:38%;background:var(--crit)' : 'right:50%;width:38%;background:var(--green)') + '"></i></span></div>').join('') + '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--fg-3);margin-top:8px" class="mono"><span>← ' + esc(I.lowers) + '</span><span>' + esc(I.raises) + ' →</span></div><p class="small faint" style="margin-top:14px">' + esc(I.xaiNote) + '</p></div></div>') +
        sec(head('05 · ' + I.paceEyebrow, I.paceH, I.paceLead) + '<div class="pipe c4 rv"><span class="pulse" aria-hidden="true"></span>' + I.pace.map(([t, d]) => '<div class="st"><div class="n">' + esc(t.charAt(0)) + '</div><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p></div>').join('') + '</div>') +
        sec(head('06 · ' + I.raiEyebrow, I.raiH) + '<ul class="list-check rv" style="max-width:720px">' + I.rai.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>') +
        ctaBand();
    },
    mount(root) { Router.cleanups.push(archMount(root)); }
  },

  solutions: {
    html() {
      const S = L().solutions;
      return pageHero(S.eyebrow, S.h1, S.lead) +
        sec(head('01 · ' + S.who, S.whoH) + '<div class="rv"><div class="tabs" role="tablist" aria-label="' + esc(S.who) + '">' + S.personas.map((p, i) => '<button type="button" role="tab" id="tab-' + i + '" aria-controls="persona" aria-selected="' + (i === 0) + '" tabindex="' + (i === 0 ? 0 : -1) + '" data-p="' + i + '">' + esc(p[0]) + '</button>').join('') + '</div><div id="persona" role="tabpanel" aria-labelledby="tab-0" data-persona>' + personaHTML(0) + '</div></div>') +
        sec(head('02 · ' + S.tiersEyebrow, S.tiersH) + tiersHTML()) +
        sec(head('03 · ' + S.posEyebrow, S.posH) + table(S.posCols, S.pos.map(r => ['<span class="faint mono small">' + esc(r[0]) + '</span>', esc(r[1]), esc(r[2]), '<b style="color:var(--fg)">' + esc(r[3]) + '</b>']))) +
        ctaBand();
    },
    mount(root) {
      const tabs = $$('[role="tab"]', root), panel = $('[data-persona]', root);
      const sel = (i, focus) => { tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; }); panel.innerHTML = personaHTML(i); panel.setAttribute('aria-labelledby', 'tab-' + i); if (focus) tabs[i].focus(); analytics.track('persona_select', { persona: I18N.en.solutions.personas[i][0] }); };
      tabs.forEach((t, i) => { t.addEventListener('click', () => sel(i)); t.addEventListener('keydown', e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); sel((i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length, true); } }); });
    }
  },

  data: {
    html() {
      const T = L().data;
      return pageHero(T.eyebrow, T.h1, T.lead) +
        sec(head('01 · ' + T.landEyebrow, T.landH, T.landLead) + '<div class="g2"><div class="panel rv" style="padding:22px"><div class="blk-t"><h4>' + esc(T.landEyebrow) + ' · Cameroon</h4><span class="badge real">' + esc(L().badge.real) + '</span></div><div class="chart-box nomin rv" data-land></div><p class="src" style="margin-top:12px">' + esc(T.landSrc) + '</p></div>' +
          '<div class="panel rv" style="padding:22px"><div class="blk-t"><h4>' + esc(T.covEyebrow) + '</h4><span class="badge real">' + esc(L().badge.real) + '</span></div><div class="chart-box nomin rv" data-cov></div><p class="src" style="margin-top:12px">' + esc(T.covNote) + '</p></div></div>' +
          '<p class="muted" style="margin-top:20px;max-width:70ch">' + esc(T.covLead) + '</p>') +
        sec(head('02 · ' + T.srcEyebrow, T.srcH) + table(T.srcCols, T.sources.map(r => ['<b>' + esc(r[0]) + '</b>', r[2] ? '<a href="' + esc(r[2]) + '" target="_blank" rel="noopener">' + esc(r[1]) + ' ↗</a>' : esc(r[1]), esc(r[3]), '<span class="small">' + esc(r[4]) + '</span>']))) +
        sec(head('03 · ' + T.propEyebrow, T.propH) + '<div class="duo"><div class="lessons rv">' + T.prop.map(([t, d], i) => '<div class="lesson" style="grid-template-columns:40px 1fr"><span class="lede-num">' + (i + 1) + '</span><div class="p"><b>' + esc(t) + '</b>' + esc(d) + '</div></div>').join('') + '</div><div class="panel rv" style="padding:18px"><div class="chart-box nomin" data-fly></div><p class="small muted" style="padding:0 6px 6px">' + esc(T.flyNote) + '</p></div></div>') +
        sec(head('04 · ' + T.govEyebrow, T.govH) + '<ul class="list-check rv" style="max-width:720px">' + T.gov.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>') +
        sec(head('05 · ' + T.mapEyebrow, L().home.mH, L().home.mLead) + '<div class="rv">' + mapHTML() + '</div>') +
        nlBand('nl-data') + ctaBand();
    },
    mount(root) { landChart($('[data-land]', root)); coverageChart($('[data-cov]', root)); flywheel($('[data-fly]', root)); lazy.push(['#map', el => Router.cleanups.push(mapMount(el))]); }
  },

  impact: {
    html() {
      const I = L().impact;
      return pageHero(I.eyebrow, I.h1, I.lead) +
        sec(head('01 · ' + I.kpiEyebrow, I.kpiH) + '<div class="g3 rv">' + I.kpis.map(([t, d, p], i) => '<div class="card"><div class="top"><span class="idx">KPI ' + String(i + 1).padStart(2, '0') + '</span><span class="badge plan">' + esc(L().badge.plan) + '</span></div><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p><p class="small faint" style="margin-top:14px;padding-top:12px;border-top:1px dashed var(--line-2)">' + esc(p) + '<br><span class="mono" style="font-size:11px;letter-spacing:.06em">' + esc(I.kpiBase) + '</span></p></div>').join('') + '</div>') +
        sec(head('02 · ' + I.pilotEyebrow, I.pilotH, I.pilotLead) + phasesHTML()) +
        sec(head('03 · ' + I.lessonsEyebrow, I.lessonsH) + '<div class="lessons rv">' + I.lessons.map(([a, b, c]) => '<div class="lesson"><div class="p"><b>' + esc(a) + '</b>' + esc(b) + '</div><div class="ar" aria-hidden="true">→</div><div class="r"><small>' + esc(I.req) + '</small>' + esc(c) + '</div></div>').join('') + '</div>') +
        sec(head('04 · ' + I.photosEyebrow, I.photosH) + '<div class="ev rv">' + I.photos.map(([im, t, d]) => '<figure>' + img(im, t + '. ' + d) + '<figcaption><b>' + esc(t) + '</b>' + esc(d) + '</figcaption></figure>').join('') + '</div>' +
          '<div style="margin-top:20px"><a class="btn btn-ghost" href="#field">' + esc(I.fieldLink) + ARROW + '</a></div>' +
          '<div class="panel rv" style="padding:clamp(22px,3vw,36px);margin-top:28px"><div class="fx-k">' + esc(I.goalH) + '</div><p style="font-size:clamp(17px,1.6vw,21px);line-height:1.55;margin-top:12px;max-width:68ch">' + esc(I.goal) + '</p></div>') +
        ctaBand();
    }
  },

  about: {
    html() {
      const A = L().about;
      return pageHero(A.eyebrow, A.h1, A.lead) +
        sec('<div class="founder"><figure class="rv">' + img('founder-tomato', A.photoAlt) + '</figure><div class="rv">' + ey(A.leadEyebrow) + '<h2 class="h2" style="margin-top:16px">' + esc(A.name) + '</h2><div class="titles">' + A.titles.map(t => '<span>' + esc(t) + '</span>').join('') + '</div><p class="small faint" style="margin-top:14px">' + esc(A.base) + '</p><div class="stack" style="--s:16px;margin-top:28px">' + A.story.map(p => '<p class="muted" style="font-size:16.5px">' + esc(p) + '</p>').join('') + '</div></div></div>') +
        sec(head('01 · ' + A.convEyebrow, A.convH) + '<div class="tiers rv">' + A.conv.map(([t, d]) => '<div><h3 style="font-size:19px">' + esc(t) + '</h3><p>' + esc(d) + '</p></div>').join('') + '</div>') +
        sec(head('02 · ' + A.mileEyebrow, A.mileH) + '<div class="duo"><div class="mile rv">' + A.miles.map((m, i) => '<div class="' + (i === A.miles.length - 1 ? 'now' : '') + '"><div class="d">' + esc(m[0]) + '</div><h4>' + esc(m[1]) + '</h4><p>' + esc(m[2]) + '</p></div>').join('') + '</div><figure class="rv" style="aspect-ratio:auto">' + img('father-2021', A.miles[0][1] + ', ' + A.miles[0][0]) + '<figcaption class="small faint" style="padding:10px 12px">' + esc(A.miles[0][0] + ' · ' + A.miles[0][1]) + '</figcaption></figure></div>') +
        sec(head('03 · ' + A.roadEyebrow, A.roadH, A.roadLead) + '<div class="panel rv" style="padding:20px"><div class="chart-box" data-road></div><p class="small faint" style="margin-top:10px">' + esc(A.roadHl) + '</p></div><div class="road rv" style="margin-top:12px">' + A.road.map(([p, t, a, b, d, g], i) => '<div class="' + (i === 0 ? 'now' : '') + '"><div class="w">' + esc(p + ' · ' + A.week + ' ' + a + (LANG === 'fr' ? ' à ' : ' to ') + b) + '</div><h3>' + esc(t) + '</h3><p>' + esc(d) + '</p><div class="gate"><b>' + esc(A.gate) + '</b>' + esc(g) + '</div></div>').join('') + '</div>') +
        sec(head('04 · ' + A.expEyebrow, A.expH) + table(A.expCols, A.exp.map(r => ['<b>' + esc(r[0]) + '</b>', esc(r[1]), esc(r[2]), esc(r[3])])) +
          '<div class="panel rv refbox" data-ref><div><div class="fx-k">' + esc(A.refH) + '</div><div style="font-size:clamp(30px,3vw,42px);font-weight:600;letter-spacing:-.035em;margin-top:8px" class="tnum">≥ 100k <small style="font-size:.45em;color:var(--fg-3)">USD</small></div></div><p class="muted">' + esc(A.ref) + '</p></div>') +
        ctaBand();
    },
    mount(root) { roadChart($('[data-road]', root)); }
  },

  contact: {
    html() {
      const C = L().contact;
      return pageHero(C.eyebrow, C.h1, C.lead) + sec('<div class="form-wrap"><div class="rv">' + formHTML('contact', 'f-contact') + '</div><aside class="aside rv"><div class="card"><h3>' + esc(C.nextH) + '</h3><ul class="list-check" style="margin-top:14px">' + C.next.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div><div class="card"><h3>' + esc(C.whereH) + '</h3><dl class="kv" style="display:grid;grid-template-columns:auto 1fr;gap:8px 14px;margin:14px 0 0;font-size:14px">' + C.where.map(([k, v]) => '<dt class="faint mono" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding-top:2px">' + esc(k) + '</dt><dd style="margin:0" class="muted">' + esc(v) + '</dd>').join('') + '</dl></div><div class="card"><h3>' + esc(C.demoH) + '</h3><p>' + esc(C.demoD) + '</p><a class="btn btn-ghost btn-sm" style="margin-top:14px" href="#demo">' + esc(L().cta.demo) + ARROW + '</a></div></aside></div>');
    },
    mount(root) { bindForm($('#f-contact', root)); }
  },

  demo: {
    html() {
      const M = L().demo;
      return pageHero(M.eyebrow, M.h1, M.lead) + sec('<div class="form-wrap"><div class="rv">' + formHTML('demo', 'f-demo') + '</div><aside class="aside rv"><div class="card"><h3>' + esc(M.coversH) + '</h3><ul class="list-check" style="margin-top:14px">' + M.covers.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div><div class="card"><h3>' + esc(M.stageH) + '</h3><p>' + esc(M.stage) + '</p></div><figure class="rv crop43" style="margin:0;border-radius:12px;overflow:hidden;border:1px solid var(--line)">' + img('relaunch-field', LANG === 'fr' ? 'Champ de concombre en croissance, relance du site principal, 2025' : 'Cucumber field in growth, relaunch of the main site, 2025') + '</figure></aside></div>');
    },
    mount(root) { bindForm($('#f-demo', root)); }
  },

  newsletter: {
    html() {
      const N = L().nl;
      return pageHero(N.eyebrow, N.h1, N.lead) + sec('<div class="form-wrap"><div class="rv">' + formHTML('newsletter', 'nl-page') + '</div><aside class="aside rv"><div class="card"><h3>' + esc(N.getH) + '</h3><ul class="list-check" style="margin-top:14px">' + N.get.map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div><div class="card"><h3>' + esc(N.privH) + '</h3><p>' + esc(N.priv) + '</p></div></aside></div>');
    },
    mount(root) { bindForm($('#nl-page', root)); }
  },

  privacy: { html() { return legal(L().privacy); } },
  terms: { html() { return legal(L().terms); } },

  admin: {
    html() { const A = L().admin; return pageHero('Admin', A.h1, A.lead) + sec('<div data-admin><p class="mono small faint">' + esc(A.loading) + '…</p></div>'); },
    mount(root) { adminMount($('[data-admin]', root)); }
  },

  nf: {
    html() {
      const N = L().nf;
      return '<section class="wrap nf"><div class="nf code mono" style="min-height:0;padding:0">' + esc(N.code) + '</div><svg class="wave" viewBox="0 0 520 60" aria-hidden="true"><path d="M0 30 H170 L180 28 L186 34 L192 26 L198 31 H260" fill="none" stroke="#127A5B" stroke-width="1.6"/><path d="M260 30 H520" fill="none" stroke="#C0D7CB" stroke-width="1.6" stroke-dasharray="3 6"/><circle cx="260" cy="30" r="4" fill="#B0402D"/></svg><h1 class="display" tabindex="-1" style="font-size:clamp(44px,7vw,96px)">' + esc(N.h1) + '</h1><p class="lead">' + esc(N.lead) + '</p><div><a class="btn btn-primary" href="#home">' + esc(L().cta.back) + ARROW + '</a></div></section>';
    }
  }
};

function tiersHTML() { return '<div class="tiers rv">' + L().tiers.map(t => '<div><div class="rng">' + esc(t.r) + '</div><h3>' + esc(t.n) + '</h3><p>' + esc(t.d) + '</p><div class="who">' + esc(t.w) + '</div></div>').join('') + '</div>'; }
function phasesHTML() {
  return '<div class="phases rv">' + L().ev.map((e, i) => '<article class="ph">' + img(e.img, e.t + '. ' + e.p) + '<div class="b"><div class="d">' + esc(e.p) + '</div><h3>' + esc(e.t) + '</h3><p>' + esc(e.d) + '</p><div class="res"><i style="background:' + (i === 3 ? 'var(--crit)' : 'var(--warn)') + '"></i>' + esc(e.r) + '</div></div></article>').join('') + '</div>';
}
function personaHTML(i) {
  const S = L().solutions, p = S.personas[i];
  return '<div class="persona"><div><div class="k">' + esc(S.need) + '</div><p>' + esc(p[1]) + '</p></div><div><div class="k">' + esc(S.value) + '</div><p>' + esc(p[2]) + '</p></div><div><div class="k">' + esc(S.model) + '</div><p>' + esc(p[3]) + '</p></div></div><div class="panel" style="margin-top:12px;padding:clamp(20px,3vw,32px)"><div class="fx-k">' + esc(S.ask) + '</div><p class="quote" style="margin-top:10px">“' + esc(p[4]) + '”</p></div>';
}
function legal(P) { return pageHero('', P.h1, P.updated) + sec('<div class="prose">' + P.body.map(([h, t]) => '<h2>' + esc(h) + '</h2><p>' + esc(t) + '</p>').join('') + '</div>'); }

async function adminMount(box) {
  const A = L().admin;
  await capReady;
  if (!CAP.owner || !CAP.db) { box.innerHTML = '<div class="panel result pre"><div class="ic">!</div><h3>' + esc(A.denied) + '</h3></div>'; return; }
  let tab = 'inquiries';
  const sub = { inquiries: 'items', demoRequests: 'items', subscribers: 'emails' };
  async function load() {
    box.innerHTML = '<div class="tabs" role="tablist">' + Object.keys(A.tabs).map(k => '<button role="tab" aria-selected="' + (k === tab) + '" data-t="' + k + '">' + esc(A.tabs[k]) + '</button>').join('') + '<button class="btn btn-ghost btn-sm" data-refresh style="margin-left:auto">' + esc(A.refresh) + '</button></div><div data-rows><p class="mono small faint"><span class="spin" style="display:inline-block;vertical-align:-3px;margin-right:8px"></span>' + esc(A.loading) + '</p></div>';
    const rowsEl = $('[data-rows]', box);
    try {
      const parents = await CAP.db.collection(tab).get();
      const all = [];
      for (const p of parents.docs) {
        const s = await CAP.db.collection(tab + '/' + p.id + '/' + sub[tab]).orderBy('createdAt', 'desc').limit(200).get();
        s.docs.forEach(d => all.push({ path: tab + '/' + p.id + '/' + sub[tab] + '/' + d.id, d: d.data() || {} }));
      }
      all.sort((a, b) => String(b.d.createdAt).localeCompare(String(a.d.createdAt)));
      if (!all.length) { rowsEl.innerHTML = '<p class="empty-out">' + esc(A.empty) + '</p>'; return; }
      const cols = tab === 'subscribers' ? ['email', 'language', 'status'] : tab === 'demoRequests' ? ['name', 'email', 'organization', 'countryName', 'role', 'interest', 'contactMethod', 'phone', 'message'] : ['name', 'email', 'organization', 'countryName', 'subject', 'phone', 'message'];
      rowsEl.innerHTML = '<div class="tbl-wrap"><table class="tbl admin-tbl"><thead><tr><th>' + esc(A.date) + '</th>' + cols.map(c => '<th>' + esc(c) + '</th>').join('') + (tab === 'subscribers' ? '' : '<th>' + esc(A.status) + '</th>') + '</tr></thead><tbody>' +
        all.map((r, i) => '<tr><td class="mono small">' + esc(String(r.d.createdAt || '').replace('T', ' ').slice(0, 16)) + '</td>' + cols.map(c => '<td' + (c === 'message' ? ' class="msg"' : '') + '>' + esc(r.d[c] == null ? '' : r.d[c]) + '</td>').join('') + (tab === 'subscribers' ? '' : '<td><select class="inp" style="min-height:34px;padding:6px 30px 6px 8px;font-size:13px" data-i="' + i + '" aria-label="' + esc(A.status) + '">' + A.statuses.map(s => '<option' + (r.d.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></td>') + '</tr>').join('') + '</tbody></table></div>';
      $$('select[data-i]', rowsEl).forEach(s => s.addEventListener('change', async () => { const r = all[+s.dataset.i]; s.disabled = true; try { await CAP.db.doc(r.path).update({ status: s.value, updatedAt: new Date().toISOString() }); } catch (e) { s.value = r.d.status; } s.disabled = false; }));
    } catch (e) { rowsEl.innerHTML = '<p class="empty-out">' + esc(A.error) + '</p>'; }
  }
  box.addEventListener('click', e => { const t = e.target.closest('[data-t]'); if (t) { tab = t.dataset.t; load(); } if (e.target.closest('[data-refresh]')) load(); });
  load();
}

/* ---------- Chrome ---------- */
function headerHTML() {
  const N = L().nav;
  return '<a class="skip" href="#main" data-skip>' + esc(N.skip) + '</a><header class="hdr"><div class="wrap hdr-in"><a class="brand" href="#home" aria-label="Djanova Agro">' + LOGO + '<span class="brand-sub">Agro</span></a>' +
    '<nav class="nav" aria-label="Primary">' + NAV.map(k => '<a href="#' + k + '" data-nav="' + k + '">' + esc(N[k]) + '</a>').join('') + '</nav>' +
    '<div class="hdr-tools"><div class="lang" role="group" aria-label="' + esc(N.lang) + '"><button type="button" data-lang="en" aria-pressed="' + (LANG === 'en') + '" lang="en">EN</button><button type="button" data-lang="fr" aria-pressed="' + (LANG === 'fr') + '" lang="fr">FR</button></div>' +
    '<a class="btn btn-primary btn-sm hdr-cta" href="#demo" data-cta="header_demo">' + esc(N.demo) + '</a><button type="button" class="menu-btn" aria-expanded="false" aria-controls="sheet" aria-label="' + esc(N.menu) + '" data-menu><span></span></button></div></div></header>' +
    '<div class="sheet" id="sheet" role="dialog" aria-modal="true" aria-label="' + esc(N.menu) + '" hidden><div class="sheet-top"><a class="brand" href="#home" aria-label="Djanova Agro">' + LOGO + '<span class="brand-sub">Agro</span></a><button type="button" class="btn btn-ghost btn-sm" data-close>' + esc(N.close) + '</button></div>' +
    ['home'].concat(NAV, ['newsletter']).map((k, i) => '<a class="sl" href="#' + k + '"><span>' + esc(N[k]) + '</span><span class="mono">' + String(i + 1).padStart(2, '0') + '</span></a>').join('') +
    '<a class="btn btn-primary" href="#demo">' + esc(N.demo) + ARROW + '</a><div class="lang" role="group" aria-label="' + esc(N.lang) + '" style="align-self:flex-start;margin-top:12px"><button type="button" data-lang="en" aria-pressed="' + (LANG === 'en') + '">EN</button><button type="button" data-lang="fr" aria-pressed="' + (LANG === 'fr') + '">FR</button></div></div>';
}
function footerHTML() {
  const F = L().footer, N = L().nav;
  const col = (h, ks) => '<div><h5>' + esc(h) + '</h5><ul>' + ks.map(k => '<li><a href="#' + k + '">' + esc(N[k] || L().meta.pages[k]) + '</a></li>').join('') + '</ul></div>';
  return '<footer class="ftr"><div class="wrap"><div class="ftr-grid"><div><a class="brand" href="#home" aria-label="Djanova Agro">' + LOGO + '<span class="brand-sub">Agro</span></a><p class="muted small" style="margin-top:16px;max-width:34ch">' + esc(F.tag) + '</p><div class="status-row" style="margin-top:18px"><span class="chip ok"><i></i>' + esc(F.status) + '</span></div></div>' +
    col(F.cols[0], ['planner', 'field', 'platform', 'intelligence', 'data']) + col(F.cols[1], ['solutions', 'impact', 'about']) + col(F.cols[2], ['contact', 'demo', 'newsletter']) +
    '<div><h5>' + esc(F.nlH) + '</h5><div class="nl-foot">' + formHTML('newsletter', 'nl-foot', { compact: true }) + '</div></div></div>' +
    '<div class="ftr-bot"><span>' + esc(F.rights) + '</span><span>' + esc(F.place) + ' · ' + esc(F.noTrack) + ' · <a href="#privacy">' + esc(L().meta.pages.privacy) + '</a> · <a href="#terms">' + esc(L().meta.pages.terms) + '</a></span></div></div></footer>';
}

/* Routing: hash tokens in the artifact preview, clean paths (/platform) in production for SEO. */
const routeOf = (href) => { if (!href) return null; const t = href.replace(/^#/, '').replace(/^\/+|\/+$/g, '').replace(/\.html$/, '').replace(/^index$/, ''); const k = t === '' ? 'home' : t; return (PAGES[k] && k !== 'nf') ? k : null; };
const pathOf = (k) => k === 'home' ? '/' : '/' + k;
function linkify(root) { if (!API_MODE) return; $$('a[href^="#"]', root).forEach(a => { const k = routeOf(a.getAttribute('href')); if (k) a.setAttribute('href', pathOf(k)); }); }
const Router = {
  current: null, cleanups: [],
  go(page, anchor) {
    if (API_MODE) { Router.pendingAnchor = anchor; if (location.pathname !== pathOf(page)) history.pushState(null, '', pathOf(page)); Router.render(false); return; }
    if (location.hash !== '#' + page) { Router.pendingAnchor = anchor; location.hash = page; } else if (anchor) { const t = D.getElementById(anchor); if (t) t.scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth' }); } },
  render(initial, keepScroll) {
    const raw = API_MODE ? (location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '').replace(/^index$/, '') || 'home') : (location.hash || '#home').slice(1).split(/[?&]/)[0];
    if (!API_MODE && raw === 'main') { const m = D.getElementById('main'); if (m) m.focus(); history.replaceState(null, '', '#' + (Router.current || 'home')); return; }
    const key = raw === '' ? 'home' : (PAGES[raw] && raw !== 'nf' ? raw : 'nf');
    Router.cleanups.forEach(f => { try { f && f(); } catch (e) { /* cleanup */ } }); Router.cleanups = []; lazy.length = 0;
    Router.current = key;
    const main = D.getElementById('main'), P = PAGES[key];
    const y = window.scrollY;
    main.innerHTML = '<div class="page" data-page="' + key + '">' + P.html() + '</div>';
    const root = main.firstChild;
    if (P.mount) P.mount(root);
    // newsletter bands
    $$('form.nlf', root).forEach(f => bindForm(f, { compact: true }));
    D.title = key === 'home' ? L().meta.title : L().meta.pages[key] + ' · Djanova Agro';
    linkify(root);
    const canon = $('link[rel="canonical"]'); if (canon && CFG.siteUrl) canon.setAttribute('href', CFG.siteUrl.replace(/\/$/, '') + (key === 'nf' ? '/' : pathOf(key)));
    $$('[data-nav]').forEach(a => { if (a.dataset.nav === key) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    reveal(root); mountLazy();
    if (keepScroll) window.scrollTo(0, y);
    else if (Router.pendingAnchor) { const t = D.getElementById(Router.pendingAnchor); Router.pendingAnchor = null; if (t) { window.scrollTo({ top: 0, behavior: 'instant' }); setTimeout(() => t.scrollIntoView({ behavior: 'instant', block: 'start' }), 30); } }
    else if (!initial) window.scrollTo(0, 0);
    if (!initial && !keepScroll) { const h = $('h1', root); if (h) h.focus({ preventScroll: true }); }
    analytics.track('page_view', { page: key });
  }
};

let revealIO = null;
function reveal(root) {
  if (revealIO) revealIO.disconnect();
  const els = $$('.rv', root);
  if (!('IntersectionObserver' in window)) return;
  const vh = window.innerHeight;
  revealIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pre'); revealIO.unobserve(e.target); } }), { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
  els.forEach(el => { if (el.getBoundingClientRect().top > vh * 0.92) { el.classList.add('pre'); revealIO.observe(el); } });
}
let lazyIO = null;
function mountLazy() {
  if (lazyIO) lazyIO.disconnect();
  const items = lazy.slice();
  const run = (el, fn) => { if (el.dataset.mounted) return; el.dataset.mounted = '1'; fn(el); };
  if (!('IntersectionObserver' in window)) { items.forEach(([s, fn]) => { const el = $(s); if (el) run(el, fn); }); return; }
  lazyIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { const it = items.find(x => $(x[0]) === e.target); if (it) run(e.target, it[1]); lazyIO.unobserve(e.target); } }), { rootMargin: '400px 0px' });
  items.forEach(([s]) => { const el = $(s); if (el) lazyIO.observe(el); });
}

function renderChrome() {
  D.documentElement.lang = LANG;
  const md = $('meta[name="description"]'); if (md) md.setAttribute('content', L().meta.desc);
  $('#chrome-top').innerHTML = headerHTML();
  $('#chrome-bottom').innerHTML = footerHTML();
  $$('form.nlf', $('#chrome-bottom')).forEach(f => bindForm(f, { compact: true }));
  linkify($('#chrome-top')); linkify($('#chrome-bottom'));
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === Router.current) a.setAttribute('aria-current', 'page'); });
}
function setLang(l) {
  if (l === LANG) return; LANG = l; store.set('af.lang', l);
  closeSheet(); renderChrome(); Router.render(false, true);
  analytics.track('language_change', { lang: l });
}
let lastFocus = null;
function openSheet() {
  const s = $('#sheet'), b = $('[data-menu]'); lastFocus = D.activeElement; s.hidden = false; b.setAttribute('aria-expanded', 'true'); D.body.style.overflow = 'hidden';
  const f = $('a,button', s); if (f) f.focus();
}
function closeSheet() {
  const s = $('#sheet'); if (!s || s.hidden) return; s.hidden = true; const b = $('[data-menu]'); if (b) b.setAttribute('aria-expanded', 'false'); D.body.style.overflow = '';
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}
function boot() {
  D.documentElement.classList.add('js');
  renderChrome();
  D.addEventListener('click', e => {
    const lb = e.target.closest('[data-lang]'); if (lb) { setLang(lb.dataset.lang); return; }
    if (e.target.closest('[data-menu]')) { openSheet(); return; }
    if (e.target.closest('[data-close]')) { closeSheet(); return; }
    const sk = e.target.closest('[data-skip]'); if (sk) { e.preventDefault(); const m = D.getElementById('main'); m.focus(); return; }
    if (API_MODE) {
      const ia = e.target.closest('a[href]');
      if (ia && !ia.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
        const k = routeOf(ia.getAttribute('href'));
        if (k) { e.preventDefault(); if ($('#sheet') && !$('#sheet').hidden) closeSheet(); if (ia.dataset.cta) analytics.track('cta_click', { cta: ia.dataset.cta }); if (k === Router.current) window.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }); else Router.go(k); return; }
      }
    }
    const a = e.target.closest('a[href^="#"]');
    if (a) {
      if ($('#sheet') && !$('#sheet').hidden) closeSheet();
      if (a.dataset.cta) analytics.track('cta_click', { cta: a.dataset.cta });
      if (a.getAttribute('href') === location.hash || (a.getAttribute('href') === '#home' && !location.hash)) { e.preventDefault(); window.scrollTo({ top: 0, behavior: RM.matches ? 'auto' : 'smooth' }); }
    }
  });
  D.addEventListener('keydown', e => {
    const s = $('#sheet');
    if (e.key === 'Escape' && s && !s.hidden) closeSheet();
    if (e.key === 'Tab' && s && !s.hidden) { const f = $$('a,button', s); const first = f[0], last = f[f.length - 1]; if (e.shiftKey && D.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && D.activeElement === last) { e.preventDefault(); first.focus(); } }
  });
  if (API_MODE) window.addEventListener('popstate', () => Router.render(false));
  else window.addEventListener('hashchange', () => Router.render(false));
  Router.render(true);
}
boot();
