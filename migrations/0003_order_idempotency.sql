-- A fresh, single-use token generated per checkout page load (see
-- finalizar-compra/+page.server.ts) and submitted as a hidden field. The
-- unique constraint stops a double-click, a slow-network double-tap, or a
-- back-button resubmit from creating a second order, second payment link,
-- and second confirmation email for the same checkout attempt. NULL values
-- don't collide under a unique constraint, so existing rows are unaffected.
alter table orders add column if not exists submission_token text unique;
