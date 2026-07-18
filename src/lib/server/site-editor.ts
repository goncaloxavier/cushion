import {randomUUID} from 'node:crypto'
import {createClient, type SanityClient} from '@sanity/client'
import {env} from '$env/dynamic/private'
import type {
  SiteEditorDocument,
  SiteEditorDocumentType,
  SiteEditorManifest,
  SiteEditorNode,
} from '$lib/site-editor/types'
import {createBuilderSection} from '$lib/builder/defaults'
import {invalidateSanityCollectionsCache} from '$lib/sanity'
import {defaultStoreCategoryOptions} from '$lib/store-categories'
import {editorDraftId, normalizeEditorDocumentId} from '$lib/site-editor/path'
import {
  createSiteEditorE2eDocument,
  deleteSiteEditorE2eDocument,
  getSiteEditorE2eDocument,
  getSiteEditorE2eManifest,
  publishSiteEditorE2eDocument,
  saveSiteEditorE2eDocument,
  siteEditorE2eEnabled,
} from './site-editor-e2e'
import {
  SiteEditorCategoryInUseError,
  SiteEditorDuplicateError,
  SiteEditorValidationError,
} from './site-editor-errors'
import {createSiteEditorStarterFields} from './site-editor-starters'

const projectId = 'u4uyfix8'
const apiVersion = '2026-07-13'

const documentTypes = new Set<SiteEditorDocumentType>([
  'siteLanding',
  'productCategory',
  'storeCategory',
  'storeProduct',
  'caseStudy',
  'blogPost',
  'sitePage',
])

const editableFields: Record<SiteEditorDocumentType, readonly string[]> = {
  siteLanding: [
    'navigation',
    'home',
    'about',
    'productsPage',
    'storePage',
    'cartPage',
    'returnsPolicy',
    'catalogue',
    'casesPage',
    'blogPage',
    'contactPage',
    'common',
  ],
  productCategory: [
    'title',
    'slug',
    'image',
    'gallery',
    'summary',
    'description',
    'dimensions',
    'materials',
    'specifications',
    'advantages',
    'orderRank',
  ],
  storeCategory: ['title', 'slug', 'orderRank'],
  storeProduct: [
    'title',
    'slug',
    'category',
    'summary',
    'hasFinishChoice',
    'image',
    'gallery',
    'variants',
    'flatTransportPrice',
    'active',
    'orderRank',
  ],
  caseStudy: [
    'title',
    'slug',
    'image',
    'gallery',
    'location',
    'summary',
    'description',
    'orderRank',
  ],
  blogPost: [
    'title',
    'slug',
    'image',
    'gallery',
    'publishedAt',
    'category',
    'excerpt',
    'article',
    'body',
  ],
  sitePage: ['editorVersion', 'title', 'route', 'active', 'sections', 'seo'],
}

const staticPages: Array<{
  id: string
  title: string
  route: string
  rootPath: string
}> = [
  {id: 'page-home', title: 'Página inicial', route: '/', rootPath: 'home'},
  {id: 'page-about', title: 'Sobre', route: '/sobre-nos', rootPath: 'about'},
  {id: 'page-products', title: 'Produtos', route: '/produtos', rootPath: 'productsPage'},
  {id: 'page-store', title: 'Loja', route: '/loja', rootPath: 'storePage'},
  {id: 'page-cart', title: 'Carrinho', route: '/carrinho', rootPath: 'cartPage'},
  {id: 'page-catalogue', title: 'Catálogo', route: '/catalogo', rootPath: 'catalogue'},
  {id: 'page-cases', title: 'Casos de estudo', route: '/casos-de-estudo', rootPath: 'casesPage'},
  {id: 'page-blog', title: 'Blog', route: '/blog', rootPath: 'blogPage'},
  {id: 'page-contact', title: 'Contacto', route: '/contacto', rootPath: 'contactPage'},
  {
    id: 'page-returns',
    title: 'Política de devoluções',
    route: '/politica-de-devolucoes',
    rootPath: 'returnsPolicy',
  },
]

