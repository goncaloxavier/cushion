import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto'
import {env} from '$env/dynamic/private'
import type {Cookies} from '@sveltejs/kit'
import type {StaffUser} from './staff-auth'

export const BUILDER_PREVIEW_COOKIE = '__df4y_builder_preview'
export const BUILDER_PREVIEW_QUERY = '__builder'

const maxAgeSeconds = 2 * 60 * 60

const signingSecret = () =>
  env.BUILDER_PREVIEW_SECRET || env.SANITY_WRITE_TOKEN || env.SANITY_VIEWER_TOKEN || ''

const signatureFor = (payload: string) =>
  createHmac('sha256', signingSecret()).update(payload).digest('base64url')

const cookieOptions = (url: URL) => ({
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: url.protocol === 'https:',
})

export const builderPreviewConfigured = () => Boolean(signingSecret())

export const issueBuilderPreviewCookie = (cookies: Cookies, url: URL, staff: StaffUser) => {
  if (!builderPreviewConfigured()) return false

  const expires = Math.floor(Date.now() / 1000) + maxAgeSeconds
  const payload = `${staff.id}.${staff.role}.${expires}.${randomBytes(12).toString('base64url')}`
  const value = `${payload}.${signatureFor(payload)}`

  cookies.set(BUILDER_PREVIEW_COOKIE, value, {
    ...cookieOptions(url),
    maxAge: maxAgeSeconds,
  })
  return true
}

const validPreviewCookie = (value: string | undefined) => {
  if (!value || !builderPreviewConfigured()) return false
  const parts = value.split('.')
  if (parts.length !== 5) return false

  const signature = parts.pop() || ''
  const payload = parts.join('.')
  const expected = signatureFor(payload)
  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false

  const expires = Number(parts[2])
  return Number.isFinite(expires) && expires > Math.floor(Date.now() / 1000)
}

export const isBuilderPreviewRequest = (
  cookies: {get: (name: string) => string | undefined},
  url: URL,
  headers: {get: (name: string) => string | null},
) => {
  if (url.searchParams.get(BUILDER_PREVIEW_QUERY) !== '1') return false
  if (!validPreviewCookie(cookies.get(BUILDER_PREVIEW_COOKIE))) return false

  // Builder previews are deliberately iframe-only. A copied preview URL in a
  // normal tab must never turn into a public draft-content endpoint.
  return headers.get('sec-fetch-dest') !== 'document'
}
