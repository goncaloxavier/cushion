import {query} from '../src/lib/server/db'

const positiveDays = (name: string, fallback: number) => {
  const value = Number(process.env[name] ?? fallback)
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback
}

const tokenDays = positiveDays('AUTH_TOKEN_RETENTION_DAYS', 30)
const unverifiedDays = positiveDays('UNVERIFIED_ACCOUNT_RETENTION_DAYS', 30)
const crmDays = positiveDays('CRM_ARCHIVE_RETENTION_DAYS', 730)
const outboundEmailDays = positiveDays('OUTBOUND_EMAIL_RETENTION_DAYS', 365)

const removed: Record<string, number> = {}

const remove = async (label: string, sql: string, days?: number) => {
  const result = await query(sql, days ? [days] : [])
  removed[label] = result.rowCount ?? 0
}

await remove('customerSessions', 'delete from customer_sessions where expires_at < now()')
await remove('staffSessions', 'delete from staff_sessions where expires_at < now()')
await remove(
  'emailVerificationTokens',
  `delete from email_verification_tokens
   where expires_at < now() or used_at < now() - ($1::int * interval '1 day')`,
  tokenDays,
)
await remove(
  'passwordResetTokens',
  `delete from password_reset_tokens
   where expires_at < now() or used_at < now() - ($1::int * interval '1 day')`,
  tokenDays,
)
await remove('rateLimitBuckets', 'delete from rate_limit_buckets where reset_at < now()')
await remove(
  'unverifiedCustomers',
  `delete from customers customer
   where customer.email_verified_at is null
     and customer.created_at < now() - ($1::int * interval '1 day')
     and not exists (select 1 from orders where orders.customer_id = customer.id)`,
  unverifiedDays,
)
await remove(
  'archivedCrmSubmissions',
  `delete from crm_form_submissions
   where status in ('archived', 'spam')
     and submitted_at < now() - ($1::int * interval '1 day')`,
  crmDays,
)
await remove(
  'orphanedArchivedProfiles',
  `delete from crm_client_profiles profile
   where profile.status = 'archived'
     and profile.marketing_consent = false
     and coalesce(profile.last_submitted_at, profile.created_at) <
       now() - ($1::int * interval '1 day')
     and not exists (
       select 1 from crm_form_submissions submission where submission.profile_id = profile.id
     )`,
  crmDays,
)
await remove(
  'outboundEmails',
  `delete from outbound_emails
   where created_at < now() - ($1::int * interval '1 day')`,
  outboundEmailDays,
)

console.log(JSON.stringify({ok: true, removed}, null, 2))