const collectionDefinitions: Array<{
  id: string
  title: string
  type: SiteEditorDocumentType
  routePrefix: string
}> = [
  {id: 'collection-products', title: 'Produtos', type: 'productCategory', routePrefix: '/produtos'},
  {
    id: 'collection-store-categories',
    title: 'Categorias da Loja',
    type: 'storeCategory',
    routePrefix: '/loja',
  },
  {id: 'collection-store', title: 'Produtos da Loja', type: 'storeProduct', routePrefix: '/loja'},
  {
    id: 'collection-cases',
    title: 'Casos de estudo',
    type: 'caseStudy',
    routePrefix: '/casos-de-estudo',
  },
  {id: 'collection-blog', title: 'Artigos do Blog', type: 'blogPost', routePrefix: '/blog'},
]

const defaultNavigation = [
  {key: 'navigationAbout', label: 'Sobre', href: '/sobre-nos', placement: 'primary'},
  {key: 'navigationProducts', label: 'Produtos', href: '/produtos', placement: 'primary'},
  {key: 'navigationStore', label: 'Loja', href: '/loja', placement: 'primary'},
  {key: 'navigationCases', label: 'Casos', href: '/casos-de-estudo', placement: 'primary'},
  {key: 'navigationBlog', label: 'Blog', href: '/blog', placement: 'primary'},
  {key: 'navigationAccount', label: 'Conta', href: '/conta/entrar', placement: 'utility'},
  {key: 'navigationCart', label: 'Carrinho', href: '/carrinho', placement: 'utility'},
  {key: 'navigationCatalogue', label: 'Catálogo', href: '/catalogo', placement: 'utility'},
  {key: 'navigationContact', label: 'Contacto', href: '/contacto', placement: 'utility'},
] as const

const defaultNavigationDocuments = () =>
  defaultNavigation.map((item) => ({
    _key: item.key,
    _type: 'navigationItem',
    label: {_type: 'localizedString', pt: item.label},
    href: item.href,
    placement: item.placement,
    visibleDesktop: true,
    visibleMobile: true,
    newTab: false,
  }))

const manifestNavigation = (document: ManifestDocument) =>
  document.navigation?.length
    ? document.navigation
    : defaultNavigation.map((item) => ({
        _key: item.key,
        label: item.label,
        href: item.href,
        placement: item.placement,
      }))

type ManifestDocument = {
  _id: string
  _type: SiteEditorDocumentType
  _updatedAt?: string
  title?: string
  slug?: string
  route?: string
  active?: boolean
  publishedAt?: string
  location?: string
  thumbnailUrl?: string
  orderRank?: number
  category?: string
  navigation?: Array<{
    _key?: string
    label?: string
    href?: string
    placement?: string
  }>
}

export class SiteEditorConflictError extends Error {}

export const siteEditorDataset = () =>
  siteEditorE2eEnabled() ? 'site-editor-e2e' : env.SANITY_DATASET || 'production'
export const siteEditorProjectId = projectId

const clientFor = (token: string): SanityClient =>
  createClient({
    projectId,
    dataset: siteEditorDataset(),
    apiVersion,
    token,
    useCdn: false,
    perspective: 'raw',
  })

const readToken = () => env.SANITY_WRITE_TOKEN || env.SANITY_VIEWER_TOKEN || ''
const writeToken = () => env.SANITY_WRITE_TOKEN || ''

const requireReadClient = () => {
  const token = readToken()
  if (!token)
    throw new Error('Configure SANITY_VIEWER_TOKEN ou SANITY_WRITE_TOKEN para abrir o editor.')
  return clientFor(token)
}

const requireWriteClient = () => {
  const token = writeToken()
  if (!token) throw new Error('Configure SANITY_WRITE_TOKEN para guardar alterações.')
  return clientFor(token)
}

export const siteEditorCapabilities = () => ({
  canRead: siteEditorE2eEnabled() || Boolean(readToken()),
  canWrite: siteEditorE2eEnabled() || Boolean(writeToken()),
  canPublish: siteEditorE2eEnabled() || Boolean(writeToken()),
  dataset: siteEditorDataset(),
  projectId,
})

const isDraft = (id: string) => id.startsWith('drafts.')

const documentSlug = (document?: SiteEditorDocument | null) => {
  const slug = (document?.slug as {current?: unknown} | undefined)?.current
  return typeof slug === 'string' ? slug.trim() : ''
}

const preferDrafts = <T extends {_id: string}>(documents: T[]) => {
  const merged = new Map<string, T>()
  for (const document of documents) {
    const id = normalizeEditorDocumentId(document._id)
    if (!merged.has(id) || isDraft(document._id)) merged.set(id, document)
  }
  return [...merged.values()]
}

