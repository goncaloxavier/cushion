import type {RequestHandler} from './$types'

export const GET: RequestHandler = ({url, setHeaders}) => {
  const body = `User-agent: *
Allow: /
Disallow: /painel
Disallow: /preview
Disallow: /carrinho

Sitemap: ${url.origin}/sitemap.xml
`

  setHeaders({
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'public, max-age=86400',
  })

  return new Response(body)
}
