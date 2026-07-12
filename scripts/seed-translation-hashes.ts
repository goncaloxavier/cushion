import {existsSync, readFileSync} from 'node:fs'
import {createClient} from '@sanity/client'
import {findLocalizedFields} from '../src/lib/server/translate-content'

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

// Seeds `translationHash` for every existing localized field's CURRENT
// content, without ever touching `.en`/`.es`. This must run once, before the
// translation webhook is ever enabled: otherwise the very first publish of
// any existing document would find every field "never translated" and
// silently overwrite the already hand-translated blog posts and product
// copy. Only fields that have NEVER been hashed are seeded (`!currentHash`)
// — a field that already carries a hash is left alone, since it's already
// being managed by the real translation pipeline.
const managedTypes = ['siteLanding', 'productCategory', 'storeProduct', 'caseStudy', 'blogPost']
const dryRun = process.argv.includes('--dry-run')

const docs = await client.fetch<Record<string, unknown>[]>(
  `*[_type in $types && !(_id in path("drafts.**"))]`,
  {types: managedTypes},
)

const patches = docs
  .map((doc) => {
    const set = Object.fromEntries(
      findLocalizedFields(doc)
        .filter((task) => !task.currentHash)
        .map((task) => [`${task.patchPath}.translationHash`, task.hash]),
    )
    return {id: doc._id as string, set}
  })
  .filter((patch) => Object.keys(patch.set).length)

console.log(`${patches.length} document(s) to seed (dry-run=${dryRun})`)

if (dryRun) {
  for (const patch of patches) {
    console.log(`- ${patch.id}: ${Object.keys(patch.set).length} field(s)`)
  }
  process.exit(0)
}

if (!patches.length) {
  console.log('Nothing to seed.')
  process.exit(0)
}

let transaction = client.transaction()
for (const patch of patches) {
  transaction = transaction.patch(patch.id, (p) => p.set(patch.set))
}

await transaction.commit({visibility: 'sync'})

console.log(`Seeded translationHash on ${patches.length} document(s).`)