const titleFor = (document: ManifestDocument) =>
  document.title?.trim() ||
  (document._type === 'sitePage' ? 'Página sem nome' : 'Conteúdo sem título')

export const getSiteEditorManifest = async (
  canPublish: boolean,
  scope = 'default',
): Promise<SiteEditorManifest> => {
  if (siteEditorE2eEnabled()) return getSiteEditorE2eManifest(canPublish, scope)
  const client = requireReadClient()
  const documents = await client.fetch<ManifestDocument[]>(
    `*[_type in $types && !(_id in path("versions.**"))] {
      _id,
      _type,
      _updatedAt,
      "title": coalesce(title.pt, title),
      "slug": slug.current,
      route,
      active,
      orderRank,
      category,
      publishedAt,
      location,
      "thumbnailUrl": coalesce(
        image.asset->url,
        gallery[_type in ["image", "galleryImage"]][0].asset->url
      ),
      navigation[] {
        _key,
        "label": label.pt,
        href,
        placement
      }
    }`,
    {types: [...documentTypes]},
  )
  const preferred = preferDrafts(documents)
  const publishedStoreProductCategories = new Map(
    documents
      .filter(
        (document) =>
          document._type === 'storeProduct' && !isDraft(document._id) && document.category,
      )
      .map((document) => [normalizeEditorDocumentId(document._id), document.category!]),
  )
  const storeProductCounts = preferred
    .filter((document) => document._type === 'storeProduct' && document.category)
    .reduce((counts, document) => {
      const category = document.category!
      counts.set(category, (counts.get(category) ?? 0) + 1)
      return counts
    }, new Map<string, number>())
  const storeCategoryOptions = new Map<string, {label: string; value: string}>(
    defaultStoreCategoryOptions.map((option) => [option.value, option]),
  )
  preferred
    .filter((document) => document._type === 'storeCategory' && document.slug)
    .sort(
      (left, right) =>
        (left.orderRank ?? 100) - (right.orderRank ?? 100) ||
        titleFor(left).localeCompare(titleFor(right), 'pt'),
    )
    .forEach((document) => {
      storeCategoryOptions.set(document.slug!, {
        label: titleFor(document),
        value: document.slug!,
      })
    })
  const siteDocument =
    preferred.find((document) => document._type === 'siteLanding') ??
    ({_id: 'siteContent', _type: 'siteLanding'} as ManifestDocument)
  const siteDocumentId = normalizeEditorDocumentId(siteDocument._id)
  const nodes: SiteEditorNode[] = [
    ...staticPages.map((page) => ({
      ...page,
      kind: 'page' as const,
      area: 'pages' as const,
      documentId: siteDocumentId,
      documentType: 'siteLanding' as const,
      draft: isDraft(siteDocument._id),
      updatedAt: siteDocument._updatedAt,
    })),
    {
      id: 'global-navigation',
      kind: 'collection',
      area: 'global',
      title: 'Cabeçalho e navegação',
      subtitle: 'Menu principal e ações',
      route: '/',
    },
    ...manifestNavigation(siteDocument).map((item, index) => ({
      id: `global-navigation-${item._key || index}`,
      kind: 'global' as const,
      area: 'global' as const,
      title: item.label?.trim() || `Ligação ${index + 1}`,
      subtitle: item.href?.trim() || 'Sem destino',
      route: '/',
      documentId: siteDocumentId,
      documentType: 'siteLanding' as const,
      rootPath: item._key
        ? `navigation[_key=="${item._key.replace(/"/g, '\\"')}"]`
        : `navigation[${index}]`,
      parentId: 'global-navigation',
      draft: isDraft(siteDocument._id),
      updatedAt: siteDocument._updatedAt,
    })),
    {
      id: 'global-navigation-all',
      kind: 'global',
      area: 'global',
      title: 'Gerir menu completo',
      subtitle: 'Adicionar, remover e ordenar ligações',
      route: '/',
      documentId: siteDocumentId,
      documentType: 'siteLanding',
      rootPath: 'navigation',
      parentId: 'global-navigation',
      draft: isDraft(siteDocument._id),
      updatedAt: siteDocument._updatedAt,
    },
    {
      id: 'global-common',
      kind: 'global',
      area: 'global',
      title: 'Contacto, rodapé e textos comuns',
      subtitle: 'Informação partilhada em todo o site',
      route: '/contacto',
      documentId: siteDocumentId,
      documentType: 'siteLanding',
      rootPath: 'common',
      draft: isDraft(siteDocument._id),
      updatedAt: siteDocument._updatedAt,
    },
  ]

  for (const definition of collectionDefinitions) {
    const items = preferred
      .filter((document) => document._type === definition.type)
      .sort((left, right) => titleFor(left).localeCompare(titleFor(right), 'pt'))
    nodes.push({
      id: definition.id,
      kind: 'collection',
      area: 'content',
      title: definition.title,
      route: definition.routePrefix,
      collectionType: definition.type,
      count: items.length,
    })
    for (const item of items) {
      nodes.push({
        id: `document-${normalizeEditorDocumentId(item._id)}`,
        kind: 'document',
        area: 'content',
        title: titleFor(item),
        subtitle:
          item._type === 'storeCategory'
            ? `${storeProductCounts.get(item.slug || '') ?? 0} ${
                (storeProductCounts.get(item.slug || '') ?? 0) === 1 ? 'produto' : 'produtos'
              }`
            : item._type === 'blogPost'
            ? item.publishedAt
            : item._type === 'caseStudy'
              ? item.location
              : undefined,
        route:
          item._type === 'storeCategory'
            ? definition.routePrefix
            : item.slug
              ? `${definition.routePrefix}/${item.slug}`
              : definition.routePrefix,
        documentId: normalizeEditorDocumentId(item._id),
        documentType: item._type,
        parentId: definition.id,
        draft: isDraft(item._id),
        updatedAt: item._updatedAt,
        active: item.active,
        thumbnailUrl: item.thumbnailUrl,
        slug: item.slug,
        category: item.category,
        publishedCategory:
          item._type === 'storeProduct'
            ? publishedStoreProductCategories.get(normalizeEditorDocumentId(item._id))
            : undefined,
        count:
          item._type === 'storeCategory'
            ? storeProductCounts.get(item.slug || '') ?? 0
            : undefined,
      })
    }
  }

  const freePages = preferred
    .filter((document) => document._type === 'sitePage')
    .sort((left, right) => (left.route || '').localeCompare(right.route || '', 'pt'))
  nodes.push({
    id: 'collection-pages',
    kind: 'collection',
    area: 'pages',
    title: 'Páginas livres',
    collectionType: 'sitePage',
    count: freePages.length,
  })
  for (const page of freePages) {
    nodes.push({
      id: `page-${normalizeEditorDocumentId(page._id)}`,
      kind: 'flexiblePage',
      area: 'pages',
      title: titleFor(page),
      route: page.route,
      documentId: normalizeEditorDocumentId(page._id),
      documentType: 'sitePage',
      parentId: 'collection-pages',
      draft: isDraft(page._id),
      updatedAt: page._updatedAt,
      active: page.active,
    })
  }

  return {
    nodes,
    optionSources: {storeCategories: [...storeCategoryOptions.values()]},
    capabilities: {...siteEditorCapabilities(), canPublish},
  }
}

