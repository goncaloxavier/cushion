import {PREVIEW_COOKIE} from '$lib/server/preview'
import {redirect} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({url, cookies}) => {
  cookies.delete(PREVIEW_COOKIE, {path: '/'})
  redirect(307, url.searchParams.get('redirect') || '/')
}
