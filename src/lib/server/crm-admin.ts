import {
  profileStatuses,
  submissionStatuses,
  type ProfileStatus,
  type SubmissionStatus,
} from '$lib/painel'
import {crmClient, notDraft} from './crm-client'

// Read/write helpers for the /painel backend. Server-only. All reads exclude
// Studio drafts and never leave the server (pages are SSR-rendered).

export type SubmissionRow = {
  _id: string
  submittedAt: string
  source: string
  status: string
  name: string
  email: string
  phone?: string
  address?: string
  postalCode?: string
  locality?: string
  message?: string
  language?: string
  internalNotes?: string
  profileId?: string
}

export type ProfileRow = {
  _id: string
  name: string
  email: string
  phone?: string
  address?: string
  postalCode?: string
  locality?: string
  status: string
  submissionCount?: number
  lastSubmittedAt?: string
  lastSource?: string
  notes?: string
  tags?: string[]
  marketingConsent?: boolean
}

const submissionProjection = `{
  _id, submittedAt, source, status, name, email, phone, address, postalCode, locality,
  message, language, internalNotes, "profileId": profile._ref
}`

export const crmConfigured = () => crmClient() !== null

export const getStats = async () => {
  const client = crmClient()
  if (!client) return {newTotal: 0, catalogue: 0, contact: 0, profiles: 0}
  return client.fetch(`{
    "newTotal": count(*[_type=="formSubmission" && status=="new" && ${notDraft}]),
    "catalogue": count(*[_type=="formSubmission" && source=="catalogue" && ${notDraft}]),
    "contact": count(*[_type=="formSubmission" && source!="catalogue" && ${notDraft}]),
    "profiles": count(*[_type=="clientProfile" && ${notDraft}])
  }`)
}

export const listSubmissions = async (
  filter: 'all' | 'catalogue' | 'contact',
  limit = 200,
): Promise<SubmissionRow[]> => {
  const client = crmClient()
  if (!client) return []
  const where =
    filter === 'catalogue'
      ? '&& source=="catalogue"'
      : filter === 'contact'
        ? '&& source!="catalogue"'
        : ''
  return client.fetch(
    `*[_type=="formSubmission" ${where} && ${notDraft}] | order(submittedAt desc)[0...$limit] ${submissionProjection}`,
    {limit},
  )
}

export const getSubmission = async (id: string): Promise<SubmissionRow | null> => {
  const client = crmClient()
  if (!client) return null
  return client.fetch(`*[_type=="formSubmission" && _id==$id && ${notDraft}][0] ${submissionProjection}`, {id})
}

export const listProfiles = async (search = '', limit = 200): Promise<ProfileRow[]> => {
  const client = crmClient()
  if (!client) return []
  const term = search.trim().toLowerCase()
  const where = term
    ? '&& (lower(name) match $q || lower(email) match $q || lower(locality) match $q)'
    : ''
  return client.fetch(
    `*[_type=="clientProfile" ${where} && ${notDraft}] | order(lastSubmittedAt desc)[0...$limit]{
      _id, name, email, phone, address, postalCode, locality, status, submissionCount,
      lastSubmittedAt, lastSource, notes, tags, marketingConsent
    }`,
    term ? {q: `*${term}*`, limit} : {limit},
  )
}

export const getProfile = async (id: string) => {
  const client = crmClient()
  if (!client) return null
  return client.fetch(
    `*[_type=="clientProfile" && _id==$id && ${notDraft}][0]{
      _id, name, email, phone, address, postalCode, locality, preferredLanguage, status,
      submissionCount, firstSubmittedAt, lastSubmittedAt, firstSource, lastSource, notes, tags, marketingConsent,
      "submissions": *[_type=="formSubmission" && profile._ref==^._id && ${notDraft}] | order(submittedAt desc) ${submissionProjection}
    }`,
    {id},
  )
}

export const setSubmissionStatus = async (id: string, status: SubmissionStatus) => {
  const client = crmClient()
  if (!client || !submissionStatuses.includes(status)) return
  await client.patch(id).set({status}).commit()
}

export const setProfileStatus = async (id: string, status: ProfileStatus) => {
  const client = crmClient()
  if (!client || !profileStatuses.includes(status)) return
  await client.patch(id).set({status}).commit()
}

const appendNote = async (id: string, field: 'internalNotes' | 'notes', text: string, author: string) => {
  const client = crmClient()
  if (!client) return
  const trimmed = text.trim()
  if (!trimmed) return
  const current = await client.fetch<string | null>(`*[_id==$id][0].${field}`, {id})
  const stamp = new Date().toLocaleString('pt-PT')
  const line = `[${stamp}${author ? ` · ${author}` : ''}] ${trimmed}`
  await client
    .patch(id)
    .set({[field]: current ? `${current}\n${line}` : line})
    .commit()
}

export const appendSubmissionNote = (id: string, text: string, author: string) =>
  appendNote(id, 'internalNotes', text, author)

export const appendProfileNote = (id: string, text: string, author: string) =>
  appendNote(id, 'notes', text, author)
