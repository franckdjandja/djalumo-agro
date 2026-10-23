-- Djalumo Agro · website database schema (PostgreSQL 14+)
-- Idempotent: safe to run more than once. Apply with `npm run db:migrate`.

create extension if not exists pgcrypto;

do $$ begin
  create type inquiry_status as enum ('NEW', 'CONTACTED', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscriber_status as enum ('PENDING', 'SUBSCRIBED', 'UNSUBSCRIBED');
exception when duplicate_object then null; end $$;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Contact form ------------------------------------------------------------
create table if not exists contact_inquiries (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 100),
  email             text not null check (char_length(email) <= 254),
  organization      text check (char_length(organization) <= 150),
  country           char(2) not null check (country ~ '^[A-Z]{2}$'),
  phone             text check (char_length(phone) <= 30),
  organization_type text,
  subject           text not null,
  message           text not null check (char_length(message) between 20 and 2000),
  language          char(2) not null default 'en' check (language in ('en', 'fr')),
  status            inquiry_status not null default 'NEW',
  source            text not null default 'website',
  consent_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists contact_inquiries_status_created_idx on contact_inquiries (status, created_at desc);
create index if not exists contact_inquiries_email_idx on contact_inquiries (lower(email));
create index if not exists contact_inquiries_created_idx on contact_inquiries (created_at desc);
drop trigger if exists contact_inquiries_updated_at on contact_inquiries;
create trigger contact_inquiries_updated_at before update on contact_inquiries for each row execute function set_updated_at();

-- Demo requests -----------------------------------------------------------
create table if not exists demo_requests (
  id                uuid primary key default gen_random_uuid(),
  name              text not null check (char_length(name) between 2 and 100),
  email             text not null check (char_length(email) <= 254),
  organization      text not null check (char_length(organization) between 2 and 150),
  country           char(2) not null check (country ~ '^[A-Z]{2}$'),
  role              text not null check (char_length(role) between 2 and 100),
  organization_type text not null,
  interest          text not null,
  scale             text,
  contact_method    text not null check (contact_method in ('EMAIL', 'PHONE', 'WHATSAPP')),
  phone             text check (char_length(phone) <= 30),
  message           text check (char_length(message) <= 2000),
  language          char(2) not null default 'en' check (language in ('en', 'fr')),
  status            inquiry_status not null default 'NEW',
  source            text not null default 'website',
  consent_at        timestamptz not null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint demo_phone_required check (contact_method = 'EMAIL' or phone is not null)
);
create index if not exists demo_requests_status_created_idx on demo_requests (status, created_at desc);
create index if not exists demo_requests_email_idx on demo_requests (lower(email));
drop trigger if exists demo_requests_updated_at on demo_requests;
create trigger demo_requests_updated_at before update on demo_requests for each row execute function set_updated_at();

-- Newsletter --------------------------------------------------------------
-- Only what is needed: the address, its language and the consent record.
create table if not exists newsletter_subscribers (
  id                uuid primary key default gen_random_uuid(),
  email             text not null check (char_length(email) <= 254),
  email_normalized  text not null unique,
  status            subscriber_status not null default 'SUBSCRIBED',
  language          char(2) not null default 'en' check (language in ('en', 'fr')),
  consent           boolean not null check (consent),
  consent_text      text not null,
  consent_at        timestamptz not null,
  unsubscribe_token text not null unique,
  source            text not null default 'website',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unsubscribed_at   timestamptz
);
create index if not exists newsletter_subscribers_status_idx on newsletter_subscribers (status, created_at desc);
drop trigger if exists newsletter_subscribers_updated_at on newsletter_subscribers;
create trigger newsletter_subscribers_updated_at before update on newsletter_subscribers for each row execute function set_updated_at();

-- Abuse protection: shared rate limit counters (hashed keys, no raw IP) ----
create table if not exists rate_limits (
  bucket     text primary key,
  count      integer not null default 0,
  expires_at timestamptz not null
);
create index if not exists rate_limits_expires_idx on rate_limits (expires_at);

-- Admin readiness: accounts for the future /admin area (authentication via an identity provider)
create table if not exists admin_users (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  role       text not null default 'viewer' check (role in ('viewer', 'editor', 'owner')),
  created_at timestamptz not null default now()
);

-- Audit trail of status changes made from the admin area
create table if not exists submission_events (
  id            bigserial primary key,
  submission    text not null check (submission in ('contact', 'demo', 'newsletter')),
  submission_id uuid not null,
  actor         uuid references admin_users(id),
  event         text not null,
  detail        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists submission_events_lookup_idx on submission_events (submission, submission_id, created_at desc);

-- PDF report requests -----------------------------------------------------
-- A request is confirmed by the requester (email link), then approved or refused by the administrator.
create table if not exists report_requests (
  id            uuid primary key default gen_random_uuid(),
  ref           text not null unique,
  name          text not null check (char_length(name) between 2 and 100),
  email         text not null check (char_length(email) <= 254),
  phone         text check (char_length(phone) <= 30),
  profile       text not null,
  place         text check (char_length(place) <= 120),
  report_lang   char(2) not null check (report_lang in ('en', 'fr')),
  ui_lang       char(2) not null default 'en' check (ui_lang in ('en', 'fr')),
  crop          text not null,
  plan_input    jsonb not null,
  plan_summary  jsonb not null default '{}'::jsonb,
  status        text not null default 'PENDING_EMAIL' check (status in ('PENDING_EMAIL', 'PENDING_REVIEW', 'SENT', 'REFUSED')),
  consent_at    timestamptz not null,
  confirmed_at  timestamptz,
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists report_requests_status_created_idx on report_requests (status, created_at desc);
create index if not exists report_requests_email_idx on report_requests (lower(email));
drop trigger if exists report_requests_updated_at on report_requests;
create trigger report_requests_updated_at before update on report_requests for each row execute function set_updated_at();
