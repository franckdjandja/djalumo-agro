// Optional synchronisation with an email marketing platform. The database stays the source of truth;
// adding Mailchimp, ConvertKit or HubSpot means adding one adapter here.
import crypto from 'node:crypto';

export function createNewsletterSync(cfg, fetchImpl = fetch) {
  const key = cfg.newsletterProviderKey, list = cfg.newsletterListId;
  const adapters = {
    none: { async add() { return { ok: true, skipped: true }; } },
    brevo: {
      async add({ email, language }) {
        const r = await fetchImpl('https://api.brevo.com/v3/contacts', {
          method: 'POST', signal: AbortSignal.timeout(8000),
          headers: { 'api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email, listIds: list ? [Number(list)] : undefined, updateEnabled: true, attributes: { LANGUAGE: language } })
        });
        return { ok: r.ok, status: r.status };
      }
    },
    mailchimp: {
      async add({ email, language }) {
        const dc = String(key).split('-')[1];
        const hash = crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
        const r = await fetchImpl(`https://${dc}.api.mailchimp.com/3.0/lists/${encodeURIComponent(list)}/members/${hash}`, {
          method: 'PUT', signal: AbortSignal.timeout(8000),
          headers: { Authorization: 'Basic ' + Buffer.from('djanova:' + key).toString('base64'), 'Content-Type': 'application/json' },
          body: JSON.stringify({ email_address: email, status_if_new: 'subscribed', language })
        });
        return { ok: r.ok, status: r.status };
      }
    }
  };
  const adapter = (key && adapters[cfg.newsletterProvider]) || adapters.none;
  return { add: (d) => adapter.add(d) };
}
