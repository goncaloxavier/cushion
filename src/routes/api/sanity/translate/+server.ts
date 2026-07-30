import {isValidSignature, SIGNATURE_HEADER_NAME} from '@sanity/webhook'
import {json} from '@sveltejs/kit'
import {env} from '$env/dynamic/private'
import {rateLimit, rateLimitKey} from '$lib/server/rate-limit'
import {translateDocument} from '$lib/server/translate-document'
import type {RequestHandler} from './$types'

export const POST: RequestHandler = async ({request, getClientAddress}) => {
  if (rateLimit(rateLimitKey('sanity-translate', getClientAddress()), 30, 15 * 60 * 1000)) {
    return json({error: 'rate_limited'}, {status: 429})
  }

  const rawBody = await request.text()
  const signature = request.headers.get(SIGNATURE_HEADER_NAME)

  const validWebhook =
    signature && env.SANITY_WEBHOOK_SECRET
      ? await isValidSignature(rawBody, signature, env.SANITY_WEBHOOK_SECRET)
      : false

  if (!validWebhook) {
    return json({error: 'unauthorized'}, {status: 401})
  }

  let payload: {_id?: string}
  try {
    payload = JSON.parse(rawBody) as {_id?: string}
  } catch {
    return json({error: 'invalid_json'}, {status: 400})
  }

  const documentId = payload._id?.replace(/^drafts\./, '')
  if (!documentId) {
    return json({error: 'missing_id'}, {status: 400})
  }

  const result = await translateDocument(documentId)
  return json(result, {status: result.ok ? 200 : 502})
}
