create table if not exists operational_incidents (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  category text not null,
  severity text not null default 'warning'
    check (severity in ('warning', 'error', 'critical')),
  title text not null,
  detail text not null default '',
  context_json jsonb not null default '{}'::jsonb,
  occurrences integer not null default 1 check (occurrences > 0),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references staff_users(id) on delete set null
);

create unique index if not exists operational_incidents_open_fingerprint_idx
  on operational_incidents(fingerprint)
  where resolved_at is null;

create index if not exists operational_incidents_open_last_seen_idx
  on operational_incidents(last_seen_at desc)
  where resolved_at is null;
