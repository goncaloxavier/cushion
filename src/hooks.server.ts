import {redirect, type Handle} from '@sveltejs/kit'
import {sessionCookieName, validateSession} from '$lib/server/auth'

export const handle: Handle = async ({event, resolve}) => {
  const {pathname} = event.url
  const rawLanguage = event.url.searchParams.get('lang')
  const htmlLanguage = rawLanguage === 'en' || rawLanguage === 'es' ? rawLanguage : 'pt'

  // Guard the private CRM backend. Validate the session for every /painel
  // request and expose the staff member on locals; redirect otherwise.
  if (pathname === '/painel' || pathname.startsWith('/painel/')) {
    const staff = await validateSession(event.cookies.get(sessionCookieName))
    event.locals.staff = staff

    const isLogin = pathname === '/painel/login'
    if (!staff && !isLogin) {
      redirect(303, `/painel/login?next=${encodeURIComponent(pathname)}`)
    }
    if (staff && isLogin) {
      redirect(303, '/painel')
    }
  } else {
    event.locals.staff = null
  }

  const response = await resolve(event, {
    transformPageChunk: ({html}) => html.replace('%lang%', htmlLanguage),
  })
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('text/html')) {
    return response
  }

  const headers = new Headers(response.headers)
  // Private backoffice: never store. Public pages: allow the browser's
  // back/forward cache (no-store would disable it) while still revalidating,
  // so navigation feels instant without serving stale content.
  const isPrivate = pathname === '/painel' || pathname.startsWith('/painel/')
  headers.set('cache-control', isPrivate ? 'no-store, max-age=0' : 'private, no-cache')

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}
