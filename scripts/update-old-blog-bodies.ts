import {readFile, writeFile} from 'node:fs/promises'
import {oldBlogPosts, type OldBlogPost} from './old-blog-posts'

type RawPost = {
  slug: string
  body: string
}

type TranslationCache = Record<string, {en?: string; es?: string}>

const rawFile = '.sanity/old-blog-raw.json'
const cacheFile = '.sanity/old-blog-translations.json'
const outputFile = 'scripts/old-blog-posts.ts'
const translateChunkSize = 3200
const translateEndpoint = 'https://translate.googleapis.com/translate_a/single'

const escapeTemplate = (value: string) =>
  value
    .replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('${', '\\${')
    .replace(/\r\n?/g, '\n')
    .trim()

const quoted = (value: string) => `'${value.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`

const localizedObject = (
  value: OldBlogPost['title'] | OldBlogPost['category'] | OldBlogPost['excerpt'],
  indent = '    ',
) => [
  `{`,
  `${indent}  pt: ${quoted(value.pt)},`,
  `${indent}  en: ${quoted(value.en)},`,
  `${indent}  es: ${quoted(value.es)},`,
  `${indent}}`,
]

const localizedBodyObject = (value: OldBlogPost['body'], indent = '    ') => [
  `{`,
  `${indent}  pt: \`${escapeTemplate(value.pt)}\`,`,
  `${indent}  en: \`${escapeTemplate(value.en)}\`,`,
  `${indent}  es: \`${escapeTemplate(value.es)}\`,`,
  `${indent}}`,
]

const chunkText = (text: string) => {
  const paragraphs = text.split(/\n{2,}/)
  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    const next = current ? `${current}\n\n${paragraph}` : paragraph
    if (next.length <= translateChunkSize) {
      current = next
      continue
    }

    if (current) chunks.push(current)

    if (paragraph.length <= translateChunkSize) {
      current = paragraph
      continue
    }

    for (let index = 0; index < paragraph.length; index += translateChunkSize) {
      chunks.push(paragraph.slice(index, index + translateChunkSize))
    }
    current = ''
  }

  if (current) chunks.push(current)
  return chunks
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const translate = async (text: string, target: 'en' | 'es') => {
  const chunks = chunkText(text)
  const translated: string[] = []

  for (const chunk of chunks) {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: 'pt',
      tl: target,
      dt: 't',
      q: chunk,
    })

    let lastError: unknown
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(`${translateEndpoint}?${params}`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        translated.push(data?.[0]?.map((part: [string]) => part[0]).join('') ?? '')
        lastError = undefined
        break
      } catch (error) {
        lastError = error
        await sleep(500 * attempt)
      }
    }

    if (lastError) throw lastError
    await sleep(80)
  }

  return translated.join('\n\n').trim()
}

const render = (
  posts: OldBlogPost[],
) => `// Migrated content from the previous DaFábrica4You blog (https://www.dafabrica4you.pt/blog/).
// Portuguese bodies are extracted from the raw Webnode HTML. English and Spanish are full-body machine translations for review.
// This file is the reviewable artifact — edit here, then run \`npm run import:blog\`.

export type Localized = {pt: string; en: string; es: string}

export type OldBlogPost = {
  slug: string
  publishedAt: string // YYYY-MM-DD
  coverImageUrl: string
  title: Localized
  category: Localized
  excerpt: Localized
  body: Localized
}

export const oldBlogPosts: OldBlogPost[] = [
${posts
  .map(
    (post) => `  {
    slug: ${quoted(post.slug)},
    publishedAt: ${quoted(post.publishedAt)},
    coverImageUrl: ${quoted(post.coverImageUrl)},
    title: ${localizedObject(post.title).join('\n')},
    category: ${localizedObject(post.category).join('\n')},
    excerpt: ${localizedObject(post.excerpt).join('\n')},
    body: ${localizedBodyObject(post.body).join('\n')},
  },`,
  )
  .join('\n')}
]
`

const rawPosts = JSON.parse(await readFile(rawFile, 'utf8')) as RawPost[]
const rawBySlug = new Map(rawPosts.map((post) => [post.slug, post.body.trim()]))
let cache: TranslationCache = {}

try {
  cache = JSON.parse(await readFile(cacheFile, 'utf8')) as TranslationCache
} catch {
  cache = {}
}

const missingRaw = oldBlogPosts.filter((post) => !rawBySlug.has(post.slug)).map((post) => post.slug)
if (missingRaw.length) {
  throw new Error(`Missing raw blog bodies for: ${missingRaw.join(', ')}`)
}

const updated: OldBlogPost[] = []

for (const [index, post] of oldBlogPosts.entries()) {
  const pt = rawBySlug.get(post.slug) ?? post.body.pt
  const entry = (cache[post.slug] ??= {})

  if (!entry.en) entry.en = await translate(pt, 'en')
  if (!entry.es) entry.es = await translate(pt, 'es')

  updated.push({
    ...post,
    body: {
      pt,
      en: entry.en,
      es: entry.es,
    },
  })

  await writeFile(cacheFile, `${JSON.stringify(cache, null, 2)}\n`)
  console.log(`${index + 1}/${oldBlogPosts.length} ${post.slug}`)
}

await writeFile(outputFile, render(updated))
console.log(`Updated ${outputFile} with ${updated.length} full blog bodies`)
