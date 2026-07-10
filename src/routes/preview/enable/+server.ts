import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {previewSecretClient, previewEnabled} from '$lib/sanity'
import {safeLocalRedirect, setPreviewCookie} from '$lib/server/preview'
import {rateLimit, rateLimitKey} from '$lib/server/rate-limit'
import {redirect} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

// The Presentation tool opens this URL with a signed ?sanity-preview-secret=...
// We validate it against the secret document in the dataset, then set the
// preview cookie so subsequent loads serve draft + stega content.
export const GET: RequestHandler = async ({url, cookies, getClientAddress}) => {
  if (rateLimit(rateLimitKey('preview-enable', getClientAddress()), 20, 15 * 60 * 1000)) {
    return new Response('Too many preview attempts. Try again shortly.', {status: 429})
  }

  if (!previewEnabled()) {
    return new Response('Preview not configured (missing SANITY_VIEWER_TOKEN).', {status: 500})
  }

  const {isValid, redirectTo = '/'} = await validatePreviewUrl(previewSecretClient, url.toString())
  if (!isValid) {
    return new Response('Invalid preview secret.', {status: 401})
  }

  setPreviewCookie(cookies, url)

  redirect(307, safeLocalRedirect(redirectTo))
}
