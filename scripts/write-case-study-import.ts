import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import {oldCaseStudies} from './old-case-studies'

const outputFile = '.sanity/case-study-import.ndjson'
const maxDocumentIdLength = 128

const caseStudyId = (slug: string) => {
  const base = `caseStudy-${slug}`
  if (base.length <= maxDocumentIdLength) return base

  const hash = createHash('sha1').update(slug).digest('hex').slice(0, 8)
  const maxSlugLength = maxDocumentIdLength - 'caseStudy-'.length - hash.length - 1
  return `caseStudy-${slug.slice(0, maxSlugLength)}-${hash}`
}

const stableKey = (value: string) => createHash('sha1').update(value).digest('hex').slice(0, 12)

const imageAsset = (url: string, alt: Record<'pt' | 'en' | 'es', string>, keyed = false) => ({
  _type: 'image',
  ...(keyed ? {_key: stableKey(url)} : {}),
  _sanityAsset: `image@${url}`,
  alt,
})

const documents = oldCaseStudies.map((study, index) => {
  const [mainImage, ...galleryImages] = study.images

  return {
    _id: caseStudyId(study.slug),
    _type: 'caseStudy',
    title: study.title,
    slug: {_type: 'slug', current: study.slug},
    location: study.location,
    productArea: study.productArea,
    summary: study.summary,
    description: study.description,
    image: mainImage ? imageAsset(mainImage, study.title) : undefined,
    gallery: galleryImages.map((url) => imageAsset(url, study.title, true)),
    orderRank: (index + 1) * 10,
  }
})

const ids = documents.map((document) => document._id)
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
if (duplicates.length) {
  throw new Error(`Duplicate case-study import ids: ${[...new Set(duplicates)].join(', ')}`)
}

await mkdir('.sanity', {recursive: true})
await writeFile(outputFile, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)

console.log(`Wrote ${documents.length} case-study import documents to ${outputFile}`)
