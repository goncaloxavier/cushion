import {existsSync, readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'
import {fallbackContent, type LanguageCode, type StoreProduct} from '../src/lib/site-content'

const projectId = 'u4uyfix8'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = '2026-06-10'
const languages: LanguageCode[] = ['pt', 'en', 'es']
const legacyStoreSlugs: Record<string, string[]> = {
  'cadeira-atalaia': ['cadeirao-atalia'],
}

const loadLocalEnv = () => {
  if (!existsSync('.env')) return

  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key]) continue

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

loadLocalEnv()

// Local safe mode: while SANITY_DISABLE_REMOTE is set the site renders the in-code
// fallback and must never write to the deployed dataset. Unset it deliberately to publish.
if (process.env.SANITY_DISABLE_REMOTE === 'true') {
  throw new Error(
    `Refusing to write: SANITY_DISABLE_REMOTE is set (local mode → dataset "${dataset}"). ` +
      'Unset it in .env to publish to Sanity.',
  )
}

const token =
  process.env.SANITY_WRITE_TOKEN ||
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_VIEWER_TOKEN

if (!token) {
  throw new Error(
    'Set SANITY_WRITE_TOKEN, SANITY_API_WRITE_TOKEN, or SANITY_VIEWER_TOKEN with update access.',
  )
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
})

const localizedStoreValue = (index: number, read: (product: StoreProduct) => string) =>
  Object.fromEntries(
    languages.map((language) => [language, read(fallbackContent[language].storeProducts[index])]),
  )

const localizedStoreDimensions = (productIndex: number, variantIndex: number) => {
  const canonical = fallbackContent.pt.storeProducts[productIndex].variants[variantIndex].dimensions

  return canonical.map((_, itemIndex) => ({
    _key: `dimension-${variantIndex}-${itemIndex}`,
    _type: 'localizedString',
    ...Object.fromEntries(
      languages.map((language) => [
        language,
        fallbackContent[language].storeProducts[productIndex].variants[variantIndex].dimensions[
          itemIndex
        ],
      ]),
    ),
  }))
}

const storeProductDocument = (productIndex: number) => {
  const product = fallbackContent.pt.storeProducts[productIndex]

  return {
    _id: `storeProduct-${product.slug}`,
    _type: 'storeProduct',
    title: localizedStoreValue(productIndex, (item) => item.title),
    slug: {_type: 'slug', current: product.slug},
    category: product.category,
    summary: localizedStoreValue(productIndex, (item) => item.summary),
    cataloguePage: product.cataloguePage,
    variants: product.variants.map((variant, variantIndex) => ({
      _key: `variant-${variantIndex}`,
      _type: 'storeProductVariant',
      label: localizedStoreValue(
        productIndex,
        (item) => item.variants[variantIndex]?.label || variant.label,
      ),
      dimensions: localizedStoreDimensions(productIndex, variantIndex),
      weightKg: variant.weightKg,
      priceNatural: variant.prices.natural,
      priceDark: variant.prices.dark,
      note: localizedStoreValue(
        productIndex,
        (item) => item.variants[variantIndex]?.note || variant.note || '',
      ),
    })),
    active: true,
    orderRank: (productIndex + 1) * 10,
  }
}

let created = 0
let preserved = 0
let renamed = 0

for (const [index, product] of fallbackContent.pt.storeProducts.entries()) {
  const slugs = [product.slug, ...(legacyStoreSlugs[product.slug] || [])]
  const existing = await client.fetch<{_id: string; slug?: {current?: string}} | null>(
    `*[_type == "storeProduct" && slug.current in $slugs && !(_id in path("drafts.**"))][0]{_id, slug}`,
    {slugs},
  )
  const document = storeProductDocument(index)

  if (!existing) {
    await client.createIfNotExists(document)
    created += 1
    console.log(`Created ${product.slug}`)
    continue
  }

  const {_id, _type, ...fields} = document
  void _id
  void _type
  const patch = client.patch(existing._id)
  const existingSlug = existing.slug?.current

  if (existingSlug && existingSlug !== product.slug) {
    patch.set({
      title: document.title,
      slug: document.slug,
      category: document.category,
      summary: document.summary,
    })
    renamed += 1
  }

  await patch.setIfMissing(fields).commit({visibility: 'sync'})
  preserved += 1
  console.log(
    existingSlug && existingSlug !== product.slug
      ? `Renamed ${existingSlug} -> ${product.slug} (${existing._id})`
      : `Kept ${product.slug} (${existing._id})`,
  )
}

console.log(`Loja products ready. Created ${created}; preserved ${preserved}; renamed ${renamed}.`)
