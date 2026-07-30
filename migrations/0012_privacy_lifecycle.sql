alter table crm_client_profiles
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists marketing_withdrawn_at timestamptz;

alter table customers
  add column if not exists processing_restricted_at timestamptz;

update crm_client_profiles
set marketing_consent_at = coalesce(marketing_consent_at, last_submitted_at, updated_at)
where marketing_consent = true
  and marketing_consent_at is null;

create table if not exists privacy_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  customer_email text not null,
  request_type text not null
    check (request_type in ('access', 'portability', 'erasure', 'restriction', 'marketing_withdrawal')),
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'completed', 'rejected')),
  customer_note text not null default '',
  internal_note text not null default '',
  handled_by uuid references staff_users(id) on delete set null,
  handled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists privacy_requests_status_created_at_idx
  on privacy_requests(status, created_at asc);

create index if not exists privacy_requests_customer_id_created_at_idx
  on privacy_requests(customer_id, created_at desc);

create unique index if not exists privacy_requests_one_open_per_type_idx
  on privacy_requests(customer_id, request_type)
  where customer_id is not null and status in ('new', 'in_progress');
