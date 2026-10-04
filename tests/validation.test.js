import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contactSchema, demoSchema, newsletterSchema, parse } from '../lib/validation.js';

const contact = { name: '  Ada   Ngono ', email: ' Ada@Example.ORG ', organization: '', country: 'cm', phone: '', organizationType: null, subject: 'PILOT', message: 'We would like to join the Foumbot pilot season in 2027.', consent: true };

test('contact: valid payload is normalised', () => {
  const r = parse(contactSchema, contact);
  assert.equal(r.ok, true);
  assert.equal(r.data.name, 'Ada Ngono');
  assert.equal(r.data.email, 'ada@example.org');
  assert.equal(r.data.country, 'CM');
  assert.equal(r.data.organization, null);
  assert.equal(r.data.phone, null);
  assert.equal(r.data.uiLanguage, 'en');
});

test('contact: invalid fields are reported by name', () => {
  const r = parse(contactSchema, { ...contact, email: 'not-an-email', message: 'short', consent: false, subject: 'SPAM' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.fields).sort(), ['consent', 'email', 'message', 'subject']);
});

test('contact: control characters are stripped and length is enforced', () => {
  const r = parse(contactSchema, { ...contact, name: 'Ada\u0000‮ Ngono' });
  assert.equal(r.data.name, 'Ada Ngono');
  assert.equal(parse(contactSchema, { ...contact, message: 'x'.repeat(2001) }).ok, false);
});

test('contact: missing body is rejected', () => {
  assert.equal(parse(contactSchema, null).ok, false);
  assert.equal(parse(contactSchema, [1, 2]).ok, false);
});

test('demo: phone required unless contact by email', () => {
  const base = { name: 'Jean Fotso', email: 'jean@coop.cm', organization: 'Coop Noun', country: 'CM', role: 'Manager', organizationType: 'COOPERATIVE', interest: 'COOPERATIVE', scale: 'HA_10_100', contactMethod: 'WHATSAPP', consent: true };
  const r1 = parse(demoSchema, base);
  assert.equal(r1.ok, false); assert.ok(r1.fields.phone);
  assert.equal(parse(demoSchema, { ...base, phone: '+237 6 99 00 00 00' }).ok, true);
  assert.equal(parse(demoSchema, { ...base, contactMethod: 'EMAIL' }).ok, true);
});

test('newsletter: language defaults and consent is mandatory', () => {
  const r = parse(newsletterSchema, { email: 'A@B.co', consent: true });
  assert.equal(r.ok, true); assert.equal(r.data.language, 'en'); assert.equal(r.data.email, 'a@b.co');
  assert.equal(parse(newsletterSchema, { email: 'a@b.co', consent: false }).ok, false);
  assert.equal(parse(newsletterSchema, { email: 'a@b.co', consent: true, language: 'de' }).ok, false);
});
