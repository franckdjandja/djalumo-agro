// Signed, compressed tokens for the report links (requester confirmation, administrator review).
// The token carries the whole request, so the workflow also runs without a database; HMAC SHA-256 prevents tampering.
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const MAC_LEN = 32;

export function signToken(payload, secret) {
  if (!secret) throw Object.assign(new Error('REPORT_SIGNING_SECRET is not set'), { code: 'not_configured' });
  const body = zlib.deflateRawSync(Buffer.from(JSON.stringify(payload), 'utf8')).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url').slice(0, MAC_LEN);
  return body + '.' + mac;
}

/** Returns the payload, or null when the token is malformed, altered, of another kind or expired. */
export function verifyToken(token, secret, kind, now = Date.now()) {
  if (!secret || typeof token !== 'string' || token.length > 8000) return null;
  const i = token.lastIndexOf('.');
  if (i < 1) return null;
  const body = token.slice(0, i), mac = token.slice(i + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url').slice(0, MAC_LEN);
  const a = Buffer.from(mac), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let p;
  try { p = JSON.parse(zlib.inflateRawSync(Buffer.from(body, 'base64url'), { maxOutputLength: 64 * 1024 }).toString('utf8')); } catch { return null; }
  if (!p || p.k !== kind || typeof p.exp !== 'number' || p.exp < now) return null;
  return p;
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
/** Report number such as "DJ2610 4F7K": year and month, then four characters without look alike letters. */
export function newReference(date = new Date()) {
  const bytes = crypto.randomBytes(4);
  const tail = Array.from(bytes, (x) => ALPHABET[x % ALPHABET.length]).join('');
  return 'DJ' + String(date.getUTCFullYear()).slice(2) + String(date.getUTCMonth() + 1).padStart(2, '0') + ' ' + tail;
}
