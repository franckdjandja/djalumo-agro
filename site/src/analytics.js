/* ---------- Optional analytics providers (production build only) ----------
   Nothing loads unless AF_CONFIG.analytics is set at build time (ANALYTICS_PROVIDER, ANALYTICS_ID).
   Events already queued by core.js are replayed once a provider is attached. */
(function () {
  const A = CFG.analytics;
  if (!API_MODE || !A || !A.provider || !A.id) return;
  const load = (src, attrs) => { const s = D.createElement('script'); s.src = src; s.defer = true; Object.keys(attrs || {}).forEach(k => s.setAttribute(k, attrs[k])); D.head.appendChild(s); };
  if (A.provider === 'plausible') {
    load('https://plausible.io/js/script.manual.js', { 'data-domain': A.id });
    window.plausible = window.plausible || function () { (window.plausible.q = window.plausible.q || []).push(arguments); };
    analytics.use({ track: e => window.plausible(e.name === 'page_view' ? 'pageview' : e.name, { props: Object.assign({ lang: e.lang, page: e.page }, e.props) }) });
  } else if (A.provider === 'ga4') {
    load('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(A.id));
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', A.id, { send_page_view: false });
    analytics.use({ track: e => window.gtag('event', e.name, Object.assign({ language: e.lang, page_path: location.pathname }, e.props)) });
  }
})();
