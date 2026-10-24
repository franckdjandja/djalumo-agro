// Server configuration, read from environment variables at call time.
// Secrets never reach the browser: only SITE_URL and TURNSTILE_SITE_KEY are used by the static build.
import crypto from 'node:crypto';

export function getConfig(env = process.env) {
  const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
  // Email: a Gmail account with an app password works without a domain (GMAIL_USER, GMAIL_APP_PASSWORD);
  // any SMTP server (SMTP_*), Resend or Brevo (EMAIL_API_KEY) once a domain is ready.
  const gmailUser = String(env.GMAIL_USER || '').trim();
  const gmailPass = String(env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');
  const provider = String(env.EMAIL_PROVIDER || (gmailUser && gmailPass ? 'gmail' : env.SMTP_HOST ? 'smtp' : 'none')).toLowerCase();
  const smtp = provider === 'gmail'
    ? { host: 'smtp.gmail.com', port: 465, secure: true, user: gmailUser, pass: gmailPass }
    : { host: env.SMTP_HOST || '', port: Number(env.SMTP_PORT || 465), secure: env.SMTP_SECURE !== 'false', user: env.SMTP_USER || '', pass: env.SMTP_PASS || '' };
  const mailSecret = gmailPass || env.SMTP_PASS || env.EMAIL_API_KEY || '';
  const notifyTo = list(env.CONTACT_NOTIFICATION_EMAIL).length ? list(env.CONTACT_NOTIFICATION_EMAIL) : (gmailUser ? [gmailUser] : []);
  return {
    databaseUrl: env.DATABASE_URL || env.POSTGRES_URL || '',
    siteUrl: ((env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + env.VERCEL_PROJECT_PRODUCTION_URL : '') || env.SITE_URL || '').replace(/\/$/, ''),
    allowedOrigins: list(env.ALLOWED_ORIGINS),
    emailProvider: provider,
    emailApiKey: env.EMAIL_API_KEY || '',
    emailFrom: env.EMAIL_FROM || (provider === 'gmail' ? 'Djalumo Agro <' + gmailUser + '>' : ''),
    smtp,
    notifyTo,
    notifyOnNewsletter: env.NEWSLETTER_NOTIFY === 'true',
    sendSubscriberConfirmation: env.NEWSLETTER_SEND_CONFIRMATION === 'true',
    newsletterProvider: String(env.NEWSLETTER_PROVIDER || 'none').toLowerCase(),
    newsletterProviderKey: env.NEWSLETTER_PROVIDER_KEY || '',
    newsletterListId: env.NEWSLETTER_LIST_ID || '',
    turnstileSecret: env.TURNSTILE_SECRET_KEY || '',
    rateLimitSalt: env.RATE_LIMIT_SALT || 'djalumo',
    minFillMs: Number(env.FORM_MIN_FILL_MS || 2500),
    // PDF reports: requests are confirmed by the requester, then approved by the administrator before anything is sent.
    // On by default as soon as an email provider works; REPORTS_ENABLED=false switches it off.
    reportsEnabled: env.REPORTS_ENABLED ? env.REPORTS_ENABLED === 'true' : provider !== 'none',
    // Link signing key: REPORT_SIGNING_SECRET, or derived from the email secret so that two variables are enough.
    reportSecret: env.REPORT_SIGNING_SECRET || (mailSecret ? crypto.createHmac('sha256', mailSecret).update('djalumo-report-links-v1').digest('base64url') : ''),
    reportAdmin: list(env.REPORT_ADMIN_EMAIL).length ? list(env.REPORT_ADMIN_EMAIL) : notifyTo,
    reportAdminLang: env.REPORT_ADMIN_LANG === 'en' ? 'en' : 'fr'
  };
}
