import {validatePreviewUrl} from '@sanity/preview-url-secret'
import {previewSecretClient, previewEnabled} from '$lib/sanity'
import {PREVIEW_COOKIE} from '$lib/server/preview'
import {redirect} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

// The Presentation tool opens this URL with a signed ?sanity-preview-secret=...
// We validate it against the secret document in the dataset, then set the
// preview cookie so subsequent loads serve draft + stega content.
export const GET: RequestHandler = async ({url, cookies}) => {
  if (!previewEnabled()) {
    return new Response('Preview not configured (missing SANITY_VIEWER_TOKEN).', {status: 500})
  }

  const {isValid, redirectTo = '/'} = await validatePreviewUrl(previewSecretClient, url.toString())
  if (!isValid) {
    return new Response('Invalid preview secret.', {status: 401})
  }

  cookies.set(PREVIEW_COOKIE, '1', {
    path: '/',
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    maxAge: 60 * 60,
  })

  redirect(307, redirectTo)
}
