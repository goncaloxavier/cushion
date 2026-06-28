import {createReadStream, existsSync, readFileSync} from 'node:fs'
import {basename, resolve} from 'node:path'
import {createClient} from '@sanity/client'

const projectId = 'u4uyfix8'
const dataset = process.env.SANITY_DATASET || 'production'
const apiVersion = '2026-06-10'

type LocalizedAlt = {
  pt: string
  en: string
  es: string
}

type StoreImageBatch = {
  slug: string
  images: {path: string; alt: LocalizedAlt}[]
}

const batches: StoreImageBatch[] = [
  {
    slug: 'banco-gaviao',
    images: [
      {
        path: 'static/images/store/banco-gaviao-01.jpeg',
        alt: {
          pt: 'Banco Gavião em acabamento escuro sobre relva artificial.',
          en: 'Banco Gavião bench in dark finish on artificial grass.',
          es: 'Banco Gavião en acabado oscuro sobre césped artificial.',
        },
      },
      {
        path: 'static/images/store/banco-gaviao-02.jpeg',
        alt: {
          pt: 'Vista frontal aproximada do Banco Gavião.',
          en: 'Closer front view of the Banco Gavião bench.',
          es: 'Vista frontal aproximada del Banco Gavião.',
        },
      },
      {
        path: 'static/images/store/banco-gaviao-03.jpeg',
        alt: {
          pt: 'Banco Gavião visto de frente com os apoios laterais visíveis.',
          en: 'Front view of the Banco Gavião with side supports visible.',
          es: 'Banco Gavião visto de frente con los soportes laterales visibles.',
        },
      },
    ],
  },
  {
    slug: 'cadeira-atalaia',
    images: [
      {
        path: 'static/images/store/cadeira-atalaia-01.jpeg',
        alt: {
          pt: 'Duas cadeiras Atalaia com uma mesa pequena sobre relva artificial.',
          en: 'Two Cadeira Atalaia chairs with a small table on artificial grass.',
          es: 'Dos sillas Atalaia con una mesa pequeña sobre césped artificial.',
        },
      },
      {
        path: 'static/images/store/cadeira-atalaia-02.jpeg',
        alt: {
          pt: 'Vista lateral da Cadeira Atalaia em acabamento natural.',
          en: 'Side view of the Cadeira Atalaia in natural finish.',
          es: 'Vista lateral de la silla Atalaia en acabado natural.',
        },
      },
      {
        path: 'static/images/store/cadeira-atalaia-03.jpeg',
        alt: {
          pt: 'Duas pessoas em pé sobre a Cadeira Atalaia.',
          en: 'Two people standing on the Cadeira Atalaia chair.',
          es: 'Dos personas de pie sobre la silla Atalaia.',
        },
      },
    ],
  },
  {
    slug: 'banco-montargil',
    images: [
      {
        path: 'static/images/store/banco-montargil-01.jpeg',
        alt: {
          pt: 'Banco Montargil com costas em plástico reciclado cinza sobre relva artificial.',
          en: 'Banco Montargil bench with backrest in grey recycled plastic on artificial grass.',
          es: 'Banco Montargil con respaldo en plástico reciclado gris sobre césped artificial.',
        },
      },
      {
        path: 'static/images/store/banco-montargil-02.jpeg',
        alt: {
          pt: 'Vista frontal do Banco Montargil com o assento ripado e as costas.',
          en: 'Front view of the Banco Montargil showing the slatted seat and backrest.',
          es: 'Vista frontal del Banco Montargil con el asiento de listones y el respaldo.',
        },
      },
      {
        path: 'static/images/store/banco-montargil-03.jpeg',
        alt: {
          pt: 'Banco Montargil visto de frente com os apoios em cavalete visíveis.',
          en: 'Front view of the Banco Montargil with the trestle supports visible.',
          es: 'Banco Montargil visto de frente con los soportes de caballete visibles.',
        },
      },
    ],
  },
  {
    slug: 'mesa-vale-do-arco',
    images: [
      {
        path: 'static/images/store/mesa-vale-do-arco-01.jpeg',
        alt: {
          pt: 'Mesa de piquenique Vale do Arco com bancos integrados, em plástico reciclado, sobre relva artificial.',
          en: 'Vale do Arco picnic table with integrated benches in recycled plastic on artificial grass.',
          es: 'Mesa de picnic Vale do Arco con bancos integrados en plástico reciclado sobre césped artificial.',
        },
      },
      {
        path: 'static/images/store/mesa-vale-do-arco-02.jpeg',
        alt: {
          pt: 'Vista de três quartos da mesa de piquenique Vale do Arco.',
          en: 'Three-quarter view of the Vale do Arco picnic table.',
          es: 'Vista de tres cuartos de la mesa de picnic Vale do Arco.',
        },
      },
      {
        path: 'static/images/store/mesa-vale-do-arco-03.jpeg',
        alt: {
          pt: 'Vista superior da mesa Vale do Arco com o tampo ripado.',
          en: 'Top view of the Vale do Arco table showing the slatted top.',
          es: 'Vista superior de la mesa Vale do Arco con el tablero de listones.',
        },
      },
    ],
  },
  {
    slug: 'papeleira-reta',
    images: [
      {
        path: 'static/images/store/papeleira-reta-01.jpeg',
        alt: {
          pt: 'Papeleira reta quadrada em plástico reciclado escuro, vista de frente.',
          en: 'Square straight litter bin in dark recycled plastic, front view.',
          es: 'Papelera recta cuadrada en plástico reciclado oscuro, vista frontal.',
        },
      },
      {
        path: 'static/images/store/papeleira-reta-02.jpeg',
        alt: {
          pt: 'Papeleira reta vista de três quartos, com os pés de apoio visíveis.',
          en: 'Three-quarter view of the straight litter bin with its support feet visible.',
          es: 'Vista de tres cuartos de la papelera recta con los pies de apoyo visibles.',
        },
      },
    ],
  },
  {
    slug: 'cadeira-de-bar',
    images: [
      {
        path: 'static/images/store/cadeira-de-bar-01.jpeg',
        alt: {
          pt: 'Cadeira de bar em plástico reciclado com costas, vista de frente.',
          en: 'Recycled-plastic bar chair with backrest, front view.',
          es: 'Silla de bar en plástico reciclado con respaldo, vista frontal.',
        },
      },
      {
        path: 'static/images/store/cadeira-de-bar-02.jpeg',
        alt: {
          pt: 'Vista de perfil da cadeira de bar, com o repousa-pés.',
          en: 'Side profile of the bar chair showing the footrest.',
          es: 'Vista de perfil de la silla de bar con el reposapiés.',
        },
      },
      {
        path: 'static/images/store/cadeira-de-bar-03.jpeg',
        alt: {
          pt: 'Pessoa sentada na cadeira de bar, mostrando a altura do assento.',
          en: 'A person seated on the bar chair, showing the seat height.',
          es: 'Una persona sentada en la silla de bar, mostrando la altura del asiento.',
        },
      },
    ],
  },
  {
    slug: 'conjunto-domingao',
    images: [
      {
        path: 'static/images/store/conjunto-domingao-01.jpeg',
        alt: {
          pt: 'Conjunto Domingão: mesa de piquenique com bancos integrados em plástico reciclado, vista de frente.',
          en: 'Conjunto Domingão: picnic table with integrated benches in recycled plastic, front view.',
          es: 'Conjunto Domingão: mesa de picnic con bancos integrados en plástico reciclado, vista frontal.',
        },
      },
      {
        path: 'static/images/store/conjunto-domingao-02.jpeg',
        alt: {
          pt: 'Vista de três quartos do Conjunto Domingão com os dois bancos.',
          en: 'Three-quarter view of the Conjunto Domingão with both benches.',
          es: 'Vista de tres cuartos del Conjunto Domingão con los dos bancos.',
        },
      },
      {
        path: 'static/images/store/conjunto-domingao-03.jpeg',
        alt: {
          pt: 'Conjunto Domingão visto de frente, com o tampo e os bancos ripados.',
          en: 'Front view of the Conjunto Domingão showing the slatted top and benches.',
          es: 'Conjunto Domingão visto de frente, con el tablero y los bancos de listones.',
        },
      },
    ],
  },
  {
    slug: 'cadeira-pateo',
    images: [
      {
        path: 'static/images/store/cadeira-pateo-01.jpeg',
        alt: {
          pt: 'Cadeira de pátio em plástico reciclado com a mesa de apoio a condizer, sobre relva artificial.',
          en: 'Recycled-plastic patio chair with the matching side table on artificial grass.',
          es: 'Silla de patio en plástico reciclado con la mesa auxiliar a juego sobre césped artificial.',
        },
      },
      {
        path: 'static/images/store/cadeira-pateo-02.jpeg',
        alt: {
          pt: 'Cadeira de pátio vista de frente, com encosto inclinado e apoios de braços.',
          en: 'Front view of the patio chair with reclined backrest and armrests.',
          es: 'Vista frontal de la silla de patio con respaldo reclinado y reposabrazos.',
        },
      },
      {
        path: 'static/images/store/cadeira-pateo-03.jpeg',
        alt: {
          pt: 'Cadeira de pátio e mesa de apoio em conjunto sobre relva artificial.',
          en: 'Patio chair and side table together on artificial grass.',
          es: 'Silla de patio y mesa auxiliar juntas sobre césped artificial.',
        },
      },
    ],
  },
  {
    slug: 'mesa-de-apoio',
    images: [
      {
        path: 'static/images/store/mesa-de-apoio-01.jpeg',
        alt: {
          pt: 'Mesa de apoio compacta em plástico reciclado, com prateleira inferior, junto à cadeira de pátio.',
          en: 'Compact recycled-plastic side table with a lower shelf, next to the patio chair.',
          es: 'Mesa auxiliar compacta en plástico reciclado con balda inferior, junto a la silla de patio.',
        },
      },
      {
        path: 'static/images/store/mesa-de-apoio-02.jpeg',
        alt: {
          pt: 'Mesa de apoio e cadeira de pátio em conjunto sobre relva artificial.',
          en: 'Side table and patio chair together on artificial grass.',
          es: 'Mesa auxiliar y silla de patio juntas sobre césped artificial.',
        },
      },
      {
        path: 'static/images/store/mesa-de-apoio-03.jpeg',
        alt: {
          pt: 'Vista da mesa de apoio com o tampo e a prateleira ripados.',
          en: 'View of the side table showing the slatted top and shelf.',
          es: 'Vista de la mesa auxiliar con el tablero y la balda de listones.',
        },
      },
    ],
  },
]