const assertDocumentType = (value: unknown): SiteEditorDocumentType => {
  if (typeof value !== 'string' || !documentTypes.has(value as SiteEditorDocumentType)) {
    throw new Error('Tipo de conteúdo não suportado pelo editor.')
  }
  return value as SiteEditorDocumentType
}

export const getSiteEditorDocument = async (id: string, scope = 'default') => {
  if (siteEditorE2eEnabled()) return getSiteEditorE2eDocument(id, scope)
  const publishedId = normalizeEditorDocumentId(id)
  if (!publishedId || publishedId.length > 180) throw new Error('Identificador inválido.')
  const documents = await requireReadClient().fetch<SiteEditorDocument[]>(
    `*[_id in [$publishedId, $draftId] && _type in $types && !(_id in path("versions.**"))]`,
    {publishedId, draftId: editorDraftId(publishedId), types: [...documentTypes]},
  )
  const document = documents.find((item) => isDraft(item._id)) ?? documents[0]
  if (!document) throw new Error('Conteúdo não encontrado.')
  if (
    document._type === 'siteLanding' &&
    (!Array.isArray(document.navigation) || document.navigation.length === 0)
  ) {
    return {...document, navigation: defaultNavigationDocuments()}
  }
  return document
}

const validateStructuredValue = (value: unknown, depth = 0): void => {
  if (depth > 24) throw new Error('O conteúdo tem demasiados níveis.')
  if (value === null || ['string', 'number', 'boolean', 'undefined'].includes(typeof value)) return
  if (Array.isArray(value)) {
    if (value.length > 2000) throw new Error('Uma lista excede o limite permitido.')
    for (const item of value) validateStructuredValue(item, depth + 1)
    return
  }
  if (!value || typeof value !== 'object') throw new Error('O conteúdo contém um valor inválido.')
  for (const [key, child] of Object.entries(value)) {
    if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
      throw new Error('O conteúdo contém uma propriedade inválida.')
    }
    validateStructuredValue(child, depth + 1)
  }
}

