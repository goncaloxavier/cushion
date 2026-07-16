-- Preserve one canonical copy of any exact address saved before the unique
-- identity existed. Prefer the default, then the most recently updated copy.
with ranked_addresses as (
  select
    id,
    row_number() over (
      partition by customer_id, address_type, address_line1, address_line2, postal_code, locality, country
      order by is_default desc, updated_at desc, created_at desc
    ) as duplicate_rank
  from customer_addresses
)
delete from customer_addresses
where id in (select id from ranked_addresses where duplicate_rank > 1);

create unique index if not exists customer_addresses_identity_idx
  on customer_addresses (
    customer_id,
    address_type,
    address_line1,
    address_line2,
    postal_code,
    locality,
    country
  );
