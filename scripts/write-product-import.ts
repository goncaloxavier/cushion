import {readFile, mkdir, writeFile} from 'node:fs/promises'
import {oldProducts, type LocalizedValue} from './old-products'

const outputFile = '.sanity/product-import.ndjson'

// Per-category gallery image URLs scraped from the old Webnode site.
const images = JSON.parse(await readFile('scripts/product-images.json', 'utf8')) as Record<
  string,
  string[]
>

const localizedString = (value: LocalizedValue) => ({_type: 'localizedString', ...value})

const localizedImage = (url: string, alt: LocalizedValue, key: string) => ({
  _type: 'image',
  _key: key,
  _sanityAsset: `image@${url}`,
  alt: localizedString(alt),
})

const documents = oldProducts.map((product) => {
  const gallery = images[product.slug] ?? []
  if (gallery.length === 0) {
    throw new Error(`No scraped images for product "${product.slug}" — re-run the scraper.`)
  }

  const [mainImageUrl, ...restImageUrls] = gallery

  return {
    _id: `productCategory-${product.slug}`,
    _type: 'productCategory',
    title: localizedString(product.title),
    slug: {_type: 'slug', current: product.slug},
    summary: {_type: 'localizedText', ...product.summary},
    description: {_type: 'localizedText', ...product.description},
    features: product.features.map((feature, index) => ({
      _key: `feat-${index}`,
      ...localizedString(feature),
    })),
    applications: product.applications.map((application, index) => ({
      _key: `app-${index}`,
      ...localizedString(application),
    })),
    orderRank: product.orderRank,
    image: {
      _type: 'image',
      _sanityAsset: `image@${mainImageUrl}`,
      alt: localizedString(product.title),
    },
    gallery: restImageUrls.map((url, index) =>
      localizedImage(url, product.title, `gal-${index}`),
    ),
  }
})

const ids = documents.map((document) => document._id)
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
if (duplicates.length) {
  throw new Error(`Duplicate product import ids: ${[...new Set(duplicates)].join(', ')}`)
}

await mkdir('.sanity', {recursive: true})
await writeFile(outputFile, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)

const totalImages = documents.reduce((sum, document) => sum + 1 + document.gallery.length, 0)
console.log(
  `Wrote ${documents.length} product import documents (${totalImages} images) to ${outputFile}`,
)
