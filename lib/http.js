// Minimal HTTP helpers for Node serverless functions (Vercel style: handler(req, res)).
export const MAX_BODY_BYTES = 16 * 1024;

export class HttpError extends Error {
  constructor(status, code) { super(code); this.status = status; this.code = code; }
}

export async function readJson(req) {
  if (req.body !== undefined && req.body !== null) {
    if (Buffer.isBuffer(req.body)) return parseJson(req.body.toString('utf8'));
    if (typeof req.body === 'string') return parseJson(req.body);
    if (typeof req.body === 'object') {
      if (JSON.stringify(req.body).length > MAX_BODY_BYTES) throw new HttpError(413, 'too_large');
      return req.body;
    }
  }
  const declared = Number(req.headers['content-length'] || 0);
  if (declared > MAX_BODY_BYTES) throw new HttpError(413, 'too_large');
  let size = 0; const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'too_large');
    chunks.push(chunk);
  }
  return parseJson(Buffer.concat(chunks).toString('utf8'));
}

function parseJson(raw) {
  if (raw.length > MAX_BODY_BYTES) throw new HttpError(413, 'too_large');
  try { return JSON.parse(raw); } catch { throw new HttpError(400, 'bad_json'); }
}

export function send(res, status, payload, headers = {}) {
  res.statusCode = status;
  const base = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };
  for (const [k, v] of Object.entries({ ...base, ...headers })) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
}
