import {createClient, type SanityClient} from '@sanity/client'
import {env} from '$env/dynamic/private'

// Single server-only Sanity client for the private crm dataset. Reused by the
// auth layer and the /painel backend. Returns null when the write token is not
// configured, so callers can fail gracefully (the form/backend stay inert).
const projectId = 'u4uyfix8'
const apiVersion = '2026-06-10'

export const crmDataset = () => env.SANITY_CRM_DATASET || 'crm'
export const crmHashSecret = () => env.CRM_HASH_SECRET || ''

let cached: SanityClient | null = null

export const crmClient = (): SanityClient | null => {
  const token = env.SANITY_CRM_WRITE_TOKEN
  if (!token) return null
  if (cached) return cached

  cached = createClient({
    projectId,
    dataset: crmDataset(),
    apiVersion,
    useCdn: false,
    token,
  })
  return cached
}

// Exclude Studio draft documents from backend reads so a half-edited profile
// in Studio never shows up twice.
export const notDraft = '!(_id in path("drafts.**"))'
