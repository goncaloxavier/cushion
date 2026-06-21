import {readFile, mkdir, writeFile} from 'node:fs/promises'
import {oldProducts, type LocalizedValue} from './old-products'

const outputFile = '.sanity/product-import.ndjson'

// Per-category gallery image URLs scraped from the old Webnode site.
const images = JSON.parse(await readFile('scripts/product-images.json', 'utf8')) as Record<
  string,
  string[]
>

const localizedString = (value: LocalizedValue) => ({_type: 'localizedString', ...value})

const cleanProductMaterialCopy = (value: string) =>
  value
    .replace(
      /\s+(feitos?|feitas?|constru[ií]dos?|constru[ií]das?)\s+em\s+pl[aá]stico\s+100%\s+reciclado,?\s*/gi,
      ' ',
    )
    .replace(
      /\s+(hechos?|hechas?|construidos?|construidas?)\s+en\s+pl[aá]stico\s+100%\s+reciclado,?\s*/gi,
      ' ',
    )
    .replace(/\s+(made from|built from)\s+100%\s+recycled\s+plastic,?\s*/gi, ' ')
    .replace(/\s+(em|en)\s+pl[aá]stico\s+100%\s+reciclado,?\s*/gi, ' ')
    .replace(/\s+in\s+100%\s+recycled\s+plastic,?\s*/gi, ' ')
    .replace(/\s+100%\s+recycled-plastic\s*/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim()

const cleanLocalizedCopy = (value: LocalizedValue): LocalizedValue => ({
  pt: cleanProductMaterialCopy(value.pt),
  en: cleanProductMaterialCopy(value.en),
  es: cleanProductMaterialCopy(value.es),
})

const normalizeProductMaterialPhrase = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

const redundantProductMaterialFeatures = new Set([
  '100% plastico reciclado',
  '100% recycled plastic',
])

const isRedundantProductMaterialFeature = (feature: LocalizedValue) =>
  [feature.pt, feature.en, feature.es].some((value) =>
    redundantProductMaterialFeatures.has(normalizeProductMaterialPhrase(value)),
  )

const normalizeProductImageName = (value: string) =>
  decodeURIComponent(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const productSheetImagePatterns = [
  /\bdimens(?:oes?|ao|a[oã])?\b/,
  /\bmedidas?\b/,
  /\bficha\b/,
  /\btecnica\b/,
  /\btechnical\b/,
  /\bdesenho\b/,
  /\bdesign\b/,
  /\bcatalogo\b/,
  /\bdeck premium\b/,
  /\bdeck classico\b/,
]

const isProductSheetImageUrl = (url: string) => {
  const name = normalizeProductImageName(url.split('/').pop() || url)
  return productSheetImagePatterns.some((pattern) => pattern.test(name))
}

const prioritizeProductImageUrls = (urls: string[]) => {
  const productPhotos = urls.filter((url) => !isProductSheetImageUrl(url))
  if (!productPhotos.length) return urls

  const sheetImages = urls.filter(isProductSheetImageUrl)
  return [...productPhotos, ...sheetImages]
}

const localizedImage = (url: string, alt: LocalizedValue, key: string) => ({
  _type: 'image',
  _key: key,
  _sanityAsset: `image@${url}`,
  alt: localizedString(alt),
})

const documents = oldProducts.map((product) => {
  const gallery = prioritizeProductImageUrls(images[product.slug] ?? [])
  if (gallery.length === 0) {
    throw new Error(`No scraped images for product "${product.slug}" — re-run the scraper.`)
  }

  const [mainImageUrl, ...restImageUrls] = gallery

  return {
    _id: `productCategory-${product.slug}`,
    _type: 'productCategory',
    title: localizedString(product.title),
    slug: {_type: 'slug', current: product.slug},
    summary: {_type: 'localizedText', ...cleanLocalizedCopy(product.summary)},
    description: {_type: 'localizedText', ...cleanLocalizedCopy(product.description)},
    features: product.features
      .filter((feature) => !isRedundantProductMaterialFeature(feature))
      .map((feature, index) => ({
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
    gallery: restImageUrls.map((url, index) => localizedImage(url, product.title, `gal-${index}`)),
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
