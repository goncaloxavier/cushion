import {createHash, randomUUID} from 'node:crypto'
import type {StaffUser} from './staff-auth'
import type {
  SiteEditorDocument,
  SiteEditorDocumentType,
  SiteEditorManifest,
  SiteEditorNode,
} from '$lib/site-editor/types'
import {editorDraftId, normalizeEditorDocumentId} from '$lib/site-editor/path'
import {createBuilderSection} from '$lib/builder/defaults'
import {defaultStoreCategoryOptions} from '$lib/store-categories'
import {SiteEditorCategoryInUseError, SiteEditorDuplicateError} from './site-editor-errors'
import {createSiteEditorStarterFields} from './site-editor-starters'

const requestHeader = 'x-df4y-site-editor-e2e'
const scopeHeader = 'x-df4y-site-editor-scope'

export const siteEditorE2eEnabled = () =>
  process.env.NODE_ENV !== 'production' && process.env.SITE_EDITOR_E2E === 'true'

export const siteEditorE2eRequestStaff = (headers: Headers): StaffUser | null => {
  const expected = process.env.SITE_EDITOR_E2E_KEY || ''
  if (!siteEditorE2eEnabled() || !expected || headers.get(requestHeader) !== expected) return null
  return {
    id: '00000000-0000-4000-8000-000000000001',
    name: 'Editor Playwright',
    username: 'site-editor-e2e',
    role: 'admin',
  }
}

export const siteEditorE2eScope = (headers: Headers) => {
  const value = (headers.get(scopeHeader) || 'default').toLowerCase().replace(/[^a-z0-9-]/g, '')
  return value.slice(0, 48) || 'default'
}

const localizedString = (pt: string) => ({_type: 'localizedString', pt})
const localizedText = (pt: string) => ({_type: 'localizedText', pt})
const image = (key: string, alt: string) => ({
  _key: key,
  _type: 'galleryImage',
  asset: {_type: 'reference', _ref: `image-${key}-1200x800-png`},
  alt: localizedString(alt),
})

const articleTextBlock = (
  key: string,
  text: string,
  options: {style?: string; listItem?: string; level?: number} = {},
) => ({
  _key: key,
  _type: 'block',
  style: options.style ?? 'normal',
  ...(options.listItem ? {listItem: options.listItem, level: options.level ?? 1} : {}),
  markDefs: [],
  children: [{_key: `${key}-span`, _type: 'span', marks: [], text}],
})

const populatedArticle = () => ({
  _type: 'localizedArticle',
  pt: [
    articleTextBlock('rich-heading', 'Uma secção completa', {style: 'h2'}),
    {
      _key: 'rich-paragraph',
      _type: 'block',
      style: 'normal',
      markDefs: [
        {
          _key: 'rich-link',
          _type: 'link',
          href: 'https://www.dafabrica4you.pt/',
        },
      ],
      children: [
        {
          _key: 'rich-paragraph-span-1',
          _type: 'span',
          marks: ['strong'],
          text: 'Este parágrafo',
        },
        {
          _key: 'rich-paragraph-span-2',
          _type: 'span',
          marks: [],
          text: ' confirma que o artigo mantém ',
        },
        {
          _key: 'rich-paragraph-span-3',
          _type: 'span',
          marks: ['em', 'rich-link'],
          text: 'texto corrido entre estruturas',
        },
        {
          _key: 'rich-paragraph-span-4',
          _type: 'span',
          marks: [],
          text: '.',
        },
      ],
    },
    articleTextBlock('rich-bullet-1', 'Primeiro ponto com marcador', {
      listItem: 'bullet',
      level: 1,
    }),
    articleTextBlock('rich-bullet-2', 'Segundo ponto com marcador', {
      listItem: 'bullet',
      level: 1,
    }),
    articleTextBlock('rich-number-1', 'Primeiro passo numerado', {
      listItem: 'number',
      level: 1,
    }),
    articleTextBlock('rich-number-2', 'Segundo passo numerado', {
      listItem: 'number',
      level: 1,
    }),
    articleTextBlock('rich-quote', 'Uma citação preservada no corpo do artigo.', {
      style: 'blockquote',
    }),
    {
      _key: 'rich-image',
      _type: 'image',
      asset: {_type: 'reference', _ref: 'image-richarticle-1200x800-png'},
      alt: 'Produto instalado num espaço exterior',
      caption: 'Uma imagem inserida no artigo.',
    },
    {
      _key: 'rich-video',
      _type: 'youtubeEmbed',
      url: 'https://www.youtube.com/watch?v=VIUVlk51iN0',
      title: 'Vídeo inserido no artigo',
      caption: 'Uma legenda para o vídeo.',
    },
    {
      _key: 'rich-table',
      _type: 'articleTable',
      columns: ['Material', 'Quantidade'],
      rows: [
        {
          _key: 'rich-table-row-1',
          _type: 'articleTableRow',
          cells: ['Plástico reciclado', '12 kg'],
        },
        {
          _key: 'rich-table-row-2',
          _type: 'articleTableRow',
          cells: ['Madeira', '8 kg'],
        },
      ],
    },
  ],
})

