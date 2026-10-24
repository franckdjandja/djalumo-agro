/* ---------- PDF report request (dialog opened from the planner) ----------
   Sends the plan settings and the contact details to /api/report. Nothing is downloaded here: the requester confirms
   the address by email, the Djalumo Agro team approves, then the PDF is emailed. */
const REP_PROFILES = ['farmer', 'coop', 'investor', 'diaspora', 'student', 'other'];
const REP_STATE = { name: '', email: '', phone: '', profile: '', place: '', reportLang: '', consent: false };

function reportPlanOf(input) {
  const n = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
  return {
    capital: n(input.capital), currency: input.currency, mode: input.mode, area: n(input.area), crop: input.crop, product: input.product || null,
    water: input.water, start: input.start, land: input.land, market: input.market, familyLabour: n(input.familyLabour), ownTools: !!input.ownTools,
    priceXafKg: input.priceXafKg > 0 ? +input.priceXafKg : null, horizon: input.horizon ? +input.horizon : null
  };
}

function openReportDialog(input, plan) {
  const R = L().planner.report, F = L().form;
  const old = D.getElementById('rep-dlg'); if (old) old.remove();
  const dlg = D.createElement('dialog');
  dlg.id = 'rep-dlg'; dlg.className = 'rep-dlg'; dlg.setAttribute('aria-labelledby', 'rep-t');
  const crop = KB.crops[input.crop];
  const pi = typeof prodInfo === 'function' ? prodInfo(input.crop) : null;
  const sum = [tl(crop.name) + (crop.products && Object.keys(crop.products).length > 1 && pi && pi.label ? ', ' + tl(pi.label).toLowerCase() : ''), plan ? plArea(plan.areaHa) : '', plan ? fmtCur(input.mode === 'crop' ? plan.requiredXaf : plan.budget.total).replace(/<[^>]+>/g, '') : ''].filter(Boolean).join(' · ');
  const s = REP_STATE, lang0 = s.reportLang || LANG;
  const field = (id, label, input, req) => '<div class="f"><label for="rep-' + id + '">' + esc(label) + (req ? '<span class="req" aria-hidden="true">*</span>' : '') + '</label>' + input + '<p class="err" id="rep-' + id + '-err"></p></div>';
  const ts = API_MODE && CFG.turnstileSiteKey ? '<div data-rep-ts></div>' : '';
  dlg.innerHTML = '<form class="rep-f" novalidate data-rep><div class="rep-h"><h3 id="rep-t">' + esc(R.title) + '</h3><button type="button" class="rep-x" data-rep-close aria-label="' + esc(R.cancel) + '">×</button></div>' +
    '<p class="small muted">' + esc(R.intro) + '</p><p class="rep-sum">' + esc(sum) + '</p>' +
    '<div class="rep-g">' +
    field('name', R.name, '<input class="inp" id="rep-name" name="name" autocomplete="name" maxlength="100" required value="' + esc(s.name) + '">', 1) +
    field('email', R.email, '<input class="inp" id="rep-email" name="email" type="email" inputmode="email" autocapitalize="off" spellcheck="false" autocomplete="email" maxlength="254" required value="' + esc(s.email) + '">', 1) +
    field('phone', R.phone, '<input class="inp" id="rep-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" maxlength="30" value="' + esc(s.phone) + '">') +
    field('profile', R.profile, '<select class="inp" id="rep-profile" name="profile" required><option value="">' + esc(F.choose) + '</option>' + REP_PROFILES.map(p => '<option value="' + p + '"' + (s.profile === p ? ' selected' : '') + '>' + esc(R.profiles[p]) + '</option>').join('') + '</select>', 1) +
    field('place', R.place, '<input class="inp" id="rep-place" name="place" autocomplete="address-level2" maxlength="120" value="' + esc(s.place) + '">') +
    field('lang', R.lang, '<select class="inp" id="rep-lang" name="reportLang"><option value="fr"' + (lang0 === 'fr' ? ' selected' : '') + '>Français</option><option value="en"' + (lang0 === 'en' ? ' selected' : '') + '>English</option></select>') +
    '</div><div class="f"><label class="chk"><input type="checkbox" id="rep-consent" name="consent"' + (s.consent ? ' checked' : '') + '> <span>' + esc(R.consent).replace(/(privacy policy|politique de confidentialité)/, '<a href="#privacy">$1</a>') + '</span></label><p class="err" id="rep-consent-err"></p></div>' +
    ts + '<div class="hp" aria-hidden="true"><label for="rep-website">' + esc(F.hp) + '</label><input id="rep-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>' +
    '<p class="err" role="alert" data-rep-sum></p><div class="rep-foot"><button type="button" class="btn btn-ghost" data-rep-close>' + esc(R.cancel) + '</button><button type="submit" class="btn btn-primary" data-label="' + esc(R.send) + '">' + esc(R.send) + ARROW + '</button></div></form>';
  D.body.appendChild(dlg);
  const form = $('[data-rep]', dlg), mountedAt = Date.now();
  const close = () => { try { dlg.close(); } catch (e) { /* already closed */ } dlg.remove(); };
  dlg.addEventListener('click', e => { if (e.target.closest('[data-rep-close]') || e.target === dlg) close(); else if (e.target.closest('a[href]')) setTimeout(close, 0); });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });
  const tsBox = $('[data-rep-ts]', dlg);
  if (tsBox) loadTurnstile().then(t => { if (t && tsBox.isConnected) t.render(tsBox, { sitekey: CFG.turnstileSiteKey, language: LANG, size: 'flexible' }); }).catch(() => { /* the server decides */ });
  const read = () => {
    const fd = new FormData(form);
    s.name = clean(fd.get('name')); s.email = clean(fd.get('email')); s.phone = clean(fd.get('phone')); s.profile = clean(fd.get('profile'));
    s.place = clean(fd.get('place')); s.reportLang = fd.get('reportLang') === 'en' ? 'en' : 'fr'; s.consent = !!$('#rep-consent', form).checked;
    return { website: clean(fd.get('website')) };
  };
  const E = F.err;
  const check = () => {
    const errs = {};
    if (s.name.length < 2) errs.name = s.name ? E.min(2) : E.required;
    if (!s.email) errs.email = E.required; else if (!EMAIL_RE.test(s.email) || s.email.length > 254) errs.email = E.email;
    if (s.phone && !PHONE_RE.test(s.phone)) errs.phone = E.phone;
    if (!s.profile) errs.profile = E.required;
    if (s.place && s.place.length < 2) errs.place = E.min(2);
    if (!s.consent) errs.consent = E.consent;
    ['name', 'email', 'phone', 'profile', 'place', 'consent'].forEach(k => { const el = $('#rep-' + k + '-err', form), inp = $('#rep-' + k, form); if (el) el.textContent = errs[k] || ''; if (inp) { if (errs[k]) inp.setAttribute('aria-invalid', 'true'); else inp.removeAttribute('aria-invalid'); } });
    return Object.keys(errs);
  };
  form.addEventListener('input', () => { read(); });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const extra = read(), bad = check(), sumEl = $('[data-rep-sum]', form);
    if (bad.length) { sumEl.textContent = R.invalid; const f = $('#rep-' + bad[0], form); if (f) f.focus(); return; }
    sumEl.textContent = '';
    const btn = $('button[type="submit"]', form);
    const done = () => {
      form.innerHTML = '<div class="rep-h"><span></span><button type="button" class="rep-x" data-rep-close aria-label="' + esc(R.cancel) + '">×</button></div>' + resultHTML('ok', R.okT, R.okD, '<button type="button" class="btn btn-primary" data-rep-close>OK</button>');
      const res = $('.result', form); if (res) res.focus();
      analytics.track('report_request', { crop: input.crop });
    };
    if (extra.website || Date.now() - mountedAt < 2500) { done(); return; }
    btn.disabled = true; btn.setAttribute('aria-busy', 'true'); btn.innerHTML = '<span class="spin" aria-hidden="true"></span>' + esc(R.sending);
    const payload = { name: s.name, email: s.email.toLowerCase(), phone: s.phone || null, profile: s.profile, place: s.place || null, reportLang: s.reportLang, consent: true, plan: reportPlanOf(input), uiLanguage: LANG, website: '', elapsedMs: Date.now() - mountedAt };
    const tk = form.querySelector('[name="cf-turnstile-response"]'); if (tk && tk.value) payload.turnstileToken = tk.value;
    let res = null;
    try { res = await fetch(API_BASE + '/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload), credentials: APP ? 'omit' : 'same-origin' }); } catch (x) { res = null; }
    if (res && res.ok) { done(); return; }
    btn.disabled = false; btn.removeAttribute('aria-busy'); btn.innerHTML = esc(R.send) + ARROW;
    let j = {}; try { j = res ? await res.json() : {}; } catch (x) { /* empty */ }
    sumEl.textContent = res && res.status === 503 ? R.unavailable : res && res.status === 429 ? F.waitD : res && res.status === 403 ? F.challengeD : res && res.status === 422 ? R.invalid : R.errD;
    if (!res || res.status === 403 || res.status >= 500) webFallback(sumEl, 'planner');
    if (tsBox && window.turnstile) { try { window.turnstile.reset(tsBox); } catch (x) { /* gone */ } }
    analytics.track('report_error', { status: res ? res.status : 0, code: j.error || '' });
  });
  if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  const first = $('#rep-name', form); if (first) first.focus();
}
