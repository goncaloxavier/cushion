-- Generic admin-editable key/value settings store, so operational values
-- (like a swapped DeepL API key) can be rotated by an admin from /painel
-- without a redeploy. Not for customer/order data — see the dedicated
-- tables for those.

create table if not exists app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by text not null default ''
);
