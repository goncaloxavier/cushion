import {createClient} from '@sanity/client'

// Pre-generates (warms) the resized webp image variants the site serves, so the
// Sanity CDN has them cached before any visitor arrives — no cold, slow-to-
// generate transforms. Run after importing/changing images:  npm run warm:images
//
// Widths MUST match WIDTH_STEPS in src/lib/image.ts (minus the 2000px lightbox
// size, which is only hit on a deliberate zoom and warms itself). The webp
// format + fixed widths make each variant URL deterministic.
const WARM_WIDTHS = [160, 320, 400, 640, 900, 1100, 1600]
const QUALITY = 72
const CONCURRENCY = 12

const client = createClient({
  projectId: 'u4uyfix8',
  dataset: 'production',
  apiVersion: '2026-06-10',
  useCdn: true,
})

const data = await client.fetch<{
  items: {main: string | null; gallery: (string | null)[] | null}[]
  heroes: (string | null)[] | null
}>(`{
  "items": *[_type in ["productCategory","caseStudy","blogPost","storeProduct"]]{
    "main": image.asset->url,
    "gallery": gallery[].asset->url
  },
  "heroes": *[_id == "siteContent" || _type == "siteLanding"][0]{
    "h": [
      home.heroImage.asset->url,
      productsPage.heroImage.asset->url,
      casesPage.heroImage.asset->url,
      blogPage.heroImage.asset->url
    ]
  }.h
}`)

const urls = new Set<string>()
for (const item of data.items ?? []) {
  if (item.main) urls.add(item.main)
  for (const g of item.gallery ?? []) if (g) urls.add(g)
}
for (const hero of data.heroes ?? []) if (hero) urls.add(hero)

const sanityUrls = [...urls].filter((url) => url.includes('cdn.sanity.io'))
const variants = sanityUrls.flatMap((url) => {
  const separator = url.includes('?') ? '&' : '?'
  return WARM_WIDTHS.map((w) => `${url}${separator}w=${w}&q=${QUALITY}&fm=webp&fit=max`)
})

console.log(`Warming ${variants.length} variants from ${sanityUrls.length} images…`)

let done = 0
let failed = 0
let cursor = 0

const worker = async () => {
  while (cursor < variants.length) {
    const url = variants[cursor++]
    try {
      const res = await fetch(url)
      if (!res.ok) failed += 1
      await res.arrayBuffer()
    } catch {
      failed += 1
    }
    done += 1
    if (done % 200 === 0) console.log(`  ${done}/${variants.length}`)
  }
}

await Promise.all(Array.from({length: CONCURRENCY}, worker))
console.log(`Done. Warmed ${done - failed}/${variants.length} variants (${failed} failed).`)
