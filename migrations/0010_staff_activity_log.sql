-- A staff activity trail across every write action already gated by
-- canManageStaff (order/lead/profile status+notes, site publish/delete,
-- staff-account management). staff_name/staff_role are denormalized
-- deliberately, same precedent as order_status_events.actor_label: a
-- renamed, demoted, or deleted staff account shouldn't rewrite history.

create table if not exists staff_activity_log (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references staff_users(id) on delete set null,
  staff_name text not null default '',
  staff_role text not null default '',
  action text not null,
  entity_type text not null,
  entity_id text,
  entity_label text not null default '',
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists staff_activity_log_created_at_idx on staff_activity_log(created_at desc);
