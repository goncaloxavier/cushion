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
  // Maintenance must inspect stored drafts as well as published documents.
  // The default published perspective hides `drafts.*` even when the GROQ
  // query explicitly asks for those IDs.
  perspective: 'raw',
})

type SiteDoc = {
  _id: string
  title?: unknown
  footer?: unknown
  home?: {
    manifesto?: unknown
    hero?: {kicker?: unknown; lead?: unknown}
    heroImage?: unknown
    intro?: unknown
    impact?: {lead?: unknown}
  }
  about?: {hero?: {lead?: unknown}; principles?: unknown}
  productsPage?: {hero?: {lead?: unknown}; lead?: unknown}
  storePage?: {
    hero?: {lead?: unknown}
    lead?: unknown
    categoryLabels?: unknown
    searchLabel?: unknown
    categoryLabel?: unknown
    finishLabel?: unknown
    sortLabel?: unknown
    allCategoriesLabel?: unknown
    sortOptions?: unknown
    finishLabels?: unknown
    priceFromLabel?: unknown
    requestLabel?: unknown
    noResults?: unknown
    vatNote?: unknown
    delivery?: unknown
    postalGate?: unknown
    detail?: unknown
  }
  catalogue?: {hero?: {lead?: unknown}; quoteFlow?: unknown; estimate?: {cards?: unknown}}
  casesPage?: {hero?: {lead?: unknown}}
  blogPage?: {hero?: {lead?: unknown}; newsletter?: unknown}
  contactPage?: {fields?: unknown; formLabels?: {name?: unknown}}
}

type ProductDoc = {
  _id: string
  features?: unknown
  applications?: unknown
  videoUrl?: unknown
  videoTitle?: unknown
  toolUrl?: unknown
  toolTitle?: unknown
  toolText?: unknown
  toolLabel?: unknown
}

type StoreCategoryDoc = {
  _id: string
  active?: unknown
}

const siteDocs = await client.fetch<SiteDoc[]>(
  `*[_type == "siteLanding" || _id in ["siteContent", "drafts.siteContent"]]{
    _id,
    title,
    footer,
    home{manifesto, hero{kicker, lead}, heroImage, intro, impact{lead}},
    about{hero{lead}, principles},
    productsPage{hero{lead}, lead},
    storePage{
      hero{lead},
      lead,
      categoryLabels,
      searchLabel,
      categoryLabel,
      finishLabel,
      sortLabel,
      allCategoriesLabel,
      sortOptions,
      finishLabels,
      priceFromLabel,
      requestLabel,
      noResults,
      vatNote,
      delivery,
      postalGate,
      detail
    },
    catalogue{hero{lead}, quoteFlow, estimate{cards}},
    casesPage{hero{lead}},
    blogPage{hero{lead}, newsletter},
    contactPage{fields, formLabels{name}}
  }`,
)

const productDocs = await client.fetch<ProductDoc[]>(
  `*[_type == "productCategory" && (
    defined(features) ||
    defined(applications) ||
    defined(videoUrl) ||
    defined(videoTitle) ||
    defined(toolUrl) ||
    defined(toolTitle) ||
    defined(toolText) ||
    defined(toolLabel)
  )]{
    _id,
    features,
    applications,
    videoUrl,
    videoTitle,
    toolUrl,
    toolTitle,
    toolText,
    toolLabel
  }`,
)

const storeCategoryDocs = await client.fetch<StoreCategoryDoc[]>(
  `*[_type == "storeCategory" && defined(active)]{_id, active}`,
)

const patches: {id: string; unset: string[]}[] = []
const isPresent = (value: unknown) => value !== undefined && value !== null