const validateArticleValue = (document: SiteEditorDocument) => {
  if (document._type !== 'blogPost' || document.article === undefined) return
  if (!document.article || typeof document.article !== 'object' || Array.isArray(document.article)) {
    throw new SiteEditorValidationError('O artigo tem um formato inválido. Reabra o editor antes de guardar.')
  }
  const blocks = (document.article as {pt?: unknown}).pt
  if (!Array.isArray(blocks)) {
    throw new SiteEditorValidationError(
      'O texto do artigo perdeu a estrutura. Reabra o editor antes de guardar.',
    )
  }
  if (
    blocks.some(
      (block) =>
        !block ||
        typeof block !== 'object' ||
        typeof (block as {_type?: unknown})._type !== 'string',
    )
  ) {
    throw new SiteEditorValidationError('O artigo contém um bloco inválido.')
  }
}

const editableDocument = (input: SiteEditorDocument) => {
  const type = assertDocumentType(input?._type)
  const id = normalizeEditorDocumentId(String(input?._id || ''))
  if (!id || id.length > 180) throw new Error('Identificador inválido.')
  const result: Record<string, unknown> = {_id: id, _type: type}
  for (const field of editableFields[type]) {
    if (Object.prototype.hasOwnProperty.call(input, field)) result[field] = input[field]
  }
  validateStructuredValue(result)
  return result as SiteEditorDocument
}

const validateDocument = (document: SiteEditorDocument) => {
  const localizedTitle = document.title as {pt?: unknown} | string | undefined
  const title =
    typeof localizedTitle === 'string'
      ? localizedTitle.trim()
      : typeof localizedTitle?.pt === 'string'
        ? localizedTitle.pt.trim()
        : ''
  if (document._type !== 'siteLanding' && !title)
    throw new Error('Preencha o título antes de publicar.')

  if (document._type === 'sitePage') {
    const route = String(document.route || '')
    if (!/^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*$/.test(route)) {
      throw new Error('Use um endereço válido, por exemplo /sustentabilidade.')
    }
  } else if (document._type !== 'siteLanding') {
    const slug = (document.slug as {current?: unknown} | undefined)?.current
    if (typeof slug !== 'string' || !slug.trim()) throw new Error('Preencha o endereço da página.')
  }

  if (document._type === 'storeProduct') {
    if (typeof document.category !== 'string' || !document.category.trim()) {
      throw new Error('Escolha uma categoria da Loja.')
    }
    const variants = document.variants
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('Adicione pelo menos uma opção comprável.')
    }
    for (const variant of variants) {
      if (!variant || typeof variant !== 'object') {
        throw new Error('Uma das opções do produto está incompleta.')
      }
      const value = variant as Record<string, unknown>
      const label = value.label as {pt?: unknown} | undefined
      if (typeof label?.pt !== 'string' || !label.pt.trim()) {
        throw new Error('Dê um nome a todas as opções do produto.')
      }
      if (typeof value.weightKg !== 'number' || !Number.isFinite(value.weightKg) || value.weightKg <= 0) {
        throw new Error('Indique um peso superior a zero em todas as opções.')
      }
      for (const field of ['priceNatural', 'priceDark'] as const) {
        if (typeof value[field] !== 'number' || !Number.isFinite(value[field]) || value[field] <= 0) {
          throw new Error('Indique preços superiores a zero em todas as opções.')
        }
      }
    }
  }
}

const unsetMissingFields = (document: SiteEditorDocument) =>
  editableFields[document._type].filter(
    (field) => !Object.prototype.hasOwnProperty.call(document, field),
  )

