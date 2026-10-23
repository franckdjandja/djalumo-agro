// Server configuration, read from environment variables at call time.
// Secrets never reach the browser: only SITE_URL and TURNSTILE_SITE_KEY are used by the static build.
export function getConfig(env = process.env) {
  const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    databaseUrl: env.DATABASE_URL || env.POSTGRES_URL || '',
    siteUrl: (env.SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + env.VERCEL_PROJECT_PRODUCTION_URL : '')).replace(/\/$/, ''),
    allowedOrigins: list(env.ALLOWED_ORIGINS),
    emailProvider: String(env.EMAIL_PROVIDER || 'none').toLowerCase(),
    emailApiKey: env.EMAIL_API_KEY || '',
    emailFrom: env.EMAIL_FROM || '',
    notifyTo: list(env.CONTACT_NOTIFICATION_EMAIL),
    notifyOnNewsletter: env.NEWSLETTER_NOTIFY === 'true',
    sendSubscriberConfirmation: env.NEWSLETTER_SEND_CONFIRMATION === 'true',
    newsletterProvider: String(env.NEWSLETTER_PROVIDER || 'none').toLowerCase(),
    newsletterProviderKey: env.NEWSLETTER_PROVIDER_KEY || '',
    newsletterListId: env.NEWSLETTER_LIST_ID || '',
    turnstileSecret: env.TURNSTILE_SECRET_KEY || '',
    rateLimitSalt: env.RATE_LIMIT_SALT || 'djalumo',
    minFillMs: Number(env.FORM_MIN_FILL_MS || 2500),
    // PDF reports: requests are confirmed by the requester, then approved by the administrator before anything is sent.
    reportsEnabled: env.REPORTS_ENABLED === 'true',
    reportSecret: env.REPORT_SIGNING_SECRET || '',
    reportAdmin: list(env.REPORT_ADMIN_EMAIL).length ? list(env.REPORT_ADMIN_EMAIL) : list(env.CONTACT_NOTIFICATION_EMAIL),
    reportAdminLang: env.REPORT_ADMIN_LANG === 'en' ? 'en' : 'fr'
  };
}
