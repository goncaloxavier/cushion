import {timingSafeEqual} from 'node:crypto'
import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import {json} from '@sveltejs/kit'
import {env} from '$env/dynamic/private'
import {rateLimit, rateLimitKey} from '$lib/server/rate-limit'
import {translateDocument} from '$lib/server/translate-document'
import type {RequestHandler} from './$types'

// The Sanity webhook itself is a server-to-server request — CORS is purely a
// browser mechanism, so it never applies to that path. The Studio's manual
// "Retraduzir" button, however, runs in the editor's browser on the Studio's
// own origin (a separate Railway service from the main site), POSTing
// cross-origin here — without an explicit allow-origin, the browser blocks
// the response even though the server processed the request correctly.
const studioOrigin = () => {
  try {
    return env.SANITY_STUDIO_URL ? new URL(env.SANITY_STUDIO_URL).origin : null
  } catch {
    return null
  }
}

const corsHeaders = (origin: string | null): Record<string, string> => {
  const allowed = studioOrigin()
  if (!origin || !allowed || origin !== allowed) return {}
  return {'access-control-allow-origin': origin, vary: 'origin'}
}

const secretsMatch = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const OPTIONS: RequestHandler = ({request}) => {
  const origin = request.headers.get('origin')
  const allowed = origin && origin === studioOrigin()

  return new Response(null, {
    status: allowed ? 204 : 403,
    headers: {
      ...corsHeaders(origin),
      'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'content-type, x-sanity-translate-secret',
    },
  })
}

export const POST: RequestHandler = async ({request, getClientAddress}) => {
  const origin = request.headers.get('origin')
  const headers = corsHeaders(origin)

  if (rateLimit(rateLimitKey('sanity-translate', getClientAddress()), 30, 15 * 60 * 1000)) {
    return json({error: 'rate_limited'}, {status: 429, headers})
  }

  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME)
  const studioSecret = request.headers.get('x-sanity-translate-secret')

  const viaWebhook =
    signature && env.SANITY_WEBHOOK_SECRET
      ? await isValidSignature(rawBody, signature, env.SANITY_WEBHOOK_SECRET)
      : false
  const viaStudioButton =
    studioSecret && env.SANITY_STUDIO_TRANSLATE_SECRET
      ? secretsMatch(studioSecret, env.SANITY_STUDIO_TRANSLATE_SECRET)
      : false

  if (!viaWebhook && !viaStudioButton) {
    return json({error: 'unauthorized'}, {status: 401, headers})
  }

  // The Studio's manual-trigger secret is baked into a public JS bundle, so
  // it's readable by anyone who opens dev tools on the Studio site — unlike
  // the signed webhook, it can't be treated as a real secret. A real editor
  // clicking "Retraduzir" a few times a session is fine; someone hammering a
  // copied-out secret isn't, so this path gets a much tighter ceiling than
  // the generous floor above (which exists mainly for legitimate webhook
  // delivery bursts).
  if (
    viaStudioButton &&
    rateLimit(rateLimitKey('sanity-translate-manual', getClientAddress()), 10, 60 * 60 * 1000)
  ) {
    return json({error: 'rate_limited'}, {status: 429, headers})
  }

  let payload: {_id?: string}
  try {
    payload = JSON.parse(rawBody) as {_id?: string}
  } catch {
    return json({error: 'invalid_json'}, {status: 400, headers})
  }

  const documentId = payload._id?.replace(/^drafts\./, '')
  if (!documentId) {
    return json({error: 'missing_id'}, {status: 400, headers})
  }

  const result = await translateDocument(documentId)
  return json(result, {status: result.ok ? 200 : 502, headers})
}
