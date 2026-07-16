-- Checkout now requires an explicit privacy-policy consent checkbox
-- (legal requirement, mirrors customers.privacy_consent_at); record when each
-- order's consent was given, since guest checkouts have no customer row.
alter table orders add column if not exists privacy_consent_at timestamptz not null default now();
alter table orders alter column privacy_consent_at drop default;
