import {getPublicSitePages, getSanityCollections} from '$lib/sanity'
import {contentFromSanity, defaultLanguage, languages} from '$lib/site-content'
import type {RequestHandler} from './$types'

// Public, indexable pages only. /carrinho, /finalizar-compra, /conta and
// /painel are deliberately excluded.
const staticPaths = [
  '/',
  '/sobre-nos',
  '/produtos',
  '/loja',
  '/casos-de-estudo',
  '/blog',
  '/catalogo',
  '/contacto',
  '/politica-de-devolucoes',
]

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const GET: RequestHandler = async ({url, setHeaders}) => {
  const [collections, customPages] = await Promise.all([
    getSanityCollections(),
    getPublicSitePages(),
  ])
  const site = contentFromSanity(collections)
  const content = site[defaultLanguage]

  // lastmod is only emitted when we have a real Sanity _updatedAt for that item —
  // fallback-sourced content (no live Sanity connection) has none, and a made-up
  // date would be worse than omitting the tag entirely.
  const entries = [
    ...staticPaths.map((path) => ({path, lastmod: content.updatedAt})),
    ...content.products
      .filter((item) => item.active !== false)
      .map((item) => ({path: `/produtos/${item.slug}`, lastmod: item.updatedAt})),
    ...content.storeProducts.map((item) => ({
      path: `/loja/${item.slug}`,
      lastmod: item.updatedAt,
    })),
    ...content.caseStudies
      .filter((item) => item.active !== false)
      .map((item) => ({
      path: `/casos-de-estudo/${item.slug}`,
      lastmod: item.updatedAt,
    })),
    ...content.blogPosts.map((item) => ({path: `/blog/${item.slug}`, lastmod: item.updatedAt})),
    ...customPages
      .filter((item) => item.route && !staticPaths.includes(item.route))
      .map((item) => ({path: item.route, lastmod: item.updatedAt})),
  ]

  const hrefFor = (path: string, code: string) =>
    escapeXml(`${url.origin}${path}${code === defaultLanguage ? '' : `?lang=${code}`}`)

  const body = entries
    .map(({path, lastmod}) => {
      const alternates = [
        ...languages.map(
          (option) =>
            `    <xhtml:link rel="alternate" hreflang="${option.code}" href="${hrefFor(path, option.code)}"/>`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${url.origin}${path}`)}"/>`,
      ].join('\n')
      const lastmodTag = lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''

      return `  <url>\n    <loc>${escapeXml(`${url.origin}${path}`)}</loc>${lastmodTag}\n${alternates}\n  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${body}
</urlset>`

  setHeaders({
    'content-type': 'application/xml; charset=utf-8',
    'cache-control': 'public, max-age=3600',
  })

  return new Response(xml)
}
