-- The billing address needs its own name (person or company the invoice is
-- issued to) and NIF, distinct from the account holder's contact name. The
-- delivery address needs its own recipient name too, but never a NIF.
alter table customer_addresses add column if not exists nif text not null default '';

alter table orders add column if not exists billing_name text not null default '';
alter table orders add column if not exists delivery_name text not null default '';
