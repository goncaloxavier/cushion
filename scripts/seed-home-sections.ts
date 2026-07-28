/**
 * Converts the landing page's hardcoded blocks into `siteLanding.home.sections`
 * so the client can reorder, hide and interleave them like any other section.
 *
 * The hero is deliberately not converted — it stays a pinned block on `/`.
 *
 * Until this runs, `/` falls back to rendering the original blocks, so the live
 * page is never blank halfway through. Running it is the switch-over.
 *
 *   npx tsx --env-file-if-exists=.env scripts/seed-home-sections.ts           # dry run
 *   npx tsx --env-file-if-exists=.env scripts/seed-home-sections.ts --write   # apply
 */
import {createClient} from '@sanity/client'
import {randomUUID} from 'node:crypto'

const projectId = 'u4uyfix8'
const apiVersion = '2026-07-13'
const write = process.argv.includes('--write')

const token = process.env.SANITY_WRITE_TOKEN
if (!token) {
  console.error('SANITY_WRITE_TOKEN is required.')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_DATASET || 'production',
  apiVersion,
  token,
  useCdn: false,
  perspective: 'raw',
})

const key = () => randomUUID().replace(/-/g, '').slice(0, 12)

const layout = (tone: string, columns?: number, mobileColumns?: number) => ({
  _type: 'builderLayout',
  tone,
  width: 'default',
  spacing: 'default',
  ...(columns ? {columns} : {}),
  ...(mobileColumns ? {mobileColumns} : {}),
})

type Localized = Record<string, unknown> | undefined

const main = async () => {
  const doc = await client.getDocument('siteContent')
  if (!doc) {
    console.error('siteContent not found.')
    process.exit(1)
  }

  const home = (doc.home ?? {}) as Record<string, any>
  if (Array.isArray(home.sections) && home.sections.length) {
    console.log(`home.sections already has ${home.sections.length} item(s). Nothing to do.`)
    return
  }

  const sections: Record<string, unknown>[] = []

  // Solutions grid -> the automatic product list it already was.
  sections.push({
    _type: 'builderCollectionSection',
    _key: key(),
    internalLabel: 'Soluções em destaque',
    enabled: true,
    source: 'productCategory',
    limit: 4,
    showSearch: false,
    showPagination: false,
    layout: layout('fog', 4, 1),
  })

  // Impact numbers -> stats, carrying the existing title and cards across.
  const stats = Array.isArray(home.impact?.stats) ? home.impact.stats : []
  if (home.impact?.title || stats.length) {
    sections.push({
      _type: 'builderStatsSection',
      _key: key(),
      internalLabel: 'Impacto e prova',
      enabled: true,
      title: home.impact?.title as Localized,
      items: stats.map((stat: Record<string, unknown>) => ({
        _type: 'builderStat',
        _key: key(),
        value: stat.title,
        label: stat.text,
      })),
      layout: layout('deep', 4, 2),
    })
  }

  // Case studies grid -> the automatic case list it already was.
  sections.push({
    _type: 'builderCollectionSection',
    _key: key(),
    internalLabel: 'Casos em uso real',
    enabled: true,
    source: 'caseStudy',
    limit: 3,
    showSearch: false,
    showPagination: false,
    layout: layout('white', 3, 1),
  })

  // Partners -> builderPartnersSection, which takes the very same partnerItem
  // objects, so this is a copy rather than a conversion.
  const partners = Array.isArray(home.partners?.items) ? home.partners.items : []
  if (partners.length) {
    sections.push({
      _type: 'builderPartnersSection',
      _key: key(),
      internalLabel: 'Parceiros e projetos',
      enabled: true,
      eyebrow: home.partners?.kicker as Localized,
      title: home.partners?.title as Localized,
      body: home.partners?.lead as Localized,
      items: partners.map((partner: Record<string, unknown>) => ({
        ...partner,
        _type: 'partnerItem',
        _key: typeof partner._key === 'string' ? partner._key : key(),
      })),
      layout: layout('white', 4, 2),
    })
  }

  console.log(`Would write ${sections.length} section(s) to siteContent.home.sections:`)
  for (const section of sections) {
    console.log(`  - ${section._type}  ${section.internalLabel}`)
  }

  if (!write) {
    console.log('\nDry run. Re-run with --write to apply.')
    return
  }

  await client.patch('siteContent').set({'home.sections': sections}).commit()
  console.log('\nWritten to the published siteContent document.')
  console.log('Publish from the editor (or Studio) if a draft is shadowing it.')
}

void main()
