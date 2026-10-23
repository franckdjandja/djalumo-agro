// PostgreSQL access. Every query is a tagged template: values are always sent as parameters, never concatenated.
import crypto from 'node:crypto';
import postgres from 'postgres';

let shared = null;
export function getSql(url) {
  if (!url) throw Object.assign(new Error('DATABASE_URL is not set'), { code: 'db_not_configured' });
  if (!shared) {
    const local = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(url) || url.includes('host=/');
    shared = postgres(url, { ssl: local ? false : 'require', max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false, onnotice: () => {} });
  }
  return shared;
}

export const CONSENT_TEXT = {
  newsletter: {
    en: 'I agree to receive Djalumo Agro updates and accept the privacy policy.',
    fr: 'J’accepte de recevoir les actualités de Djalumo Agro et la politique de confidentialité.'
  }
};

export function createRepository(sql) {
  return {
    async insertInquiry(d) {
      const [row] = await sql`
        insert into contact_inquiries (name, email, organization, country, phone, organization_type, subject, message, language, consent_at)
        values (${d.name}, ${d.email}, ${d.organization}, ${d.country}, ${d.phone}, ${d.organizationType}, ${d.subject}, ${d.message}, ${d.uiLanguage}, now())
        returning id, created_at`;
      return row;
    },

    async insertDemoRequest(d) {
      const [row] = await sql`
        insert into demo_requests (name, email, organization, country, role, organization_type, interest, scale, contact_method, phone, message, language, consent_at)
        values (${d.name}, ${d.email}, ${d.organization}, ${d.country}, ${d.role}, ${d.organizationType}, ${d.interest}, ${d.scale}, ${d.contactMethod}, ${d.phone}, ${d.message}, ${d.uiLanguage}, now())
        returning id, created_at`;
      return row;
    },

    /** Duplicate detection on the normalised address; an unsubscribed address can subscribe again. */
    async subscribe(d) {
      const token = crypto.randomBytes(24).toString('base64url');
      const consentText = CONSENT_TEXT.newsletter[d.language] || CONSENT_TEXT.newsletter.en;
      const [existing] = await sql`select id, status from newsletter_subscribers where email_normalized = ${d.email}`;
      if (existing && existing.status === 'SUBSCRIBED') return { duplicate: true };
      if (existing) {
        await sql`
          update newsletter_subscribers
          set status = 'SUBSCRIBED', language = ${d.language}, consent = true, consent_text = ${consentText}, consent_at = now(),
              unsubscribe_token = ${token}, unsubscribed_at = null
          where id = ${existing.id}`;
        return { duplicate: false, resubscribed: true, token };
      }
      const rows = await sql`
        insert into newsletter_subscribers (email, email_normalized, status, language, consent, consent_text, consent_at, unsubscribe_token)
        values (${d.email}, ${d.email}, 'SUBSCRIBED', ${d.language}, true, ${consentText}, now(), ${token})
        on conflict (email_normalized) do nothing
        returning id`;
      return rows.length ? { duplicate: false, token } : { duplicate: true };
    },

    async unsubscribe(token) {
      const rows = await sql`
        update newsletter_subscribers set status = 'UNSUBSCRIBED', unsubscribed_at = now()
        where unsubscribe_token = ${token} and status <> 'UNSUBSCRIBED'
        returning id`;
      return rows.length > 0;
    },

    async insertReportRequest(q, summary) {
      const [row] = await sql`
        insert into report_requests (ref, name, email, phone, profile, place, report_lang, ui_lang, crop, plan_input, plan_summary, consent_at)
        values (${q.ref}, ${q.name}, ${q.email}, ${q.phone}, ${q.profile}, ${q.place}, ${q.lang}, ${q.ui}, ${q.input.crop}, ${sql.json(q.input)}, ${sql.json(summary || {})}, now())
        returning id`;
      return row;
    },

    /** 'confirmed' the first time, 'already' afterwards, 'missing' when the request was never stored. */
    async confirmReport(ref) {
      const rows = await sql`update report_requests set status = 'PENDING_REVIEW', confirmed_at = now() where ref = ${ref} and status = 'PENDING_EMAIL' returning id`;
      if (rows.length) return 'confirmed';
      const [row] = await sql`select status from report_requests where ref = ${ref}`;
      return row ? 'already' : 'missing';
    },

    /** Single use decision: 'ok', 'missing', or the status already recorded ('SENT' or 'REFUSED'). */
    async decideReport(ref, status) {
      const rows = await sql`update report_requests set status = ${status}, decided_at = now() where ref = ${ref} and status in ('PENDING_EMAIL', 'PENDING_REVIEW') returning id`;
      if (rows.length) return 'ok';
      const [row] = await sql`select status from report_requests where ref = ${ref}`;
      return row ? row.status : 'missing';
    },

    /** Puts an approved request back in review when the report email could not be sent. */
    async reopenReport(ref) {
      await sql`update report_requests set status = 'PENDING_REVIEW', decided_at = null where ref = ${ref} and status = 'SENT'`;
    },

    async reportStatus(ref) {
      const [row] = await sql`select status from report_requests where ref = ${ref}`;
      return row ? row.status : null;
    },

    async ping() { await sql`select 1`; return true; }
  };
}

/** Rate limit counters shared by every serverless instance. */
export function createPostgresRateStore(sql) {
  return {
    async hit(bucket, windowMs) {
      const secs = Math.ceil(windowMs / 1000);
      const [r] = await sql`
        insert into rate_limits (bucket, count, expires_at) values (${bucket}, 1, now() + make_interval(secs => ${secs}))
        on conflict (bucket) do update set
          count = case when rate_limits.expires_at < now() then 1 else rate_limits.count + 1 end,
          expires_at = case when rate_limits.expires_at < now() then excluded.expires_at else rate_limits.expires_at end
        returning count`;
      if (Math.random() < 0.02) sql`delete from rate_limits where expires_at < now() - interval '1 hour'`.catch(() => {});
      return r.count;
    }
  };
}
