// Number, money, date and area formatting for the PDF report (English or French).
// Thin spaces are replaced by no break spaces (the report font has no narrow space) and the minus sign is U+2212.

export function formatter(lang, currency, fx) {
  const loc = lang === 'fr' ? 'fr-FR' : 'en-US';
  const fix = (s) => s.replace(/ /g, ' ').replace(/^-/, '−').replace(/ -/, ' −');
  const num = (v, d = 0) => fix(new Intl.NumberFormat(loc, { minimumFractionDigits: d, maximumFractionDigits: d }).format(Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v));
  const auto = (v) => num(v, Math.abs(v) >= 100 ? 0 : Math.abs(v) >= 10 ? 1 : 2);
  const rate = currency === 'XAF' ? 1 : fx[currency] / fx.XAF;
  /** Money in the currency the grower chose; FCFA is always written after the amount. */
  const money = (xaf, cur = currency) => {
    const v = cur === 'XAF' ? xaf : xaf * (fx[cur] / fx.XAF);
    if (cur === 'XAF') return num(v) + ' FCFA';
    const digits = Math.abs(v) >= 100 || v === 0 || ['RWF', 'KES', 'NGN'].includes(cur) ? 0 : 2;
    try { return fix(new Intl.NumberFormat(loc, { style: 'currency', currency: cur, maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v)); }
    catch { return num(v, digits) + ' ' + cur; }
  };
  const fcfa = (xaf) => num(xaf) + ' FCFA';
  /** Unit prices in the report currency, with enough decimals for small amounts (0.0052 per kg). */
  const unit = (xaf, cur = currency) => {
    const v = cur === 'XAF' ? xaf : xaf * (fx[cur] / fx.XAF), a = Math.abs(v);
    if (cur === 'XAF') return num(v, a < 10 && a % 1 ? 1 : 0) + '\u00a0FCFA';
    const o = a >= 100 || (['RWF', 'KES', 'NGN'].includes(cur) && a >= 10) ? { maximumFractionDigits: 0 } : a >= 0.01 ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumSignificantDigits: 2 };
    try { return fix(new Intl.NumberFormat(loc, Object.assign({ style: 'currency', currency: cur }, o)).format(v)); } catch { return num(v, 2) + '\u00a0' + cur; }
  };
  const PCT = lang === 'fr' ? '\u00a0%' : '%';
  const pct = (v) => (v > 0 ? '+' : '') + num(v * 100) + PCT;
  const share = (v) => num(v * 100) + PCT;
  /** Plural of a sale unit: last word in English (100 kg sacks), first word in French (sacs de 100 kg). */
  const plural = (u) => {
    if (u === 'kg') return u;
    const pl = (w) => (/(s|x|z)$/i.test(w) ? w : lang === 'en' && /(ch|sh)$/i.test(w) ? w + 'es' : w + 's');
    const parts = u.split(' ');
    if (lang === 'fr') parts[0] = pl(parts[0]); else parts[parts.length - 1] = pl(parts[parts.length - 1]);
    return parts.join(' ');
  };
  const area = (ha) => (!(ha > 0) ? '0 m²' : ha < 0.1 ? num(ha * 10000) + ' m²' : num(ha, ha < 10 ? 2 : 1) + ' ha');
  const month = (m, style = 'long') => {
    const s = new Intl.DateTimeFormat(loc, { month: style, timeZone: 'UTC' }).format(new Date(Date.UTC(2027, ((m % 12) + 12) % 12, 1)));
    return s.charAt(0).toUpperCase() + s.slice(1);
  };
  const monthLower = (m) => { const s = new Intl.DateTimeFormat(loc, { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2027, ((m % 12) + 12) % 12, 1))); return lang === 'fr' ? s : s.charAt(0).toUpperCase() + s.slice(1); };
  const dayFirst = (d, s) => (lang === 'fr' && d.getUTCDate() === 1 ? s.replace(/^1 /, '1er ') : s);
  const date = (d) => dayFirst(d, fix(new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d)));
  const dateShort = (d) => fix(new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d));
  const monthYear = (y, m) => { const s = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m, 1))); return lang === 'fr' ? s : s; };
  const range = (a, b) => {
    if (b - a < 864e5) return dateShort(a);
    const same = a.getUTCFullYear() === b.getUTCFullYear();
    const left = same ? fix(new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(a)) : dateShort(a);
    return left + (lang === 'fr' ? ' au ' : ' to ') + dateShort(b);
  };
  return { num, auto, money, fcfa, unit, pct, share, plural, area, month, monthLower, date, dateShort, monthYear, range, rate };
}