const navigation = [
  ['nav-about', 'Sobre', '/sobre-nos', 'primary'],
  ['nav-products', 'Produtos', '/produtos', 'primary'],
  ['nav-store', 'Loja', '/loja', 'primary'],
  ['nav-cases', 'Casos', '/casos-de-estudo', 'primary'],
  ['nav-blog', 'Blog', '/blog', 'primary'],
  ['nav-account', 'Conta', '/conta/entrar', 'utility'],
  ['nav-cart', 'Carrinho', '/carrinho', 'utility'],
  ['nav-catalogue', 'Catálogo', '/catalogo', 'utility'],
  ['nav-contact', 'Contacto', '/contacto', 'utility'],
].map(([key, label, href, placement]) => ({
  _key: key,
  _type: 'navigationItem',
  label: localizedString(label),
  href,
  placement,
  visibleDesktop: true,
  visibleMobile: true,
  newTab: false,
}))

const timestamp = '2026-07-14T12:00:00.000Z'

const initialDocuments = (): SiteEditorDocument[] => [
  {
    _id: 'drafts.siteContent',
    _type: 'siteLanding',
    _rev: 'fixture-site-1',
    _createdAt: timestamp,
    _updatedAt: timestamp,
    navigation,
    home: {
      hero: {
        _type: 'copyBlock',
        title: {
          ...localizedString('Transformamos resíduos em soluções que duram'),
          fontFamily: 'space-grotesk',
          fontSize: 58,
          fontSizeMobile: 38,
          fontWeight: 'bold',
        },
      },
      heroVideo: {kind: 'youtube', youtubeUrl: 'https://www.youtube.com/watch?v=e2e'},
      heroVideoLabel: localizedString('Ver vídeo institucional'),
      impact: {
        _type: 'impactBlock',
        title: localizedString('Menos desperdício, mais futuro'),
        stats: Array.from({length: 7}, (_, index) => ({
          _key: `stat-${index + 1}`,
          _type: 'contentCard',
          title: localizedString(`${index + 1} compromisso${index ? 's' : ''}`),
          text: localizedText('Conteúdo de demonstração para validar a edição e o scroll.'),
        })),
      },
      partners: {
        _type: 'partnersBlock',
        kicker: localizedString('Parceiros'),
        title: localizedString('Projetos com impacto real'),
        lead: localizedText('Uma área longa o suficiente para validar o painel sem atalhos.'),
        items: Array.from({length: 5}, (_, index) => ({
          _key: `partner-${index + 1}`,
          _type: 'partnerItem',
          name: `Parceiro ${index + 1}`,
          url: 'https://example.test',
          text: localizedText('Descrição editável do parceiro.'),
        })),
      },
    },
  } as SiteEditorDocument,
  {
    _id: 'drafts.storeCategory.bancos',
    _type: 'storeCategory',
    _rev: 'fixture-category-1',
    _createdAt: timestamp,
    _updatedAt: timestamp,
    title: localizedString('Bancos'),
    slug: {_type: 'slug', current: 'bancos'},
    orderRank: 1,
  } as SiteEditorDocument,
  {
    _id: 'drafts.storeProduct.editor-fixture',
    _type: 'storeProduct',
    _rev: 'fixture-product-1',
    _createdAt: timestamp,
    _updatedAt: timestamp,
    title: localizedString('Banco editorial'),
    slug: {_type: 'slug', current: 'banco-editorial'},
    category: 'bancos',
    summary: localizedText('Produto de demonstração usado apenas pelos testes do editor.'),
    hasFinishChoice: true,
    image: {
      _type: 'image',
      asset: {_type: 'reference', _ref: 'image-productmain-1200x800-png'},
      alt: localizedString('Banco em material reciclado'),
    },
    gallery: [
      image('galleryone', 'Vista frontal do banco'),
      image('gallerytwo', 'Vista lateral do banco'),
      {
        _key: 'galleryvideo',
        _type: 'galleryVideo',
        asset: {_type: 'reference', _ref: 'file-galleryvideo-mp4'},
        title: localizedString('Vídeo do banco'),
      },
    ],
    variants: [
      {
        _key: 'variant-standard',
        _type: 'storeProductVariant',
        label: localizedString('Tamanho standard'),
        dimensions: [localizedString('2000 mm')],
        weightKg: 52,
        priceNatural: 185,
        priceDark: 205,
      },
    ],
    flatTransportPrice: 35,
    active: true,
    orderRank: 1,
  } as SiteEditorDocument,
  {
    _id: 'drafts.blogPost.rich-article-fixture',
    _type: 'blogPost',
    _rev: 'fixture-rich-article-1',
    _createdAt: timestamp,
    _updatedAt: timestamp,
    title: localizedString('Artigo estruturado completo'),
    slug: {_type: 'slug', current: 'artigo-estruturado-completo'},
    publishedAt: '2026-07-14',
    category: localizedString('Materiais'),
    excerpt: localizedText('Um artigo de teste com todas as estruturas editoriais importantes.'),
    article: populatedArticle(),
    body: localizedText(''),
    gallery: [],
  } as SiteEditorDocument,
]

