import {redirect, type Handle} from '@sveltejs/kit'
import {sessionCookieName, validateSession} from '$lib/server/auth'

export const handle: Handle = async ({event, resolve}) => {
  const {pathname} = event.url

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

  const response = await resolve(event)
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('text/html')) {
    return response
  }

  const headers = new Headers(response.headers)
  headers.set('cache-control', 'no-store, max-age=0')

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}