export const saveSiteEditorDocument = async (input: SiteEditorDocument, scope = 'default') => {
  validateArticleValue(input)
  if (siteEditorE2eEnabled()) {
    try {
      return saveSiteEditorE2eDocument(input, scope)
    } catch (cause) {
      if (cause instanceof Error && /alterado noutra janela/i.test(cause.message)) {
        throw new SiteEditorConflictError(cause.message)
      }
      throw cause
    }
  }
  const publishedId = normalizeEditorDocumentId(String(input?._id || ''))
  if (!publishedId || publishedId.length > 180) throw new Error('Identificador inválido.')
  const draftId = editorDraftId(publishedId)
  const client = requireWriteClient()
  const [published, draft] = await Promise.all([
    client.getDocument<SiteEditorDocument>(publishedId),
    client.getDocument<SiteEditorDocument>(draftId),
  ])

  // The client's claimed _type is only trustworthy once we've confirmed it matches
  // whatever this document actually is server-side — otherwise a stale or forged
  // request could relabel an existing document (e.g. the siteLanding singleton) as
  // a different type, or smuggle foreign-type fields onto it via editableFields.
  const existingType = (draft ?? published)?._type
  if (existingType && existingType !== input?._type) {
    throw new SiteEditorConflictError(
      'Este conteúdo foi alterado noutra janela. Recarregue antes de continuar.',
    )
  }

  const document = editableDocument(input)

  if (document._type === 'storeCategory') {
    const existingSlug = documentSlug(draft ?? published)
    const nextSlug = documentSlug(document)
    if (existingSlug && nextSlug !== existingSlug) {
      throw new Error(
        'O identificador da categoria é estável para proteger os produtos associados. Altere apenas o nome apresentado.',
      )
    }
  }

  if (draft) {
    if (!isDraft(input._id) || input._rev !== draft._rev) {
      throw new SiteEditorConflictError(
        'Este conteúdo foi alterado noutra janela. Recarregue antes de continuar.',
      )
    }
    const values = {...document} as Record<string, unknown>
    delete values._id
    delete values._type
    let patch = client.patch(draftId).set(values).ifRevisionId(draft._rev)
    const missing = unsetMissingFields(document)
    if (missing.length) patch = patch.unset(missing)
    return patch.commit({returnDocuments: true}) as Promise<SiteEditorDocument>
  }

  if (published && input._rev !== published._rev) {
    throw new SiteEditorConflictError(
      'A versão publicada mudou enquanto editava. Recarregue antes de continuar.',
    )
  }

  const source = published ? structuredClone(published) : {}
  const draftDocument = {
    ...source,
    ...document,
    _id: draftId,
    _type: document._type,
  } as Record<string, unknown>
  delete draftDocument._rev
  delete draftDocument._createdAt
  delete draftDocument._updatedAt
  for (const field of unsetMissingFields(document)) delete draftDocument[field]
  return client.create(draftDocument as SiteEditorDocument)
}

export const publishSiteEditorDocument = async (input: SiteEditorDocument, scope = 'default') => {
  if (siteEditorE2eEnabled()) return publishSiteEditorE2eDocument(input, scope)
  const saved = await saveSiteEditorDocument(input, scope)
  validateDocument(saved)
  const client = requireWriteClient()
  const publishedId = normalizeEditorDocumentId(saved._id)
  const published = await client.getDocument<SiteEditorDocument>(publishedId)
  await client.action({
    actionType: 'sanity.action.document.publish',
    draftId: editorDraftId(publishedId),
    ifDraftRevisionId: saved._rev,
    publishedId,
    ...(published?._rev ? {ifPublishedRevisionId: published._rev} : {}),
  })
  const result = await client.getDocument<SiteEditorDocument>(publishedId)
  if (!result) throw new Error('A publicação terminou sem devolver o conteúdo.')
  invalidateSanityCollectionsCache()
  return result
}

const slugFromTitle = (title: string) =>
  title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'novo-conteudo'

const sitePageRoutePattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*$/

const sitePageRoute = (value: unknown, fallbackSlug: string) => {
  const input = String(value || `/${fallbackSlug}`).trim()
  const route = input.startsWith('/') ? input : `/${input}`
  if (!sitePageRoutePattern.test(route)) {
    throw new Error('Use um endereço válido, por exemplo /sustentabilidade.')
  }
  return route
}