type FixtureState = {
  documents: Map<string, SiteEditorDocument>
  publishedDocuments: Map<string, SiteEditorDocument>
  revision: number
}

const fixtureStates = new Map<string, FixtureState>()

const clone = <T>(value: T): T => structuredClone(value)

const fixtureSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90) || 'conteudo-de-teste'

const stateFor = (scope = 'default') => {
  let state = fixtureStates.get(scope)
  if (!state) {
    const documents = initialDocuments()
    state = {
      documents: new Map(
        documents.map((document) => [normalizeEditorDocumentId(document._id), document]),
      ),
      publishedDocuments: new Map(
        documents.map((document) => {
          const id = normalizeEditorDocumentId(document._id)
          return [id, {...clone(document), _id: id} as SiteEditorDocument]
        }),
      ),
      revision: 1,
    }
    fixtureStates.set(scope, state)
  }
  return state
}

const contentFillerNodes = (scope: string): SiteEditorNode[] => {
  const state = stateFor(scope)
  const product = state.documents.get('storeProduct.editor-fixture')
  const publishedProduct = state.publishedDocuments.get('storeProduct.editor-fixture')

  return [
    {
      id: 'fixture-store-categories-collection',
      kind: 'collection',
      area: 'content',
      title: 'Categorias da Loja',
      route: '/painel/site/e2e-preview?fixture=product',
      collectionType: 'storeCategory',
      count: 1,
    },
    {
      id: 'fixture-store-collection',
      kind: 'collection',
      area: 'content',
      title: 'Produtos da Loja',
      route: '/painel/site/e2e-preview?fixture=product',
      collectionType: 'storeProduct',
      count: 1,
    },
    {
      id: 'fixture-store-product',
      kind: 'document',
      area: 'content',
      title: 'Banco editorial',
      subtitle: 'Produto de teste',
      route: '/painel/site/e2e-preview?fixture=product',
      documentId: 'storeProduct.editor-fixture',
      documentType: 'storeProduct',
      parentId: 'fixture-store-collection',
      draft: true,
      thumbnailUrl: '/images/product-materials.png',
      category: typeof product?.category === 'string' ? product.category : undefined,
      publishedCategory:
        typeof publishedProduct?.category === 'string' ? publishedProduct.category : undefined,
    },
    {
      id: 'fixture-blog-collection',
      kind: 'collection',
      area: 'content',
      title: 'Artigos do Blog',
      route: '/blog',
      collectionType: 'blogPost',
      count: 25,
    },
    ...Array.from({length: 24}, (_, index) => ({
      id: `fixture-blog-${index + 1}`,
      kind: 'document' as const,
      area: 'content' as const,
      title: `Artigo de demonstração ${index + 1}`,
      subtitle: 'Conteúdo para validar navegação longa',
      route: '/blog',
      parentId: 'fixture-blog-collection',
    })),
  ]
}

