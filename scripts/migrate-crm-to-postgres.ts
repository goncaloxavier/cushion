import {existsSync, readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'
import {withTransaction} from '../src/lib/server/db'

// One-off migration: copies staff accounts, client profiles, and form
// submissions out of Sanity's private `crm` dataset into Postgres
// (staff_users / crm_client_profiles / crm_form_submissions). Staff
// password hashes are copied byte-for-byte — the scrypt format is identical
// between the old Sanity-backed auth and the new Postgres-backed one (see
// src/lib/server/password-auth.ts), so existing logins keep working with
// zero forced resets. Sessions are NOT migrated: everyone gets bounced to
// the login page once after cutover, same password.
//
// Idempotent via legacy_sanity_id: re-running updates existing rows instead
// of duplicating them, so this is safe to run multiple times (e.g. a
// dry-run, then a real run, then a top-up run right before cutover).
//
// Usage:
//   SANITY_CRM_WRITE_TOKEN=... DATABASE_URL=... npx tsx scripts/migrate-crm-to-postgres.ts --dry-run
//   SANITY_CRM_WRITE_TOKEN=... DATABASE_URL=... npx tsx scripts/migrate-crm-to-postgres.ts

const projectId = 'u4uyfix8'
const dataset = process.env.SANITY_CRM_DATASET || 'crm'
const apiVersion = '2026-06-10'
const notDraft = '!(_id in path("drafts.**"))'

const loadLocalEnv = () => {
  if (!existsSync('.env')) return

  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key]) continue

    const value = rawValue.replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

loadLocalEnv()

const token = process.env.SANITY_CRM_WRITE_TOKEN
if (!token) throw new Error('Set SANITY_CRM_WRITE_TOKEN with read access to the crm dataset.')
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL to the target Postgres database.')

const sanity = createClient({projectId, dataset, apiVersion, useCdn: false, token})

type SanityStaffUser = {
  _id: string
  name: string
  username: string
  role?: string
  active?: boolean
  passwordHash?: string
  createdAt?: string
  lastLoginAt?: string
}

type SanityClientProfile = {
  _id: string
  firstName?: string
  lastName?: string
  name: string
  email: string
  phone?: string
  address?: string
  postalCode?: string
  locality?: string
  preferredLanguage?: string
  status?: string
  tags?: string[]
  notes?: string
  marketingConsent?: boolean
  privacyConsent?: boolean
  submissionCount?: number
  firstSubmittedAt?: string
  lastSubmittedAt?: string
  firstSource?: string
  lastSource?: string
  latestMessage?: string
}

type SanityFormSubmission = {
  _id: string
  submittedAt: string
  source?: string
  sourcePath?: string
  language?: string
  message: string
  profile?: {_ref: string}
  firstName?: string
  lastName?: string
  name: string
  email: string
  phone?: string
  address?: string
  postalCode?: string
  locality?: string
  marketingConsent?: boolean
  consentText?: string
  privacyConsent?: boolean
  status?: string
  internalNotes?: string
  ipHash?: string
  userAgent?: string
}

const dryRun = process.argv.includes('--dry-run')

const [staffUsers, clientProfiles, formSubmissions] = await Promise.all([
  sanity.fetch<SanityStaffUser[]>(
    `*[_type=="staffUser" && ${notDraft}]{_id, name, username, role, active, passwordHash, createdAt, lastLoginAt}`,
  ),
  sanity.fetch<SanityClientProfile[]>(
    `*[_type=="clientProfile" && ${notDraft}]{
      _id, firstName, lastName, name, email, phone, address, postalCode, locality, preferredLanguage,
      status, tags, notes, marketingConsent, privacyConsent, submissionCount, firstSubmittedAt,
      lastSubmittedAt, firstSource, lastSource, latestMessage
    }`,
  ),
  sanity.fetch<SanityFormSubmission[]>(
    `*[_type=="formSubmission" && ${notDraft}]{
      _id, submittedAt, source, sourcePath, language, message, "profile": profile{_ref}, firstName,
      lastName, name, email, phone, address, postalCode, locality, marketingConsent, consentText,
      privacyConsent, status, internalNotes, ipHash, userAgent
    }`,
  ),
])

console.log(
  `Found ${staffUsers.length} staff user(s), ${clientProfiles.length} client profile(s), ` +
    `${formSubmissions.length} form submission(s) (dry-run=${dryRun})`,
)

const missingPasswordHash = staffUsers.filter((user) => !user.passwordHash)
if (missingPasswordHash.length) {
  console.warn(
    `${missingPasswordHash.length} staff user(s) have no passwordHash and will migrate as unusable ` +
      `accounts (same as today): ${missingPasswordHash.map((user) => user.username).join(', ')}`,
  )
}

const profileIds = new Set(clientProfiles.map((profile) => profile._id))
const orphanSubmissions = formSubmissions.filter(
  (submission) => submission.profile?._ref && !profileIds.has(submission.profile._ref),
)
if (orphanSubmissions.length) {
  console.warn(
    `${orphanSubmissions.length} submission(s) reference a missing profile and will migrate without a profile link.`,
  )
}

