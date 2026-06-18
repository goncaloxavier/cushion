import {mkdir, writeFile} from 'node:fs/promises'
import {oldBlogPosts} from './old-blog-posts'

const outputFile = '.sanity/blog-import.ndjson'

// Maps the reviewable, trilingual data module into Sanity import ndjson.
// Cover images are referenced by URL via `_sanityAsset`, so `sanity dataset import`
// downloads and uploads them during import (reusing the CLI login — no token needed).
const documents = oldBlogPosts.map((post) => ({
  _id: `blogPost.${post.slug}`,
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
