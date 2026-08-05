import {canonicalOrigin} from '$lib/server/canonical-host'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = ({url, setHeaders}) => {
  // A non-canonical host is deliberately left crawlable. It is a duplicate of
  // the real site and every page it serves says noindex — but a crawler has to
  // be able to fetch a page to read that. Blocking it here instead would mean
  // anything already indexed stays indexed, unreachable and unremovable, which
  // is the "Indexed, though blocked by robots.txt" state. Let it in, let it read
  // the noindex, let the URLs drop out.
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
