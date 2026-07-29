import {createClient} from '@sanity/client'
const c = createClient({projectId: 'u4uyfix8', dataset: 'production', apiVersion: '2026-06-10', useCdn: false, token: process.env.SANITY_WRITE_TOKEN, perspective: 'published'})
const doc = await c.getDocument('siteContent') as any
console.log(JSON.stringify(doc.blogPage, null, 1).slice(0, 2500))
