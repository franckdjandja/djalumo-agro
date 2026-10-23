// Email notifications behind one interface. Providers: resend, brevo, console (development), none.
// Credentials come from environment variables only.
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function table(rows) {
  const tr = rows.filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#6F7C76;font:12px monospace;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#0B100E;font:14px/1.5 system-ui,sans-serif;white-space:pre-wrap">${esc(v)}</td></tr>`).join('');
  return `<table style="border-collapse:collapse">${tr}</table>`;
}
function layout(title, body) {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#F4F6F5"><div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #E1E6E3;border-radius:10px;padding:24px"><p style="margin:0 0 6px;font:11px monospace;letter-spacing:.12em;color:#3E9E6C;text-transform:uppercase">Djalumo Agro</p><h1 style="margin:0 0 18px;font:600 20px system-ui,sans-serif;color:#0B100E">${esc(title)}</h1>${body}</div></body></html>`;
}
const plain = (rows) => rows.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => `${k}: ${v}`).join('\n');

export function createMailer(cfg, fetchImpl = fetch, log = console) {
  async function send({ to, subject, html, text, replyTo, headers }) {
    if (!to || !to.length || cfg.emailProvider === 'none') return { ok: false, skipped: true };
    if (cfg.emailProvider === 'console') { log.info(`[email] ${subject} -> ${to.length} recipient(s)`); return { ok: true }; }
    if (!cfg.emailApiKey || !cfg.emailFrom) return { ok: false, skipped: true, reason: 'email_not_configured' };
    let r;
    if (cfg.emailProvider === 'resend') {
      r = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${cfg.emailApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: cfg.emailFrom, to, subject, html, text, reply_to: replyTo, headers })
      });
    } else if (cfg.emailProvider === 'brevo') {
      r = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { 'api-key': cfg.emailApiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ sender: { email: cfg.emailFrom }, to: to.map((email) => ({ email })), subject, htmlContent: html, textContent: text, replyTo: replyTo ? { email: replyTo } : undefined, headers })
      });
    } else {
      return { ok: false, skipped: true, reason: 'unknown_provider' };
    }
    return { ok: r.ok, status: r.status };
  }

  return {
    send,
    notifyInquiry(d, at) {
      const rows = [['Name', d.name], ['Email', d.email], ['Organization', d.organization], ['Country', d.country], ['Phone', d.phone], ['Type', d.organizationType], ['Subject', d.subject], ['Message', d.message], ['Language', d.uiLanguage], ['Received', at]];
      return send({ to: cfg.notifyTo, subject: 'New Djalumo Agro website inquiry', html: layout('New Djalumo Agro website inquiry', table(rows)), text: plain(rows), replyTo: d.email });
    },
    notifyDemo(d, at) {
      const rows = [['Name', d.name], ['Email', d.email], ['Organization', d.organization], ['Country', d.country], ['Role', d.role], ['Type', d.organizationType], ['Interest', d.interest], ['Scale', d.scale], ['Contact by', d.contactMethod], ['Phone', d.phone], ['Message', d.message], ['Language', d.uiLanguage], ['Received', at]];
      return send({ to: cfg.notifyTo, subject: 'New Demo Request', html: layout('New Demo Request', table(rows)), text: plain(rows), replyTo: d.email });
    },
    notifySubscriber(d, at) {
      const rows = [['Email', d.email], ['Language', d.language], ['Received', at]];
      return send({ to: cfg.notifyTo, subject: 'New newsletter subscriber', html: layout('New newsletter subscriber', table(rows)), text: plain(rows) });
    },
    confirmSubscription(d, unsubscribeUrl) {
      const fr = d.language === 'fr';
      const title = fr ? 'Inscription confirmée' : 'Subscription confirmed';
      const msg = fr ? 'Vous recevrez les actualités et analyses de Djalumo Agro. Vous pouvez vous désinscrire à tout moment.' : 'You’ll receive Djalumo Agro updates and insights. You can unsubscribe at any time.';
      const link = fr ? 'Se désinscrire' : 'Unsubscribe';
      return send({
        to: [d.email], subject: title,
        html: layout(title, `<p style="font:15px/1.6 system-ui,sans-serif;color:#0B100E">${esc(msg)}</p><p><a href="${esc(unsubscribeUrl)}" style="color:#3E9E6C">${link}</a></p>`),
        text: `${msg}\n\n${link}: ${unsubscribeUrl}`,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      });
    }
  };
}
