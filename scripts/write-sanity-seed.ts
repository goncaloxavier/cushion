import {mkdir, writeFile} from 'node:fs/promises'
import {plainArticleToPortableText} from '../src/lib/article-structure'
import {
  fallbackContent,
  type BlogPost,
  type CaseStudy,
  type LanguageCode,
  type ProductItem,
} from '../src/lib/site-content'

const languages: LanguageCode[] = ['pt', 'en', 'es']
const outputFile = '.sanity/seed.ndjson'

type LocalizedKey<T> = {
  [K in keyof T]: T[K] extends string ? K : never
}[keyof T]

type CollectionName = 'products' | 'caseStudies' | 'blogPosts'
type CollectionItem = ProductItem | CaseStudy | BlogPost

const localizedField = <T extends CollectionItem>(
  collection: CollectionName,
  index: number,
  key: LocalizedKey<T>,
) =>
  Object.fromEntries(
    languages.map((language) => [
      language,
      (fallbackContent[language][collection][index] as T)[key] as string,
    ]),
  )

const localizedArray = (
  collection: 'products',
  index: number,
  key: 'features' | 'applications',
  keyPrefix: string,
) => {
  const canonical = fallbackContent.pt[collection][index][key]

  return canonical.map((_, itemIndex) => ({
    _key: `${keyPrefix}-${itemIndex}`,
    _type: 'localizedString',
    ...Object.fromEntries(
      languages.map((language) => [
        language,
        fallbackContent[language][collection][index][key][itemIndex],
      ]),
    ),
  }))
}

const productDocuments = fallbackContent.pt.products.map((product, index) => ({
  _id: `productCategory.${product.slug}`,
  _type: 'productCategory',
  title: localizedField<ProductItem>('products', index, 'title'),
  slug: {_type: 'slug', current: product.slug},
  summary: localizedField<ProductItem>('products', index, 'summary'),
  description: localizedField<ProductItem>('products', index, 'description'),
  features: localizedArray('products', index, 'features', 'feature'),
  applications: localizedArray('products', index, 'applications', 'application'),
  orderRank: (index + 1) * 10,
}))

const caseDocuments = fallbackContent.pt.caseStudies.map((caseStudy, index) => ({
  _id: `caseStudy.${caseStudy.slug}`,
  _type: 'caseStudy',
  title: localizedField<CaseStudy>('caseStudies', index, 'title'),
  slug: {_type: 'slug', current: caseStudy.slug},
  location: caseStudy.location,
  productArea: localizedField<CaseStudy>('caseStudies', index, 'productArea'),
  summary: localizedField<CaseStudy>('caseStudies', index, 'summary'),
  challenge: localizedField<CaseStudy>('caseStudies', index, 'challenge'),
  solution: localizedField<CaseStudy>('caseStudies', index, 'solution'),
  result: localizedField<CaseStudy>('caseStudies', index, 'result'),
  orderRank: (index + 1) * 10,
}))

const blogDocuments = fallbackContent.pt.blogPosts.map((post) => {
  const index = fallbackContent.pt.blogPosts.findIndex((item) => item.slug === post.slug)
  const article = Object.fromEntries(
    languages.map((language) => [
      language,
      plainArticleToPortableText(fallbackContent[language].blogPosts[index].body),
    ]),
  )

  return {
    _id: `blogPost.${post.slug}`,
    _type: 'blogPost',
    title: localizedField<BlogPost>('blogPosts', index, 'title'),
    slug: {_type: 'slug', current: post.slug},
    publishedAt: post.publishedAt,
    category: localizedField<BlogPost>('blogPosts', index, 'category'),
    excerpt: localizedField<BlogPost>('blogPosts', index, 'excerpt'),
    body: localizedField<BlogPost>('blogPosts', index, 'body'),
    article,
  }
})

const documents = [...productDocuments, ...caseDocuments, ...blogDocuments]

await mkdir('.sanity', {recursive: true})
await writeFile(outputFile, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)

console.log(`Wrote ${documents.length} Sanity seed documents to ${outputFile}`)