for (const doc of siteDocs) {
  const unset = [
    isPresent(doc.title) ? 'title' : '',
    isPresent(doc.footer) ? 'footer' : '',
    isPresent(doc.home?.manifesto) ? 'home.manifesto' : '',
    isPresent(doc.home?.hero?.kicker) ? 'home.hero.kicker' : '',
    isPresent(doc.home?.hero?.lead) ? 'home.hero.lead' : '',
    isPresent(doc.home?.heroImage) ? 'home.heroImage' : '',
    isPresent(doc.home?.intro) ? 'home.intro' : '',
    isPresent(doc.home?.impact?.lead) ? 'home.impact.lead' : '',
    isPresent(doc.about?.principles) ? 'about.principles' : '',
    isPresent(doc.about?.hero?.lead) ? 'about.hero.lead' : '',
    isPresent(doc.productsPage?.hero?.lead) ? 'productsPage.hero.lead' : '',
    isPresent(doc.productsPage?.lead) ? 'productsPage.lead' : '',
    isPresent(doc.storePage?.hero?.lead) ? 'storePage.hero.lead' : '',
    isPresent(doc.storePage?.lead) ? 'storePage.lead' : '',
    isPresent(doc.storePage?.categoryLabels) ? 'storePage.categoryLabels' : '',
    isPresent(doc.storePage?.searchLabel) ? 'storePage.searchLabel' : '',
    isPresent(doc.storePage?.categoryLabel) ? 'storePage.categoryLabel' : '',
    isPresent(doc.storePage?.finishLabel) ? 'storePage.finishLabel' : '',
    isPresent(doc.storePage?.sortLabel) ? 'storePage.sortLabel' : '',
    isPresent(doc.storePage?.allCategoriesLabel) ? 'storePage.allCategoriesLabel' : '',
    isPresent(doc.storePage?.sortOptions) ? 'storePage.sortOptions' : '',
    isPresent(doc.storePage?.finishLabels) ? 'storePage.finishLabels' : '',
    isPresent(doc.storePage?.priceFromLabel) ? 'storePage.priceFromLabel' : '',
    isPresent(doc.storePage?.requestLabel) ? 'storePage.requestLabel' : '',
    isPresent(doc.storePage?.noResults) ? 'storePage.noResults' : '',
    isPresent(doc.storePage?.vatNote) ? 'storePage.vatNote' : '',
    isPresent(doc.storePage?.delivery) ? 'storePage.delivery' : '',
    isPresent(doc.storePage?.postalGate) ? 'storePage.postalGate' : '',
    isPresent(doc.storePage?.detail) ? 'storePage.detail' : '',
    isPresent(doc.catalogue?.hero?.lead) ? 'catalogue.hero.lead' : '',
    isPresent(doc.catalogue?.quoteFlow) ? 'catalogue.quoteFlow' : '',
    isPresent(doc.catalogue?.estimate?.cards) ? 'catalogue.estimate.cards' : '',
    isPresent(doc.casesPage?.hero?.lead) ? 'casesPage.hero.lead' : '',
    isPresent(doc.blogPage?.hero?.lead) ? 'blogPage.hero.lead' : '',
    isPresent(doc.blogPage?.newsletter) ? 'blogPage.newsletter' : '',
    isPresent(doc.contactPage?.fields) ? 'contactPage.fields' : '',
    isPresent(doc.contactPage?.formLabels?.name) ? 'contactPage.formLabels.name' : '',
  ].filter(Boolean)

  if (unset.length) patches.push({id: doc._id, unset})
}

for (const doc of productDocs) {
  const unset = [
    isPresent(doc.features) ? 'features' : '',
    isPresent(doc.applications) ? 'applications' : '',
    isPresent(doc.videoUrl) ? 'videoUrl' : '',
    isPresent(doc.videoTitle) ? 'videoTitle' : '',
    isPresent(doc.toolUrl) ? 'toolUrl' : '',
    isPresent(doc.toolTitle) ? 'toolTitle' : '',
    isPresent(doc.toolText) ? 'toolText' : '',
    isPresent(doc.toolLabel) ? 'toolLabel' : '',
  ].filter(Boolean)

  if (unset.length) patches.push({id: doc._id, unset})
}

for (const doc of storeCategoryDocs) {
  if (isPresent(doc.active)) patches.push({id: doc._id, unset: ['active']})
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