const emailCounts = new Map<string, number>()
for (const profile of clientProfiles) {
  const email = profile.email.trim().toLowerCase()
  emailCounts.set(email, (emailCounts.get(email) ?? 0) + 1)
}
const duplicateEmails = [...emailCounts.entries()].filter(([, count]) => count > 1)
if (duplicateEmails.length) {
  throw new Error(
    `Found ${duplicateEmails.length} duplicate email(s) across client profiles — resolve in Sanity before ` +
      `migrating (crm_client_profiles.email_normalized is unique): ${duplicateEmails.map(([email]) => email).join(', ')}`,
  )
}

if (dryRun) {
  process.exit(0)
}

await withTransaction(async (pg) => {
  const profileIdMap = new Map<string, string>()

  for (const profile of clientProfiles) {
    const result = await pg.query<{id: string}>(
      `insert into crm_client_profiles (
         first_name, last_name, name, email, email_normalized, phone, address, postal_code, locality,
         preferred_language, status, tags, notes, marketing_consent, privacy_consent, submission_count,
         first_submitted_at, last_submitted_at, first_source, last_source, latest_message, legacy_sanity_id
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       on conflict (legacy_sanity_id) do update set
         first_name = excluded.first_name, last_name = excluded.last_name, name = excluded.name,
         email = excluded.email, email_normalized = excluded.email_normalized, phone = excluded.phone,
         address = excluded.address, postal_code = excluded.postal_code, locality = excluded.locality,
         preferred_language = excluded.preferred_language, status = excluded.status, tags = excluded.tags,
         notes = excluded.notes, marketing_consent = excluded.marketing_consent,
         privacy_consent = excluded.privacy_consent, submission_count = excluded.submission_count,
         first_submitted_at = excluded.first_submitted_at, last_submitted_at = excluded.last_submitted_at,
         first_source = excluded.first_source, last_source = excluded.last_source,
         latest_message = excluded.latest_message, updated_at = now()
       returning id`,
      [
        profile.firstName ?? '',
        profile.lastName ?? '',
        profile.name,
        profile.email,
        profile.email.trim().toLowerCase(),
        profile.phone ?? '',
        profile.address ?? '',
        profile.postalCode ?? '',
        profile.locality ?? '',
        profile.preferredLanguage || 'pt',
        profile.status || 'new',
        profile.tags ?? [],
        profile.notes ?? '',
        profile.marketingConsent ?? false,
        profile.privacyConsent ?? false,
        profile.submissionCount ?? 0,
        profile.firstSubmittedAt ?? null,
        profile.lastSubmittedAt ?? null,
        profile.firstSource ?? '',
        profile.lastSource ?? '',
        profile.latestMessage ?? '',
        profile._id,
      ],
    )
    profileIdMap.set(profile._id, result.rows[0].id)
  }

  for (const user of staffUsers) {
    await pg.query(
      `insert into staff_users (name, username, password_hash, role, active, legacy_sanity_id, created_at, last_login_at)
       values ($1,$2,$3,$4,$5,$6, coalesce($7::timestamptz, now()), $8::timestamptz)
       on conflict (legacy_sanity_id) do update set
         name = excluded.name, username = excluded.username, password_hash = excluded.password_hash,
         role = excluded.role, active = excluded.active, last_login_at = excluded.last_login_at, updated_at = now()`,
      [
        user.name,
        user.username.trim().toLowerCase(),
        user.passwordHash ?? '',
        user.role === 'admin' ? 'admin' : 'staff',
        user.active !== false,
        user._id,
        user.createdAt ?? null,
        user.lastLoginAt ?? null,
      ],
    )
  }

  for (const submission of formSubmissions) {
    const profileId = submission.profile?._ref ? (profileIdMap.get(submission.profile._ref) ?? null) : null
    await pg.query(
      `insert into crm_form_submissions (
         profile_id, submitted_at, source, source_path, language, message, first_name, last_name, name,
         email, phone, address, postal_code, locality, marketing_consent, consent_text, privacy_consent,
         status, internal_notes, ip_hash, user_agent, legacy_sanity_id
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       on conflict (legacy_sanity_id) do update set
         profile_id = excluded.profile_id, status = excluded.status, internal_notes = excluded.internal_notes`,
      [
        profileId,
        submission.submittedAt,
        submission.source || 'unknown',
        submission.sourcePath ?? '',
        submission.language || 'pt',
        submission.message,
        submission.firstName ?? '',
        submission.lastName ?? '',
        submission.name,
        submission.email,
        submission.phone ?? '',
        submission.address ?? '',
        submission.postalCode ?? '',
        submission.locality ?? '',
        submission.marketingConsent ?? false,
        submission.consentText ?? '',
        submission.privacyConsent ?? false,
        submission.status || 'new',
        submission.internalNotes ?? '',
        submission.ipHash ?? '',
        submission.userAgent ?? '',
        submission._id,
      ],
    )
  }
})

console.log(
  `Migrated ${staffUsers.length} staff user(s), ${clientProfiles.length} client profile(s), ` +
    `${formSubmissions.length} form submission(s).`,
)
