import {getSanityCollections} from '$lib/sanity'
import {contentFromSanity, defaultLanguage, languages} from '$lib/site-content'
import type {RequestHandler} from './$types'

// Public, indexable pages only. /carrinho (noindex) and /painel (private) are
// deliberately excluded.
const staticPaths = [
  '/',
  '/sobre-nos',
  '/produtos',
  '/loja',
  '/casos-de-estudo',
  '/blog',
  '/catalogo',
  '/contacto',
]

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const GET: RequestHandler = async ({url, setHeaders}) => {
  const site = contentFromSanity(await getSanityCollections())
  const content = site[defaultLanguage]

  const paths = [
    ...staticPaths,
    ...content.products.map((item) => `/produtos/${item.slug}`),
    ...content.storeProducts.map((item) => `/loja/${item.slug}`),
    ...content.caseStudies.map((item) => `/casos-de-estudo/${item.slug}`),
    ...content.blogPosts.map((item) => `/blog/${item.slug}`),
  ]

  const hrefFor = (path: string, code: string) =>
    escapeXml(`${url.origin}${path}${code === defaultLanguage ? '' : `?lang=${code}`}`)

  const body = paths
    .map((path) => {
      const alternates = [
        ...languages.map(
          (option) =>
            `    <xhtml:link rel="alternate" hreflang="${option.code}" href="${hrefFor(path, option.code)}"/>`,
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${url.origin}${path}`)}"/>`,
      ].join('\n')

      return `  <url>\n    <loc>${escapeXml(`${url.origin}${path}`)}</loc>\n${alternates}\n  </url>`
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
