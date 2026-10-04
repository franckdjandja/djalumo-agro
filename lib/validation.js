// Server side validation and sanitisation. The browser validates too, but nothing it sends is trusted.
import { z } from 'zod';

export const CODES = {
  organizationType: ['FARM', 'COOPERATIVE', 'AGRIBUSINESS', 'FINANCE', 'INVESTOR', 'PUBLIC', 'DEVELOPMENT', 'RESEARCH', 'MEDIA', 'OTHER'],
  subject: ['PARTNERSHIP', 'PILOT', 'INVESTMENT', 'DATA', 'MEDIA', 'OTHER'],
  interest: ['FARM_PLANNING', 'INVESTMENT', 'COOPERATIVE', 'SUPPLY', 'RISK', 'PUBLIC_PROGRAMME', 'FOUMBOT_PILOT'],
  scale: ['UNDER_1_HA', 'HA_1_10', 'HA_10_100', 'OVER_100_HA', 'NOT_APPLICABLE'],
  contactMethod: ['EMAIL', 'PHONE', 'WHATSAPP']
};

const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g;
const blankToNull = (v) => (v === '' || v === undefined || v === null ? null : v);
const cleanLine = (s) => s.replace(CTRL, '').replace(/\s+/g, ' ').trim();
const cleanText = (s) => s.replace(CTRL, '').replace(/\r\n?/g, '\n').replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();

const line = (min, max) => z.string().max(max * 4).transform(cleanLine).pipe(z.string().min(min).max(max));
const text = (min, max) => z.string().max(max * 4).transform(cleanText).pipe(z.string().min(min).max(max));
const optional = (schema) => z.preprocess(blankToNull, schema.nullable()).optional().transform((v) => v ?? null);

const email = z.string().max(400).transform((s) => cleanLine(s).toLowerCase())
  .pipe(z.string().max(254).regex(/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/));
const country = z.string().transform((s) => s.trim().toUpperCase()).pipe(z.string().regex(/^[A-Z]{2}$/));
const phone = z.string().max(60).transform(cleanLine).pipe(z.string().regex(/^\+?[0-9 ().]{6,24}$/));
const lang = z.enum(['en', 'fr']);

const meta = {
  website: z.string().max(500).optional().default(''),       // honeypot, must stay empty
  elapsedMs: z.number().int().nonnegative().max(864e5).optional(),
  turnstileToken: z.string().max(4096).optional(),
  uiLanguage: lang.optional().default('en')
};

export const contactSchema = z.object({
  name: line(2, 100),
  email,
  organization: optional(line(1, 150)),
  country,
  phone: optional(phone),
  organizationType: optional(z.enum(CODES.organizationType)),
  subject: z.enum(CODES.subject),
  message: text(20, 2000),
  consent: z.literal(true),
  ...meta
});

export const demoSchema = z.object({
  name: line(2, 100),
  email,
  organization: line(2, 150),
  country,
  role: line(2, 100),
  organizationType: z.enum(CODES.organizationType),
  interest: z.enum(CODES.interest),
  scale: optional(z.enum(CODES.scale)),
  contactMethod: z.enum(CODES.contactMethod),
  phone: optional(phone),
  message: optional(text(0, 2000)),
  consent: z.literal(true),
  ...meta
}).superRefine((d, ctx) => {
  if (d.contactMethod !== 'EMAIL' && !d.phone) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['phone'], message: 'required' });
});

export const newsletterSchema = z.object({
  email,
  language: lang.optional().default('en'),
  consent: z.literal(true),
  ...meta
});

/** Returns { ok: true, data } or { ok: false, fields } where fields maps a field name to a short code. */
export function parse(schema, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, fields: { _: 'invalid_body' } };
  const r = schema.safeParse(body);
  if (r.success) return { ok: true, data: r.data };
  const fields = {};
  for (const issue of r.error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!fields[key]) fields[key] = issue.code === 'invalid_type' && issue.received === 'undefined' ? 'required' : 'invalid';
  }
  return { ok: false, fields };
}
