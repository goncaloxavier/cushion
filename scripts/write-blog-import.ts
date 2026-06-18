import {createHash} from 'node:crypto'
import {mkdir, writeFile} from 'node:fs/promises'
import {oldBlogPosts} from './old-blog-posts'

const outputFile = '.sanity/blog-import.ndjson'
const maxDocumentIdLength = 128

const blogPostId = (slug: string) => {
  const base = `blogPost-${slug}`
  if (base.length <= maxDocumentIdLength) return base

  const hash = createHash('sha1').update(slug).digest('hex').slice(0, 8)
  const maxSlugLength = maxDocumentIdLength - 'blogPost-'.length - hash.length - 1
  return `blogPost-${slug.slice(0, maxSlugLength)}-${hash}`
}

// Maps the reviewable, trilingual data module into Sanity import ndjson.
// Cover images are referenced by URL via `_sanityAsset`, so `sanity dataset import`
// downloads and uploads them during import (reusing the CLI login — no token needed).
const documents = oldBlogPosts.map((post) => ({
  _id: blogPostId(post.slug),
  _type: 'blogPost',
  title: post.title,
  slug: {_type: 'slug', current: post.slug},
  publishedAt: post.publishedAt,
  category: post.category,
  excerpt: post.excerpt,
  body: post.body,
  image: {
    _type: 'image',
    _sanityAsset: `image@${post.coverImageUrl}`,
    alt: post.title,
  },
}))

const slugs = documents.map((document) => document._id)
const duplicates = slugs.filter((slug, index) => slugs.indexOf(slug) !== index)
if (duplicates.length) {
  throw new Error(`Duplicate blog import ids: ${[...new Set(duplicates)].join(', ')}`)
}

await mkdir('.sanity', {recursive: true})
await writeFile(outputFile, `${documents.map((document) => JSON.stringify(document)).join('\n')}\n`)

console.log(`Wrote ${documents.length} blog import documents to ${outputFile}`)
