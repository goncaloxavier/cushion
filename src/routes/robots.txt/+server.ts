import {canonicalOrigin, isCanonicalHost} from '$lib/server/canonical-host'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = ({url, setHeaders}) => {
  // A preview or deployment host serves the same pages as the real site. Left
  // crawlable it competes with the site it is a copy of, so it asks to be left
  // alone entirely rather than advertising its own sitemap.
  if (!isCanonicalHost(url)) {
    setHeaders({'content-type': 'text/plain; charset=utf-8', 'cache-control': 'public, max-age=86400'})
    return new Response('User-agent: *\nDisallow: /\n')
  }

  const origin = canonicalOrigin() ?? url.origin
  const body = `User-agent: *
Allow: /
Disallow: /painel
Disallow: /preview
Disallow: /carrinho
Disallow: /finalizar-compra
Disallow: /conta
Disallow: /api

Sitemap: ${origin}/sitemap.xml
`

  setHeaders({
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  })

  return new Response(body)
}
