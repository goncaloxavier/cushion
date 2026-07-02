import {mkdir, writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'
import {
  contactFieldKeys,
  type ContentImage,
  fallbackContent,
  type ContentCard,
  type LanguageCode,
  type ProductItem,
  type SiteContent,
  type StoreProduct,
} from '../src/lib/site-content'

const languages: LanguageCode[] = ['pt', 'en', 'es']
const outputFile = '.sanity/seed.ndjson'

type LocalizedKey<T> = {
  [K in keyof T]: T[K] extends string ? K : never
}[keyof T]

const localizedSiteValue = (read: (content: SiteContent) => string) =>
  Object.fromEntries(languages.map((language) => [language, read(fallbackContent[language])]))

const localizedProductField = (
  index: number,
  key: LocalizedKey<ProductItem>,
) =>
  Object.fromEntries(
    languages.map((language) => [
      language,
      fallbackContent[language].products[index][key] as string,
    ]),
  )

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

const localizedSiteList = (
  read: (content: SiteContent) => string[],
  keyPrefix: string,
  type = 'localizedString',
) =>
  read(fallbackContent.pt).map((_, itemIndex) => ({
    _key: `${keyPrefix}-${itemIndex}`,
    _type: type,
    ...localizedSiteValue((content) => read(content)[itemIndex]),
  }))

const contentCards = (read: (content: SiteContent) => ContentCard[], keyPrefix: string) =>
  read(fallbackContent.pt).map((_, itemIndex) => ({
    _key: `${keyPrefix}-${itemIndex}`,
    _type: 'contentCard',
    title: localizedSiteValue((content) => read(content)[itemIndex].title),
    text: localizedSiteValue((content) => read(content)[itemIndex].text),
  }))

const copyBlock = (read: (content: SiteContent) => SiteContent['home']['hero']) => ({
  kicker: localizedSiteValue((content) => read(content).kicker),
  title: localizedSiteValue((content) => read(content).title),
  lead: localizedSiteValue((content) => read(content).lead),
})

const staticImageAsset = (image: ContentImage, alt: Record<LanguageCode, string>) => {
  const source = image.url.startsWith('/')
    ? pathToFileURL(resolve('static', image.url.slice(1))).href
    : image.url

  return {
    _type: 'image',
    _sanityAsset: `image@${source}`,
    alt,
  }
}

const imageFromSiteContent = (read: (content: SiteContent) => ContentImage) =>
  staticImageAsset(read(fallbackContent.pt), localizedSiteValue((content) => read(content).alt))

const localizedStoreImageAlt = (productIndex: number, imageIndex: number) =>
  Object.fromEntries(
    languages.map((language) => {
      const product = fallbackContent[language].storeProducts[productIndex]
      const image = product.images?.[imageIndex] ?? product.image
      return [language, image?.alt ?? '']
    }),
  ) as Record<LanguageCode, string>

const storeProductImage = (productIndex: number) => {
  const image = fallbackContent.pt.storeProducts[productIndex].image
  return image ? staticImageAsset(image, localizedStoreImageAlt(productIndex, 0)) : undefined
}

const storeProductGallery = (productIndex: number) => {
  const images = fallbackContent.pt.storeProducts[productIndex].images?.slice(1) ?? []
  return images.length
    ? images.map((image, index) => ({
        _key: `gallery-${index + 1}`,
        ...staticImageAsset(image, localizedStoreImageAlt(productIndex, index + 1)),
      }))
    : undefined
}

const siteContentDocument = {
  _id: 'siteContent',
  _type: 'siteLanding',
  title: 'Conteúdo do site DaFábrica4You',
  common: {
    contactEmail: fallbackContent.pt.common.contactEmail,
    contactPhone: fallbackContent.pt.common.contactPhone,
    whatsappUrl: fallbackContent.pt.common.whatsappUrl,
    whatsappLabel: localizedSiteValue((content) => content.common.whatsappLabel),
    socialLabel: localizedSiteValue((content) => content.common.socialLabel),
    youtubeUrl: fallbackContent.pt.common.youtubeUrl,
    facebookUrl: fallbackContent.pt.common.facebookUrl,
    instagramUrl: fallbackContent.pt.common.instagramUrl,
    complaintsUrl: fallbackContent.pt.common.complaintsUrl,
    complaintsLabel: localizedSiteValue((content) => content.common.complaintsLabel),
    complaintsNote: localizedSiteValue((content) => content.common.complaintsNote),
    privacyPolicyUrl: fallbackContent.pt.common.privacyPolicyUrl,
    privacyPolicyLabel: localizedSiteValue((content) => content.common.privacyPolicyLabel),
    cookiePolicyUrl: fallbackContent.pt.common.cookiePolicyUrl,
    cookiePolicyLabel: localizedSiteValue((content) => content.common.cookiePolicyLabel),
    marketingConsent: localizedSiteValue((content) => content.common.marketingConsent),
  },
  home: {
    hero: copyBlock((content) => content.home.hero),
    heroImage: imageFromSiteContent((content) => content.home.heroImage),
    heroVideoUrl: fallbackContent.pt.home.heroVideoUrl,
    intro: copyBlock((content) => content.home.intro),
    impact: {
      title: localizedSiteValue((content) => content.home.impact.title),
      lead: localizedSiteValue((content) => content.home.impact.lead),
      stats: contentCards((content) => content.home.impact.stats, 'impact-stat'),
    },
    partners: {
      kicker: localizedSiteValue((content) => content.home.partners.kicker),
      title: localizedSiteValue((content) => content.home.partners.title),
      lead: localizedSiteValue((content) => content.home.partners.lead),
      items: fallbackContent.pt.home.partners.items.map((partner, itemIndex) => ({
        _key: `partner-${itemIndex}`,
        _type: 'partnerItem',
        name: partner.name,
        url: partner.url,
        logo: staticImageAsset(
          partner.logo,
          localizedSiteValue((content) => content.home.partners.items[itemIndex].logo.alt),
        ),
        logoTone: partner.logoTone,
        text: localizedSiteValue((content) => content.home.partners.items[itemIndex].text),
      })),
    },
  },
  about: {
    hero: copyBlock((content) => content.about.hero),
    timeline: contentCards((content) => content.about.timeline, 'timeline'),
  },
  productsPage: {
    hero: copyBlock((content) => content.productsPage.hero),
    heroImage: imageFromSiteContent((content) => content.productsPage.heroImage),
    lead: localizedSiteValue((content) => content.productsPage.lead),
  },
  storePage: {
    hero: copyBlock((content) => content.storePage.hero),
    lead: localizedSiteValue((content) => content.storePage.lead),
  },
  catalogue: {
    hero: copyBlock((content) => content.catalogue.hero),
    ctaLabel: localizedSiteValue((content) => content.catalogue.ctaLabel),
    estimate: {
      kicker: localizedSiteValue((content) => content.catalogue.estimate.kicker),
      title: localizedSiteValue((content) => content.catalogue.estimate.title),
      lead: localizedSiteValue((content) => content.catalogue.estimate.lead),
      checklistTitle: localizedSiteValue((content) => content.catalogue.estimate.checklistTitle),
      checklist: localizedSiteList(
        (content) => content.catalogue.estimate.checklist,
        'estimate-checklist',
      ),
    },
    note: localizedSiteValue((content) => content.catalogue.note),
  },
  casesPage: {
    hero: copyBlock((content) => content.casesPage.hero),
    heroImage: imageFromSiteContent((content) => content.casesPage.heroImage),
  },
  blogPage: {
    hero: copyBlock((content) => content.blogPage.hero),
    heroImage: imageFromSiteContent((content) => content.blogPage.heroImage),
  },
  contactPage: {
    hero: copyBlock((content) => content.contactPage.hero),
    formLabels: Object.fromEntries(
      contactFieldKeys.map((key) => [
        key,
        localizedSiteValue((content) => content.contactPage.formLabels[key]),
      ]),
    ),
    fields: localizedSiteList((content) => content.contactPage.fields, 'contact-field'),
  },
}

const productDocuments = fallbackContent.pt.products.map((product, index) => ({
  _id: `productCategory-${product.slug}`,
  _type: 'productCategory',
  title: localizedProductField(index, 'title'),
  slug: {_type: 'slug', current: product.slug},
  summary: localizedProductField(index, 'summary'),
  description: localizedProductField(index, 'description'),
  orderRank: (index + 1) * 10,
}))

const storeProductDocuments = fallbackContent.pt.storeProducts.map((product, productIndex) => ({
  _id: `storeProduct-${product.slug}`,
  _type: 'storeProduct',
  title: localizedStoreValue(productIndex, (item) => item.title),
  slug: {_type: 'slug', current: product.slug},
  category: product.category,
  summary: localizedStoreValue(productIndex, (item) => item.summary),
  cataloguePage: product.cataloguePage,
  image: storeProductImage(productIndex),
  gallery: storeProductGallery(productIndex),
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
}))

const documents = [siteContentDocument, ...productDocuments, ...storeProductDocuments]

await mkdir('.sanity', {recursive: true})
await writeFile(outputFile, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)

console.log(`Wrote ${documents.length} Sanity seed documents to ${outputFile}`)