const createdNodes = (scope: string): SiteEditorNode[] => {
  const nodes: SiteEditorNode[] = []
  const documents = [...stateFor(scope).documents.values()]
  const storeProductCounts = documents
    .filter((document) => document._type === 'storeProduct' && typeof document.category === 'string')
    .reduce((counts, document) => {
      const category = String(document.category)
      counts.set(category, (counts.get(category) ?? 0) + 1)
      return counts
    }, new Map<string, number>())

  for (const [id, document] of stateFor(scope).documents.entries()) {
    if (id === 'siteContent' || id === 'storeProduct.editor-fixture') continue
    const titleValue = document.title as {pt?: string} | string | undefined
    const title =
      typeof titleValue === 'string' ? titleValue : titleValue?.pt || 'Conteúdo sem título'
    const slug = (document.slug as {current?: string} | undefined)?.current

    if (document._type === 'sitePage') {
      nodes.push({
        id: `page-${id}`,
        kind: 'flexiblePage',
        area: 'pages',
        title,
        route: `/painel/site/e2e-preview?fixture=created&document=${encodeURIComponent(id)}`,
        documentId: id,
        documentType: 'sitePage',
        parentId: 'collection-pages',
        draft: true,
        active: document.active !== false,
      })
      continue
    }

    const collections: Partial<Record<SiteEditorDocumentType, {id: string; prefix: string}>> = {
      productCategory: {id: 'fixture-products-collection', prefix: '/produtos'},
      storeCategory: {id: 'fixture-store-categories-collection', prefix: '/loja'},
      storeProduct: {id: 'fixture-store-collection', prefix: '/loja'},
      caseStudy: {id: 'fixture-cases-collection', prefix: '/casos-de-estudo'},
      blogPost: {id: 'fixture-blog-collection', prefix: '/blog'},
    }
    const collection = collections[document._type]
    if (!collection) continue

    nodes.push({
      id: `document-${id}`,
      kind: 'document',
      area: 'content',
      title,
      route:
        document._type === 'storeCategory'
          ? '/painel/site/e2e-preview?fixture=product'
          : `/painel/site/e2e-preview?fixture=created&document=${encodeURIComponent(id)}`,
      documentId: id,
      documentType: document._type,
      parentId: collection.id,
      draft: true,
      subtitle:
        document._type === 'storeCategory'
          ? `${storeProductCounts.get(slug || '') ?? 0} ${
              (storeProductCounts.get(slug || '') ?? 0) === 1 ? 'produto' : 'produtos'
            }`
          : slug
            ? `${collection.prefix}/${slug}`
            : collection.prefix,
      slug,
      category: typeof document.category === 'string' ? document.category : undefined,
      publishedCategory:
        document._type === 'storeProduct' &&
        typeof stateFor(scope).publishedDocuments.get(id)?.category === 'string'
          ? String(stateFor(scope).publishedDocuments.get(id)?.category)
          : undefined,
      count:
        document._type === 'storeCategory'
          ? storeProductCounts.get(slug || '') ?? 0
          : undefined,
    })
  }

  return nodes
}

