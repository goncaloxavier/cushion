import type {Cookies} from '@sveltejs/kit'

// Visual Editing / Presentation preview mode. When this cookie is set (only after
// passing the signed secret check at /preview/enable), the server renders draft
// content with stega metadata for the click-to-edit overlay.
export const PREVIEW_COOKIE = '__df4y_preview'

const PREVIEW_MAX_AGE = 60 * 60

const previewCookieOptions = (url: URL) => {
  const secure = url.protocol === 'https:'

  return {
    path: '/',
    httpOnly: true,
    sameSite: secure ? ('none' as const) : ('lax' as const),
    secure,
  }
}

export const isPreview = (cookies: {get: (name: string) => string | undefined}): boolean =>
  cookies.get(PREVIEW_COOKIE) === '1'

export const setPreviewCookie = (cookies: Cookies, url: URL) => {
  cookies.set(PREVIEW_COOKIE, '1', {
    ...previewCookieOptions(url),
    maxAge: PREVIEW_MAX_AGE,
  })
}

export const clearPreviewCookie = (cookies: Cookies, url: URL) => {
  cookies.delete(PREVIEW_COOKIE, previewCookieOptions(url))
}
