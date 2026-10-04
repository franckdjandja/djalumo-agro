// Server configuration, read from environment variables at call time.
// Secrets never reach the browser: only SITE_URL and TURNSTILE_SITE_KEY are used by the static build.
export function getConfig(env = process.env) {
  const list = (v) => String(v || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    databaseUrl: env.DATABASE_URL || '',
    siteUrl: (env.SITE_URL || '').replace(/\/$/, ''),
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
    rateLimitSalt: env.RATE_LIMIT_SALT || 'afrifarm',
    minFillMs: Number(env.FORM_MIN_FILL_MS || 2500)
  };
}
