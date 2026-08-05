import {env} from '$env/dynamic/private'

/**
 * The one origin this site is supposed to be reachable at.
 *
 * Everything SEO-facing used to be derived from the request's own host, which
 * is fine until the site answers on more than one. It already does: the Railway
 * deployment URL serves a complete copy of the content, canonicalises every page
 * to itself, and advertises its own sitemap — a second site competing with the
 * client's, on a domain they do not own.
 *
 * Named without the PUBLIC_ prefix on purpose: SvelteKit routes those to
 * $env/dynamic/public and excludes them from the private module this reads. The
 * value is not secret, it simply reaches the browser through layout data.
 *
 * With this set, the canonical origin is fixed no matter which host answered,
 * and any other host is told plainly not to index what it serves. Unset (local
 * development), nothing changes and the request host is used as before.
 */
export const canonicalOrigin = (): string | null => {
  const raw = (env.SITE_ORIGIN || '').trim().replace(/\/+$/, '')
  if (!raw) return null
  try {
    const parsed = new URL(raw)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    console.warn(`[seo] SITE_ORIGIN is not a valid URL and was ignored: ${raw}`)
    return null
  }
}

/**
 * Whether the host that answered this request is the one allowed to be indexed.
 * True when no canonical origin is configured, so local and preview environments
 * behave exactly as they did before.
 */
export const isCanonicalHost = (url: URL): boolean => {
  const canonical = canonicalOrigin()
  if (!canonical) return true
  return url.host === new URL(canonical).host
}

/**
 * The apex form of the canonical host, when the canonical host is a `www` one.
 * Used to send `dafabrica4you.pt` to `www.dafabrica4you.pt` rather than letting
 * both serve the same pages.
 */
export const canonicalRedirectTarget = (url: URL): string | null => {
  const canonical = canonicalOrigin()
  if (!canonical) return null

  const canonicalUrl = new URL(canonical)
  if (url.host === canonicalUrl.host) return null

  // Only the apex/www pair is redirected. Any other host — a preview
  // deployment, a staging alias — keeps serving, it just says noindex, because
  // redirecting those away would make them useless for the people using them.
  const bare = (host: string) => host.replace(/^www\./, '')
  if (bare(url.host) !== bare(canonicalUrl.host)) return null

  return `${canonicalUrl.origin}${url.pathname}${url.search}`
}
