import {databaseConfigured, query} from './db'
import {profileStatuses, submissionStatuses, type ProfileStatus, type SubmissionStatus} from '$lib/painel'

// Read/write helpers for the /painel backend. Server-only. Replaces the old
// Sanity-backed crm-admin.ts now that leads and client profiles live in
// Postgres (crm_form_submissions / crm_client_profiles).

export type SubmissionRow = {
  id: string
  submittedAt: string
  source: string
  status: string
  name: string
  email: string
  phone: string
  address: string
  postalCode: string
  locality: string
  message: string
  language: string
  internalNotes: string
  profileId: string | null
}

export type ProfileRow = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  postalCode: string
  locality: string
  status: string
  submissionCount: number
  lastSubmittedAt: string | null
  lastSource: string
  notes: string
  tags: string[]
  marketingConsent: boolean
}

export type ProfileDetail = ProfileRow & {
  preferredLanguage: string
  firstSubmittedAt: string | null
  firstSource: string
  submissions: SubmissionRow[]
}

const submissionColumns = `
  id, submitted_at, source, status, name, email, phone, address, postal_code, locality,
  message, language, internal_notes, profile_id`

type SubmissionDbRow = {
  id: string
  submitted_at: string
  source: string
  status: string
  name: string
  email: string
  phone: string
  address: string
  postal_code: string
  locality: string
  message: string
  language: string
  internal_notes: string
  profile_id: string | null
}

const mapSubmission = (row: SubmissionDbRow): SubmissionRow => ({
  id: row.id,
  submittedAt: row.submitted_at,
  source: row.source,
  status: row.status,
  name: row.name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  postalCode: row.postal_code,
  locality: row.locality,
  message: row.message,
  language: row.language,
  internalNotes: row.internal_notes,
  profileId: row.profile_id,
})

type ProfileDbRow = {
  id: string
  name: string
  email: string
  phone: string
  address: string
  postal_code: string
  locality: string
  preferred_language: string
  status: string
  submission_count: number
  first_submitted_at: string | null
  last_submitted_at: string | null
  first_source: string
  last_source: string
  notes: string
  tags: string[]
  marketing_consent: boolean
}

const mapProfile = (row: ProfileDbRow): ProfileRow => ({
  id: row.id,
  name: row.name,
  email: row.email,
  phone: row.phone,
  address: row.address,
  postalCode: row.postal_code,
  locality: row.locality,
  status: row.status,
  submissionCount: row.submission_count,
  lastSubmittedAt: row.last_submitted_at,
  lastSource: row.last_source,
  notes: row.notes,
  tags: row.tags,
  marketingConsent: row.marketing_consent,
})

export const listSubmissions = async (
  filter: 'all' | 'catalogue' | 'contact',
  limit = 200,
): Promise<SubmissionRow[]> => {
  if (!databaseConfigured()) return []
  const where =
    filter === 'catalogue' ? `where source = 'catalogue'` : filter === 'contact' ? `where source != 'catalogue'` : ''

  const result = await query<SubmissionDbRow>(
    `select ${submissionColumns}
     from crm_form_submissions
     ${where}
     order by submitted_at desc
     limit $1`,
    [limit],
  )
  return result.rows.map(mapSubmission)
}

export const getSubmission = async (id: string): Promise<SubmissionRow | null> => {
  if (!databaseConfigured()) return null
  const result = await query<SubmissionDbRow>(
    `select ${submissionColumns} from crm_form_submissions where id = $1 limit 1`,
    [id],
  )
  return result.rows[0] ? mapSubmission(result.rows[0]) : null
}

export const listProfiles = async (search = '', limit = 200): Promise<ProfileRow[]> => {
  if (!databaseConfigured()) return []
  const term = search.trim().toLowerCase()

  const result = await query<ProfileDbRow>(
    term
      ? `select id, name, email, phone, address, postal_code, locality, preferred_language, status,
           submission_count, first_submitted_at, last_submitted_at, first_source, last_source, notes, tags, marketing_consent
         from crm_client_profiles
         where lower(name) like $1 or lower(email) like $1 or lower(locality) like $1
         order by last_submitted_at desc nulls last
         limit $2`
      : `select id, name, email, phone, address, postal_code, locality, preferred_language, status,
           submission_count, first_submitted_at, last_submitted_at, first_source, last_source, notes, tags, marketing_consent
         from crm_client_profiles
         order by last_submitted_at desc nulls last
         limit $1`,
    term ? [`%${term}%`, limit] : [limit],
  )
  return result.rows.map(mapProfile)
}

export const getProfile = async (id: string): Promise<ProfileDetail | null> => {
  if (!databaseConfigured()) return null

  const result = await query<ProfileDbRow>(
    `select id, name, email, phone, address, postal_code, locality, preferred_language, status,
       submission_count, first_submitted_at, last_submitted_at, first_source, last_source, notes, tags, marketing_consent
     from crm_client_profiles
     where id = $1
     limit 1`,
    [id],
  )
  const row = result.rows[0]
  if (!row) return null

  const submissions = await query<SubmissionDbRow>(
    `select ${submissionColumns} from crm_form_submissions where profile_id = $1 order by submitted_at desc`,
    [id],
  )

  return {
    ...mapProfile(row),
    preferredLanguage: row.preferred_language,
    firstSubmittedAt: row.first_submitted_at,
    firstSource: row.first_source,
    submissions: submissions.rows.map(mapSubmission),
  }
}

export const setSubmissionStatus = async (id: string, status: SubmissionStatus) => {
  if (!databaseConfigured() || !submissionStatuses.includes(status)) return
  await query('update crm_form_submissions set status = $2 where id = $1', [id, status])
}

export const setProfileStatus = async (id: string, status: ProfileStatus) => {
  if (!databaseConfigured() || !profileStatuses.includes(status)) return
  await query('update crm_client_profiles set status = $2, updated_at = now() where id = $1', [id, status])
}

export const appendSubmissionNote = async (id: string, text: string, author: string) => {
  const trimmed = text.trim().slice(0, 2000)
  if (!trimmed || !databaseConfigured()) return
  const stamp = new Date().toLocaleString('pt-PT')
  await query(
    `update crm_form_submissions
     set internal_notes = trim(both from concat_ws(E'\n', nullif(internal_notes, ''), $1::text))
     where id = $2`,
    [`[${stamp}${author ? ` · ${author}` : ''}] ${trimmed}`, id],
  )
}

export const appendProfileNote = async (id: string, text: string, author: string) => {
  const trimmed = text.trim().slice(0, 2000)
  if (!trimmed || !databaseConfigured()) return
  const stamp = new Date().toLocaleString('pt-PT')
  await query(
    `update crm_client_profiles
     set notes = trim(both from concat_ws(E'\n', nullif(notes, ''), $1::text)), updated_at = now()
     where id = $2`,
    [`[${stamp}${author ? ` · ${author}` : ''}] ${trimmed}`, id],
  )
}
