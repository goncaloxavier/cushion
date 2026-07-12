-- Legal now requires an explicit, timestamped record that each customer
-- agreed to the privacy policy, separate from the marketing-consent flag on
-- CRM form submissions. Mirrors the nullable-timestamp pattern already used
-- for email_verified_at.
alter table customers add column if not exists privacy_consent_at timestamptz;
