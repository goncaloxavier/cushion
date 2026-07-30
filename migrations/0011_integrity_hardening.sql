-- Enforce business invariants that application validation alone cannot
-- guarantee under concurrent requests or direct database writes.

with ranked_defaults as (
  select
    id,
    row_number() over (
      partition by customer_id, address_type
      order by updated_at desc, created_at desc, id
    ) as position
  from customer_addresses
  where is_default = true
)
update customer_addresses as address
set is_default = false
from ranked_defaults
where address.id = ranked_defaults.id
  and ranked_defaults.position > 1;

create unique index if not exists customer_addresses_one_default_per_type_idx
  on customer_addresses(customer_id, address_type)
  where is_default = true;

update orders
set payment_status = case
  when status = 'payment_link_sent' then 'payment_link_created'
  when status in ('paid', 'in_preparation', 'shipped', 'completed') then 'paid'
  when status = 'cancelled' then 'cancelled'
  else 'pending'
end
where payment_status not in ('pending', 'payment_link_created', 'paid', 'failed', 'cancelled');

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'customers_purchase_type_check'
  ) then
    alter table customers
      add constraint customers_purchase_type_check
      check (purchase_type in ('individual', 'company'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_status_check'
  ) then
    alter table orders
      add constraint orders_status_check
      check (
        status in (
          'pending_payment_link',
          'payment_link_sent',
          'paid',
          'in_preparation',
          'shipped',
          'completed',
          'cancelled'
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_payment_status_check'
  ) then
    alter table orders
      add constraint orders_payment_status_check
      check (payment_status in ('pending', 'payment_link_created', 'paid', 'failed', 'cancelled'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_purchase_type_check'
  ) then
    alter table orders
      add constraint orders_purchase_type_check
      check (purchase_type in ('individual', 'company'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_financial_values_check'
  ) then
    alter table orders
      add constraint orders_financial_values_check
      check (
        product_net >= 0
        and transport_net >= 0
        and vat >= 0
        and total_gross >= 0
        and total_weight_kg >= 0
        and transport_multiplier > 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'order_items_values_check'
  ) then
    alter table order_items
      add constraint order_items_values_check
      check (
        variant_index >= 0
        and unit_price_net >= 0
        and line_total_net >= 0
        and unit_weight_kg >= 0
        and line_weight_kg >= 0
      );
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'order_status_events_status_check'
  ) then
    alter table order_status_events
      add constraint order_status_events_status_check
      check (
        status in (
          'pending_payment_link',
          'payment_link_sent',
          'paid',
          'in_preparation',
          'shipped',
          'completed',
          'cancelled',
          'internal_note'
        )
      );
  end if;
end
$$;

create table if not exists rate_limit_buckets (
  key text primary key,
  request_count integer not null check (request_count > 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_buckets_reset_at_idx on rate_limit_buckets(reset_at);
