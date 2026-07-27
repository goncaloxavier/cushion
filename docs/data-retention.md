# Data retention and privacy requests

## Customer controls

- `/conta/privacidade` lets a signed-in customer download a machine-readable copy of their data.
- The same page records access, portability, erasure, restriction, and marketing-withdrawal requests.
- Marketing withdrawal is applied immediately to the matching CRM profile.
- Requests that need staff review appear in `/painel/privacidade`.

## Staff procedure

1. Open the request in `/painel/privacidade`.
2. For access or portability, download the customer package and send it through the verified contact channel.
3. Record any relevant internal note.
4. Mark the request `Concluído` only after the request has been fulfilled.
5. Completing an erasure request deletes the customer account, addresses, sessions, tokens, and matching CRM data. Existing orders are detached from the account but retain their legal transaction snapshot.

## Scheduled cleanup

Run `npm run db:retention` from a Railway cron service or another trusted scheduled job.
The command only removes expired operational records and data that has already been archived.

Environment controls:

- `AUTH_TOKEN_RETENTION_DAYS` (default `30`)
- `UNVERIFIED_ACCOUNT_RETENTION_DAYS` (default `30`)
- `CRM_ARCHIVE_RETENTION_DAYS` (default `730`)
- `OUTBOUND_EMAIL_RETENTION_DAYS` (default `365`)

Active customers and order snapshots are never silently deleted by the scheduled cleanup.
