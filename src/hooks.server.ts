import {redirect, type Handle} from '@sveltejs/kit'
import {sessionCookieName, validateSession} from '$lib/server/staff-auth'
import {customerSessionCookieName, validateCustomerSession} from '$lib/server/customer-auth'
import {siteEditorE2eRequestStaff} from '$lib/server/site-editor-e2e'

export const handle: Handle = async ({event, resolve}) => {
  const {pathname} = event.url
  const rawLanguage = event.url.searchParams.get('lang')
  const htmlLanguage = rawLanguage === 'en' || rawLanguage === 'es' ? rawLanguage : 'pt'

  event.locals.customer = await validateCustomerSession(event.cookies.get(customerSessionCookieName))

  // Guard the private CRM backend. Validate the session for every /painel
  // request and expose the staff member on locals; redirect otherwise.
  if (pathname === '/painel' || pathname.startsWith('/painel/')) {
    const fixtureStaff = pathname.startsWith('/painel/site')
      ? siteEditorE2eRequestStaff(event.request.headers)
      : null
    const staff = fixtureStaff ?? await validateSession(event.cookies.get(sessionCookieName))
    event.locals.staff = staff

    const isLogin = pathname === '/painel/login'
    if (!staff && !isLogin) {
      redirect(303, `/painel/login?next=${encodeURIComponent(pathname)}`)
    }
    if (staff && isLogin) {
      redirect(303, '/painel/pedidos')
    }
    // There is no dashboard at bare /painel — pedidos is the default landing page.
    if (staff && pathname === '/painel') {
      redirect(303, '/painel/pedidos')
    }
  } else {
    event.locals.staff = null
  }

  const response = await resolve(event, {
    transformPageChunk: ({html}) => html.replace('%lang%', htmlLanguage),
  })
  const contentType = response.headers.get('content-type') ?? ''

  const headers = new Headers(response.headers)
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  headers.set('permissions-policy', 'camera=(), geolocation=(), microphone=()')

  if (event.url.protocol === 'https:') {
    headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains')
  }

  if (!contentType.includes('text/html')) {
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  }

  // Private backoffice: never store. Public pages: allow the browser's
  // back/forward cache (no-store would disable it) while still revalidating,
  // so navigation feels instant without serving stale content.
  const isPrivate =
    pathname === '/painel' ||
    pathname.startsWith('/painel/') ||
    pathname === '/conta' ||
    pathname.startsWith('/conta/') ||
    pathname === '/finalizar-compra'
  headers.set('cache-control', isPrivate ? 'no-store, max-age=0' : 'private, no-cache')

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}
