import {existsSync, readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'

const projectId = 'u4uyfix8'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = '2026-06-10'

const loadLocalEnv = () => {
  if (!existsSync('.env')) return

  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key]) continue

    const value = rawValue.replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

loadLocalEnv()

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

type SiteDoc = {
  _id: string
  footer?: unknown
  home?: {manifesto?: unknown}
  about?: {principles?: unknown}
  catalogue?: {quoteFlow?: unknown; estimate?: {cards?: unknown}}
  blogPage?: {newsletter?: unknown}
}

type ProductDoc = {
  _id: string
  features?: unknown
  applications?: unknown
}

const siteDocs = await client.fetch<SiteDoc[]>(
  `*[_type == "siteLanding" || _id in ["siteContent", "drafts.siteContent"]]{
    _id,
    footer,
    home{manifesto},
    about{principles},
    catalogue{quoteFlow, estimate{cards}},
    blogPage{newsletter}
  }`,
)

const productDocs = await client.fetch<ProductDoc[]>(
  `*[_type == "productCategory" && (defined(features) || defined(applications))]{
    _id,
    features,
    applications
  }`,
)

const patches: {id: string; unset: string[]}[] = []
const isPresent = (value: unknown) => value !== undefined && value !== null

for (const doc of siteDocs) {
  const unset = [
    isPresent(doc.footer) ? 'footer' : '',
    isPresent(doc.home?.manifesto) ? 'home.manifesto' : '',
    isPresent(doc.about?.principles) ? 'about.principles' : '',
    isPresent(doc.catalogue?.quoteFlow) ? 'catalogue.quoteFlow' : '',
    isPresent(doc.catalogue?.estimate?.cards) ? 'catalogue.estimate.cards' : '',
    isPresent(doc.blogPage?.newsletter) ? 'blogPage.newsletter' : '',
  ].filter(Boolean)

  if (unset.length) patches.push({id: doc._id, unset})
}

for (const doc of productDocs) {
  const unset = [
    isPresent(doc.features) ? 'features' : '',
    isPresent(doc.applications) ? 'applications' : '',
  ].filter(Boolean)

  if (unset.length) patches.push({id: doc._id, unset})
}

if (!patches.length) {
  console.log('No removed website fields found.')
  process.exit(0)
}

let transaction = client.transaction()
for (const patch of patches) {
  transaction = transaction.patch(patch.id, (p) => p.unset(patch.unset))
}

await transaction.commit({visibility: 'sync'})

console.log(`Cleaned ${patches.length} document(s):`)
for (const patch of patches) {
  console.log(`- ${patch.id}: ${patch.unset.join(', ')}`)
}
