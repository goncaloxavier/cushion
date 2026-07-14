-- Moves the private staff backoffice + CRM off Sanity's `crm` dataset onto
-- Postgres, the same trusted private store already used for
-- customers/orders. Staff password hashing follows the identical scrypt
-- convention as customers (see src/lib/server/password-auth.ts), so
-- existing staffUser.passwordHash values can be copied byte-for-byte by the
-- migration script with zero forced resets.

create table if not exists staff_users (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  username text not null unique,
  password_hash text not null,
  role text not null default 'staff' check (role in ('admin', 'staff')),
  active boolean not null default true,
  legacy_sanity_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists staff_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff_users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  ip_hash text not null default '',
  user_agent text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists staff_sessions_staff_id_idx on staff_sessions(staff_id);

create table if not exists crm_client_profiles (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  name text not null default '',
  email text not null default '',
  email_normalized text not null unique,
  phone text not null default '',
  address text not null default '',
  postal_code text not null default '',
  locality text not null default '',
  preferred_language text not null default 'pt',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'customer', 'archived')),
  tags text[] not null default '{}',
  notes text not null default '',
  marketing_consent boolean not null default false,
  privacy_consent boolean not null default false,
  submission_count integer not null default 0,
  first_submitted_at timestamptz,
  last_submitted_at timestamptz,
  first_source text not null default '',
  last_source text not null default '',
  latest_message text not null default '',
  legacy_sanity_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_client_profiles_last_submitted_at_idx
  on crm_client_profiles(last_submitted_at desc);

create table if not exists crm_form_submissions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references crm_client_profiles(id) on delete set null,
  submitted_at timestamptz not null default now(),
  source text not null default 'unknown',
  source_path text not null default '',
  language text not null default 'pt',
  message text not null default '',
  first_name text not null default '',
  last_name text not null default '',
  name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  postal_code text not null default '',
  locality text not null default '',
  marketing_consent boolean not null default false,
  consent_text text not null default '',
  privacy_consent boolean not null default false,
  status text not null default 'new'
    check (status in ('new', 'read', 'inProgress', 'resolved', 'spam', 'archived')),
  internal_notes text not null default '',
  ip_hash text not null default '',
  user_agent text not null default '',
  legacy_sanity_id text unique,
  created_at timestamptz not null default now()
);

create index if not exists crm_form_submissions_submitted_at_idx
  on crm_form_submissions(submitted_at desc);
create index if not exists crm_form_submissions_source_submitted_at_idx
  on crm_form_submissions(source, submitted_at desc);
create index if not exists crm_form_submissions_status_idx
  on crm_form_submissions(status);
create index if not exists crm_form_submissions_profile_id_idx
  on crm_form_submissions(profile_id);
