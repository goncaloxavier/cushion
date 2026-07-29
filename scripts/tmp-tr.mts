import {createClient} from '@sanity/client'
const c = createClient({projectId: 'u4uyfix8', dataset: 'production', apiVersion: '2026-06-10', useCdn: false, token: process.env.SANITY_WRITE_TOKEN, perspective: 'published'})
const doc = await c.fetch<any>(`*[_id == "siteContent"][0]`)

const walk = (value: any, path: string, out: string[]) => {
  if (!value || typeof value !== 'object') return
  if (typeof value._type === 'string' && /^localized(String|Text)$/.test(value._type)) {
    for (const lang of ['en', 'es']) {
      if (value.pt?.trim() && !value[lang]?.trim()) out.push(`${path}.${lang}  pt="${String(value.pt).slice(0, 48)}"`)
    }
    return
  }
  if (Array.isArray(value)) { value.forEach((v, i) => walk(v, `${path}[${v?._key ?? i}]`, out)); return }
  for (const [k, v] of Object.entries(value)) if (!k.startsWith('_')) walk(v, path ? `${path}.${k}` : k, out)
}
const gaps: string[] = []
walk(doc, '', gaps)
console.log(`siteContent untranslated fields: ${gaps.length}`)
for (const g of gaps) console.log('  ' + g)
