import {redirect, type Handle} from '@sveltejs/kit'
import {sessionCookieName, validateSession} from '$lib/server/staff-auth'
import {customerSessionCookieName, validateCustomerSession} from '$lib/server/customer-auth'
import {applyPreviewAdminPolicy} from '$lib/server/preview-admin'
import {siteEditorE2eRequestStaff} from '$lib/server/site-editor-e2e'
import {canonicalRedirectTarget} from '$lib/server/canonical-host'
import {legacyRedirect} from '$lib/server/legacy-redirects'

export const handle: Handle = async ({event, resolve}) => {
  const {pathname} = event.url

  // One address for the site. Without this both the apex and the www host serve
  // every page, and search engines have to guess which is the real one.
  const canonicalTarget = canonicalRedirectTarget(event.url)
  if (canonicalTarget) redirect(308, canonicalTarget)

  // The previous site's URLs. Permanent, so the ranking each one earned moves to
  // the page that replaced it instead of being lost to a 404.
  const legacyTarget = legacyRedirect(pathname)
  if (legacyTarget) redirect(308, legacyTarget)
  const rawLanguage = event.url.searchParams.get('lang')
  const htmlLanguage = rawLanguage === 'en' || rawLanguage === 'es' ? rawLanguage : 'pt'

  event.locals.customer = await validateCustomerSession(event.cookies.get(customerSessionCookieName))

  // Guard the private CRM backend. Validate the session for every /painel
  // request and expose the staff member on locals; redirect otherwise.
  if (pathname === '/painel' || pathname.startsWith('/painel/')) {
    const fixtureStaff = pathname.startsWith('/painel/site')
      ? siteEditorE2eRequestStaff(event.request.headers)
      : null
    if (!fixtureStaff) await applyPreviewAdminPolicy()
    const staff = fixtureStaff ?? await validateSession(event.cookies.get(sessionCookieName))
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

  const headers = new Headers(response.headers)
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  headers.set('permissions-policy', 'camera=(), geolocation=(), microphone=()')

  if (event.url.protocol === 'https:') {
    headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains')
  }

  const isPrivate =
    pathname === '/painel' ||
    pathname.startsWith('/painel/') ||
    pathname === '/conta' ||
    pathname.startsWith('/conta/') ||
    pathname === '/finalizar-compra' ||
    pathname.startsWith('/api/')
  // SvelteKit serves a page's data as JSON on every in-app navigation, and that
  // JSON was falling into the static-asset rule below — cached publicly for five
  // minutes. So switching language, or any client-side navigation, showed content
  // from up to five minutes ago while a hard refresh showed the truth, which is
  // exactly how a fresh translation looked like it had not been applied. The data
  // for a page is as changeable as the page, so it follows the page's policy.
  // Not a path check: SvelteKit strips the /__data.json suffix from event.url
  // before hooks run, so the pathname of a data request is the page's own.
  const isPageData = event.isDataRequest

  headers.set(
    'cache-control',
    isPrivate
      ? 'no-store, max-age=0'
      : contentType.includes('text/html')
        ? 'private, no-cache'
        : isPageData
          ? // Fifteen seconds matches the server's own collection cache, so the
            // browser never holds a page's data longer than the server would have
            // served the same thing anyway. `private` because this is one
            // visitor's response. Revalidating on every navigation instead was
            // correct and far too slow — it refetches the whole layout payload
            // each time, and that payload is known to be oversized.
            'private, max-age=15'
          : 'public, max-age=300',
  )

  if (!contentType.includes('text/html')) {
    return new Response(response.body, {
      headers,
      status: response.status,
      statusText: response.statusText,
    })
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  })
}