export const getSiteEditorE2eManifest = (
  canPublish: boolean,
  scope = 'default',
): SiteEditorManifest => {
  const state = stateFor(scope)
  const categoryOptions = new Map<string, {label: string; value: string}>(
    defaultStoreCategoryOptions.map((option) => [option.value, option]),
  )
  for (const document of state.documents.values()) {
    if (document._type !== 'storeCategory') continue
    const slug = (document.slug as {current?: string} | undefined)?.current
    const title = (document.title as {pt?: string} | undefined)?.pt
    if (slug && title) categoryOptions.set(slug, {label: title, value: slug})
  }
  return {
    nodes: [
      {
        id: 'page-home',
        kind: 'page',
        area: 'pages',
        title: 'Página inicial',
        route: '/painel/site/e2e-preview',
        rootPath: 'home',
        documentId: 'siteContent',
        documentType: 'siteLanding',
        draft: true,
      },
      {
        id: 'page-about',
        kind: 'page',
        area: 'pages',
        title: 'Sobre',
        route: '/painel/site/e2e-preview',
        rootPath: 'about',
        documentId: 'siteContent',
        documentType: 'siteLanding',
        draft: true,
      },
      {
        id: 'collection-pages',
        kind: 'collection',
        area: 'pages',
        title: 'Páginas livres',
        collectionType: 'sitePage',
        count: [...stateFor(scope).documents.values()].filter((item) => item._type === 'sitePage')
          .length,
      },
      ...contentFillerNodes(scope),
      ...createdNodes(scope),
      {
        id: 'global-navigation',
        kind: 'global',
        area: 'global',
        title: 'Cabeçalho e navegação',
        subtitle: 'Menu completo',
        route: '/painel/site/e2e-preview',
        rootPath: 'navigation',
        documentId: 'siteContent',
        documentType: 'siteLanding',
        draft: true,
      },
    ],
    optionSources: {storeCategories: [...categoryOptions.values()]},
    capabilities: {
      canRead: true,
      canWrite: true,
      canPublish,
      dataset: 'site-editor-e2e',
      projectId: 'u4uyfix8',
    },
  }
}

export const getSiteEditorE2eDocument = (id: string, scope = 'default') => {
  const document = stateFor(scope).documents.get(normalizeEditorDocumentId(id))
  if (!document) throw new Error('Conteúdo de teste não encontrado.')
  return clone(document)
}

export const getPublishedSiteEditorE2eDocument = (id: string, scope = 'default') => {
  const document = stateFor(scope).publishedDocuments.get(normalizeEditorDocumentId(id))
  if (!document) throw new Error('Conteúdo publicado de teste não encontrado.')
  return clone(document)
}

export const saveSiteEditorE2eDocument = (input: SiteEditorDocument, scope = 'default') => {
  const state = stateFor(scope)
  const id = normalizeEditorDocumentId(input._id)
  const current = state.documents.get(id)
  if (current?._rev && input._rev !== current._rev) {
    throw new Error('Este conteúdo foi alterado noutra janela. Recarregue antes de continuar.')
  }
  const next = {
    ...clone(input),
    _id: editorDraftId(id),
    _rev: `fixture-${++state.revision}`,
    _createdAt: current?._createdAt || timestamp,
    _updatedAt: new Date().toISOString(),
  } as SiteEditorDocument
  state.documents.set(id, next)
  return clone(next)
}