export const createSiteEditorDocument = async (
  typeValue: unknown,
  titleValue: unknown,
  routeValue?: unknown,
  scope = 'default',
) => {
  const type = assertDocumentType(typeValue)
  if (type === 'siteLanding') throw new Error('O conteúdo global já existe.')
  const title = String(titleValue || '').trim()
  if (title.length < 2 || title.length > 100)
    throw new Error('Indique um nome entre 2 e 100 caracteres.')
  const slug = slugFromTitle(title)
  const normalizedRoute = type === 'sitePage' ? sitePageRoute(routeValue, slug) : undefined
  if (siteEditorE2eEnabled()) {
    return createSiteEditorE2eDocument(type, title, normalizedRoute, scope)
  }
  const existing = await requireReadClient().fetch<string | null>(
    type === 'sitePage'
      ? `*[_type == "sitePage" && route == $route && !(_id in path("versions.**"))][0]._id`
      : `*[_type == $type && slug.current == $slug && !(_id in path("versions.**"))][0]._id`,
    type === 'sitePage' ? {route: normalizedRoute} : {type, slug},
  )
  if (existing) {
    if (type === 'storeCategory') {
      throw new SiteEditorDuplicateError('Já existe uma categoria com este nome.')
    }
    throw new SiteEditorDuplicateError(
      'Já existe conteúdo deste tipo com o mesmo endereço.',
    )
  }
  // Sanity treats every ID containing a dot as a private sub-path. Keep
  // published website content at the root so anonymous visitors can read it.
  const id = `${type}-${randomUUID()}`
  const base: Record<string, unknown> = {
    _id: editorDraftId(id),
    _type: type,
  }

  if (type === 'sitePage') {
    const hero = createBuilderSection('builderHeroSection')
    hero.title = {...hero.title, pt: title}
    hero.body = {...hero.body, pt: ''}
    base.editorVersion = 1
    base.title = title
    base.route = normalizedRoute
    base.active = true
    base.sections = [hero]
    base.seo = {
      _type: 'builderSeo',
      title: {_type: 'localizedString', pt: title},
      description: {_type: 'localizedText', pt: ''},
      noIndex: true,
    }
  } else {
    const storeCategory =
      type === 'storeProduct'
        ? ((await requireReadClient().fetch<string | null>(
            `*[_type == "storeCategory" && defined(slug.current) && !(_id in path("versions.**"))]
              | order(orderRank asc, title.pt asc)[0].slug.current`,
          )) ?? defaultStoreCategoryOptions[0]?.value ?? 'bancos')
        : undefined
    Object.assign(
      base,
      createSiteEditorStarterFields({type, title, slug, storeCategory}),
    )
  }

  validateStructuredValue(base)
  return requireWriteClient().create(base as SiteEditorDocument)
}

export const deleteSiteEditorDocument = async (id: string, scope = 'default') => {
  if (siteEditorE2eEnabled()) return deleteSiteEditorE2eDocument(id, scope)
  const publishedId = normalizeEditorDocumentId(id)
  if (!publishedId || publishedId === 'siteContent' || publishedId.length > 180) {
    throw new Error('Este conteúdo não pode ser eliminado.')
  }
  const document = await getSiteEditorDocument(publishedId)
  if (document._type === 'siteLanding') throw new Error('O conteúdo global não pode ser eliminado.')
  if (document._type === 'storeCategory') {
    const slug = (document.slug as {current?: unknown} | undefined)?.current
    if (typeof slug !== 'string' || !slug.trim()) {
      throw new Error('A categoria não tem um identificador válido.')
    }
    const assigned = await requireReadClient().fetch<Array<{_id: string; title?: string}>>(
      `*[_type == "storeProduct" && category == $category && !(_id in path("versions.**"))] {
        _id,
        "title": coalesce(title.pt, title)
      }`,
      {category: slug},
    )
    const uniqueProducts = new Map<string, string>()
    for (const product of assigned) {
      const productId = normalizeEditorDocumentId(product._id)
      uniqueProducts.set(productId, product.title?.trim() || 'Produto sem nome')
    }
    if (uniqueProducts.size) {
      throw new SiteEditorCategoryInUseError([...uniqueProducts.values()])
    }
  }
  const result = await requireWriteClient()
    .transaction()
    .delete(publishedId)
    .delete(editorDraftId(publishedId))
    .commit()
  invalidateSanityCollectionsCache()
  return result
}
