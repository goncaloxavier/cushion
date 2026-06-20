import {writeFile} from 'node:fs/promises'

// Reviewable scrape of the old Webnode site's product galleries.
// For each category page we pull every full-resolution product photo from the
// Webnode CDN, dropping the generic banner, complaints-book and logo assets.
// Output is committed to scripts/product-images.json so the import is reproducible.

type Category = {slug: string; sourcePath: string}

const categories: Category[] = [
  {slug: 'paineis-para-entrada-de-localidades', sourcePath: '/paineis-para-entrada-de-localidades/'},
  {slug: 'grelha-de-enrelvamento', sourcePath: '/grelha-de-enrelvamento/'},
  {slug: 'sinaletica-e-paineis-informativos', sourcePath: '/sinaletica-e-paineis-informativos/'},
  {slug: 'abrigos-e-telheiros', sourcePath: '/abrigos-e-telheiros/'},
  {slug: 'vedacoes', sourcePath: '/vedacoes/'},
  {slug: 'divisorias-de-terrenos', sourcePath: '/divisorias-de-terrenos/'},
  {slug: 'resguardos-de-ecopontos', sourcePath: '/resguardos-de-ecopontos/'},
  {slug: 'hipismo', sourcePath: '/hipismo/'},
  {slug: 'revestimento', sourcePath: '/revestimento/'},
  {slug: 'decking', sourcePath: '/pavimento-decking/'},
  {slug: 'mobiliario', sourcePath: '/mobiliario/'},
  {slug: 'floreiras-e-vasos', sourcePath: '/floreiras-e-vasos/'},
  {slug: 'compostores', sourcePath: '/compostores/'},
  {slug: 'passadicos', sourcePath: '/passadicos/'},
  {slug: 'agricultura', sourcePath: '/estacas-para-vedacao/'},
  {slug: 'caixas-de-cultivo', sourcePath: '/caixas-de-cultivo/'},
  {slug: 'bordaduras-de-canteiros', sourcePath: '/bordaduras-de-canteiros/'},
  {slug: 'pergolas', sourcePath: '/pergolas/'},
]

const origin = 'https://www.dafabrica4you.pt'
// Stop the URL at the first query/entity/quote/space so matches never run across
// the embedded gallery JSON (which uses `&quot;` and `?ph=` separators). Only the
// original jpg/jpeg/png assets — not Webnode's generated .webp derivatives.
const imagePattern = /https:\/\/[a-z0-9]+\.clvaw-cdnwnd\.com\/[^\s"'\\?&<>]+?\.(?:jpe?g|png)/gi
const excludePattern =
  /(plastico%20no%20mar|reclama|livro%20de|dafab4you|144%20x%20144|\/logo|marca|favicon|icon|sprite|placeholder)/i

// Webnode serves each photo as `/450/name.jpg`, `/700/name.jpg` and a full-size
// `/name.jpg`. Strip the size dir to get the canonical full-resolution URL.
const toFullResolution = (url: string) => url.replace(/\/(?:240|450|700|1000)\//, '/')

const extractImages = (html: string) => {
  const matches = html.match(imagePattern) ?? []
  const seen = new Set<string>()
  const images: string[] = []

  for (const raw of matches) {
    if (excludePattern.test(raw)) continue
    const full = toFullResolution(raw)
    if (excludePattern.test(full)) continue
    if (seen.has(full)) continue
    seen.add(full)
    images.push(full)
  }

  return images
}

const result: Record<string, string[]> = {}

for (const category of categories) {
  const url = `${origin}${category.sourcePath}`
  const response = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0 (migration scraper)'}})
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  const html = await response.text()
  const images = extractImages(html)
  result[category.slug] = images
  console.log(`${category.slug.padEnd(38)} ${images.length} images`)
}

await writeFile('scripts/product-images.json', `${JSON.stringify(result, null, 2)}\n`)
console.log('\nWrote scripts/product-images.json')
