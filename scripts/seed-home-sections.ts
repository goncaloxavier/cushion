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
import {buildHomeSections} from '../src/lib/builder/home-sections'

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

  const sections = buildHomeSections(doc as Record<string, any>, key)

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
