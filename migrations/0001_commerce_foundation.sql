create extension if not exists pgcrypto;

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null unique,
  password_hash text,
  name text not null default '',
  phone text not null default '',
  nif text not null default '',
  purchase_type text not null default 'individual',
  email_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customer_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create table if not exists email_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  address_type text not null check (address_type in ('billing', 'delivery')),
  name text not null default '',
  address_line1 text not null default '',
  address_line2 text not null default '',
  postal_code text not null default '',
  locality text not null default '',
  country text not null default 'PT',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references customers(id) on delete set null,
  status text not null default 'pending_payment_link',
  payment_status text not null default 'pending',
  payment_provider text not null default 'ifthenpay_paybylink',
  payment_url text,
  payment_reference text,
  payment_expires_at timestamptz,
  language text not null default 'pt',
  customer_name text not null,
  email text not null,
  phone text not null default '',
  nif text not null default '',
  purchase_type text not null default 'individual',
  billing_address text not null default '',
  billing_postal_code text not null default '',
  billing_locality text not null default '',
  delivery_address text not null default '',
  delivery_postal_code text not null default '',
  delivery_locality text not null default '',
  delivery_zone text not null default '',
  customer_notes text not null default '',
  internal_notes text not null default '',
  product_net numeric(12,2) not null,
  transport_net numeric(12,2) not null,
  vat numeric(12,2) not null,
  total_gross numeric(12,2) not null,
  total_weight_kg numeric(12,2) not null,
  transport_multiplier numeric(8,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_customer_id_created_at_idx on orders(customer_id, created_at desc);
create index if not exists orders_status_created_at_idx on orders(status, created_at desc);
create index if not exists orders_email_created_at_idx on orders(email, created_at desc);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_slug text not null,
  product_title text not null,
  variant_index integer not null,
  variant_label text not null,
  variant_dimensions text[] not null default '{}',
  finish text not null,
  finish_label text not null,
  quantity integer not null check (quantity > 0),
  unit_price_net numeric(12,2) not null,
  line_total_net numeric(12,2) not null,
  unit_weight_kg numeric(12,2) not null default 0,
  line_weight_kg numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items(order_id);

create table if not exists order_status_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status text not null,
  note text not null default '',
  actor_type text not null default 'system',
  actor_label text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists order_status_events_order_id_created_at_idx on order_status_events(order_id, created_at desc);

create table if not exists payment_attempts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  status text not null,
  request_json jsonb,
  response_json jsonb,
  payment_url text,
  reference text,
  created_at timestamptz not null default now()
);

create index if not exists payment_attempts_order_id_created_at_idx on payment_attempts(order_id, created_at desc);

create table if not exists outbound_emails (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  recipient text not null,
  subject text not null,
  status text not null,
  provider_message_id text,
  error text,
  created_at timestamptz not null default now()
);
