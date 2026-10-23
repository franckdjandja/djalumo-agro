// Abuse protection: origin check, hashed client key, rate limiting, honeypot, timing trap, Cloudflare Turnstile.
import crypto from 'node:crypto';

export function clientIp(req) {
  const xff = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return xff || String(req.headers['x-real-ip'] || '') || (req.socket && req.socket.remoteAddress) || 'unknown';
}

/** A salted hash: rate limits work without ever storing a raw IP address. */
export function clientKey(ip, salt) {
  return crypto.createHash('sha256').update(String(salt) + '|' + ip).digest('hex').slice(0, 32);
}

/** Browsers send Origin on cross site POST requests. When ALLOWED_ORIGINS is set, anything else is refused. */
export function originAllowed(req, allowed) {
  const origin = req.headers.origin;
  if (!origin || !allowed.length) return true;
  return allowed.includes(origin);
}

/** Honeypot filled or form submitted faster than a human can type: accepted silently, never stored. */
export function looksAutomated(data, minFillMs) {
  if (data.website && String(data.website).trim() !== '') return true;
  if (typeof data.elapsedMs === 'number' && data.elapsedMs < minFillMs) return true;
  return false;
}

/** In memory counter for a single instance; the Postgres store (lib/db.js) shares counts across instances. */
export function createMemoryRateStore() {
  const buckets = new Map();
  return {
    async hit(bucket, windowMs) {
      const now = Date.now(); const b = buckets.get(bucket);
      if (!b || b.expires < now) { buckets.set(bucket, { count: 1, expires: now + windowMs }); return 1; }
      b.count += 1; return b.count;
    }
  };
}

export const LIMITS = {
  contact: { max: 5, windowMs: 10 * 60 * 1000 },
  demo: { max: 5, windowMs: 10 * 60 * 1000 },
  newsletter: { max: 8, windowMs: 10 * 60 * 1000 },
  report: { max: 4, windowMs: 30 * 60 * 1000 },
  reportAction: { max: 30, windowMs: 10 * 60 * 1000 }
};

export async function verifyTurnstile(token, ip, secret, fetchImpl = fetch) {
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false };
  try {
    const body = new URLSearchParams({ secret, response: token, remoteip: ip });
    const r = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body, signal: AbortSignal.timeout(6000) });
    const j = await r.json();
    return { ok: j.success === true };
  } catch {
    return { ok: false, error: 'verify_unreachable' };
  }
}
