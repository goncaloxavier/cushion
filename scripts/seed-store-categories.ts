import {createClient} from '@sanity/client'
import {defaultStoreCategories} from '../src/lib/store-categories'

const projectId = 'u4uyfix8'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = '2026-07-13'

if (process.env.SANITY_ALLOW_WRITE !== 'true') {
  throw new Error(
    `Refusing to write to Sanity (dataset "${dataset}"). ` +
      'Set SANITY_ALLOW_WRITE=true to seed Loja categories deliberately.',
  )
}

const token = process.env.SANITY_WRITE_TOKEN || process.env.SANITY_API_WRITE_TOKEN
if (!token) throw new Error('Configure SANITY_WRITE_TOKEN with update access.')

const client = createClient({projectId, dataset, apiVersion, token, useCdn: false})

for (const [index, category] of defaultStoreCategories.entries()) {
  const existing = await client.fetch<{_id: string} | null>(
    `*[_type == "storeCategory" && slug.current == $slug && !(_id in path("versions.**"))][0]{_id}`,
    {slug: category.slug},
  )
  const fields = {
    title: {_type: 'localizedString', ...category.labels},
    slug: {_type: 'slug', current: category.slug},
    orderRank: (index + 1) * 10,
  }

  if (existing) {
    await client.patch(existing._id).setIfMissing(fields).commit({visibility: 'sync'})
    console.log(`Kept ${category.labels.pt} (${existing._id})`)
    continue
  }

  const id = `storeCategory-${category.slug}`
  await client.createIfNotExists({_id: id, _type: 'storeCategory', ...fields})
  console.log(`Created ${category.labels.pt} (${id})`)
}

console.log(`Loja categories are ready in dataset "${dataset}".`)
