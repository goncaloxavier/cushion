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

// The preview cookie alone isn't enough: once set it's sent on every request
// from that browser for up to an hour, including a plain top-level visit to
// the site outside Studio. `Sec-Fetch-Dest` tells us the browsing context —
// `document` is unambiguously a normal top-level navigation (typed URL,
// clicked link, refresh), never Presentation's iframe. Only that value
// disqualifies preview; everything else (`iframe`, SvelteKit's own `empty`
// client-side data fetches once already embedded, or older browsers that
// omit the header) falls through to the cookie so Presentation keeps
// working across in-app navigation.
export const isPreview = (
  cookies: {get: (name: string) => string | undefined},
  headers?: {get: (name: string) => string | null},
): boolean => {
  if (headers?.get('sec-fetch-dest') === 'document') return false
  return cookies.get(PREVIEW_COOKIE) === '1'
}

export const safeLocalRedirect = (value: string | null | undefined): string => {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return '/'
  }

  return value
}

export const setPreviewCookie = (cookies: Cookies, url: URL) => {
  cookies.set(PREVIEW_COOKIE, '1', {
    ...previewCookieOptions(url),
    maxAge: PREVIEW_MAX_AGE,
  })
}

export const clearPreviewCookie = (cookies: Cookies, url: URL) => {
  cookies.delete(PREVIEW_COOKIE, previewCookieOptions(url))
}