const loadLocalEnv = () => {
  if (!existsSync('.env')) return

  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    const [, key, rawValue] = match
    if (process.env[key]) continue

    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '')
  }
}

const requestedSlug = process.argv.find((arg) => arg.startsWith('--slug='))?.split('=')[1]
const selectedBatches = requestedSlug
  ? batches.filter((batch) => batch.slug === requestedSlug)
  : batches

if (!selectedBatches.length) {
  throw new Error(`No Loja image batch found for slug "${requestedSlug}".`)
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

const imageField = (assetId: string, alt: LocalizedAlt, key?: string) => ({
  ...(key ? {_key: key} : {}),
  _type: 'image',
  asset: {
    _type: 'reference',
    _ref: assetId,
  },
  alt,
})

for (const batch of selectedBatches) {
  const documentId = await client.fetch<string | null>(
    `*[_type == "storeProduct" && slug.current == $slug][0]._id`,
    {slug: batch.slug},
  )

  if (!documentId) {
    throw new Error(`No storeProduct document found for slug "${batch.slug}".`)
  }

  const uploadedImages = []

  for (const [index, image] of batch.images.entries()) {
    const source = resolve(image.path)
    if (!existsSync(source)) throw new Error(`Missing image file: ${image.path}`)

    const asset = await client.assets.upload('image', createReadStream(source), {
      filename: basename(source),
    })

    uploadedImages.push(imageField(asset._id, image.alt, `store-gallery-${index + 1}`))
  }

  await client
    .patch(documentId)
    .set({
      image: imageField(uploadedImages[0].asset._ref, batch.images[0].alt),
      gallery: uploadedImages.slice(1),
    })
    .commit({visibility: 'sync'})

  console.log(
    `Updated ${batch.slug}: 1 primary image + ${Math.max(uploadedImages.length - 1, 0)} gallery image(s).`,
  )
}
