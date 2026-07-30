# Operational checks

The backoffice route `/painel/incidentes` is the first place to inspect when checkout, payment
preparation, or transactional email behaves unexpectedly. Repeated occurrences are grouped into
one alert. Mark an alert as resolved only after confirming the underlying operation is healthy.

## Routine checks

- Review unresolved alerts in `/painel/incidentes`.
- Confirm the Railway database backup and restore process periodically.
- Run `npm run db:retention` from the configured scheduled job.
- Review weekly Dependabot pull requests and merge only after CI passes.
- Treat failed CI runtime audits as release blockers.

## Deployment

`npm run start:production` applies all pending database migrations before starting the website.
The application must use a database role that can apply these migrations. A failed migration stops
startup rather than serving code against an incompatible schema.

Do not set `CHECKOUT_ALLOW_FALLBACK_PRICING=true` outside automated tests. Production checkout must
fail closed if trusted Sanity prices cannot be loaded.
