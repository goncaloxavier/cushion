import {clearPreviewCookie} from '$lib/server/preview'
import {redirect} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({url, cookies}) => {
  clearPreviewCookie(cookies, url)
  redirect(307, url.searchParams.get('redirect') || '/')
}