export const publishSiteEditorE2eDocument = (input: SiteEditorDocument, scope = 'default') => {
  const saved = saveSiteEditorE2eDocument(input, scope)
  const published = {
    ...clone(saved),
    _id: normalizeEditorDocumentId(saved._id),
  } as SiteEditorDocument
  stateFor(scope).publishedDocuments.set(published._id, clone(published))
  return published
}

export const createSiteEditorE2eDocument = (
  type: SiteEditorDocumentType,
  title: string,
  route: string | undefined,
  scope = 'default',
) => {
  if (type === 'siteLanding') throw new Error('O conteúdo global já existe.')
  const slug = fixtureSlug(title)
  const identity = type === 'sitePage' ? (route ?? `/${slug}`) : `${type}:${slug}`
  const id = `${type}-${createHash('sha256').update(identity).digest('hex').slice(0, 32)}`
  const duplicate = [...stateFor(scope).documents.values()].some((document) =>
    type === 'sitePage'
      ? document._type === 'sitePage' && document.route === route
      : document._type === type &&
        (document.slug as {current?: string} | undefined)?.current === slug,
  )
  if (duplicate) {
    if (type === 'storeCategory') {
      throw new SiteEditorDuplicateError('Já existe uma categoria com este nome.')
    }
    throw new SiteEditorDuplicateError(
      'Já existe conteúdo deste tipo com o mesmo endereço.',
    )
  }
  const hero = createBuilderSection('builderHeroSection')
  hero.title = {...hero.title, pt: title}
  hero.body = {...hero.body, pt: ''}
  const document = {
    _id: editorDraftId(id),
    _type: type,
    _rev: `fixture-${++stateFor(scope).revision}`,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    ...(type === 'sitePage'
      ? {
          editorVersion: 1,
          title,
          route: route || `/${slug}`,
          active: true,
          sections: [hero],
          seo: {
            _type: 'builderSeo',
            title: localizedString(title),
            description: localizedText(''),
            noIndex: true,
          },
        }
      : {
          ...createSiteEditorStarterFields({
            type,
            title,
            slug,
            storeCategory: defaultStoreCategoryOptions[0]?.value ?? 'bancos',
          }),
        }),
  } as SiteEditorDocument
  stateFor(scope).documents.set(id, document)
  return clone(document)
}

export const deleteSiteEditorE2eDocument = (id: string, scope = 'default') => {
  const state = stateFor(scope)
  const normalizedId = normalizeEditorDocumentId(id)
  const document = state.documents.get(normalizedId)
  if (document?._type === 'storeCategory') {
    const slug = (document.slug as {current?: string} | undefined)?.current
    const assigned = new Map<string, SiteEditorDocument>()
    for (const source of [state.documents, state.publishedDocuments]) {
      for (const [productId, candidate] of source.entries()) {
        if (candidate._type === 'storeProduct' && candidate.category === slug) {
          assigned.set(productId, candidate)
        }
      }
    }
    if (assigned.size) {
      throw new SiteEditorCategoryInUseError(
        [...assigned.values()].map((candidate) => {
          const title = candidate.title as {pt?: string} | undefined
          return title?.pt || 'Produto sem nome'
        }),
      )
    }
  }
  state.documents.delete(normalizedId)
  state.publishedDocuments.delete(normalizedId)
}

export const uploadSiteEditorE2eAsset = (file: File, kind: 'image' | 'video' | 'file') => {
  const extension =
    file.name
      .split('.')
      .at(-1)
      ?.replace(/[^a-zA-Z0-9]/g, '') || (kind === 'image' ? 'png' : 'mp4')
  const token = randomUUID().replace(/-/g, '')
  const id =
    kind === 'image' ? `image-${token}-1200x800-${extension}` : `file-${token}-${extension}`
  return {
    id,
    url: `https://cdn.sanity.io/${kind === 'image' ? 'images' : 'files'}/u4uyfix8/site-editor-e2e/${token}.${extension}`,
    originalFilename: file.name,
    mimeType: file.type,
    size: file.size,
  }
}
