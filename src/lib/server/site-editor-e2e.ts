import {randomUUID} from 'node:crypto'
import type {StaffUser} from './staff-auth'
import type {
  SiteEditorDocument,
  SiteEditorDocumentType,
  SiteEditorManifest,
  SiteEditorNode,
} from '$lib/site-editor/types'
import {editorDraftId, normalizeEditorDocumentId} from '$lib/site-editor/path'

const requestHeader = 'x-df4y-site-editor-e2e'
const scopeHeader = 'x-df4y-site-editor-scope'

export const siteEditorE2eEnabled = () =>
  process.env.NODE_ENV !== 'production' && process.env.SITE_EDITOR_E2E === 'true'

export const siteEditorE2eRequestStaff = (headers: Headers): StaffUser | null => {
  const expected = process.env.SITE_EDITOR_E2E_KEY || ''
  if (!siteEditorE2eEnabled() || !expected || headers.get(requestHeader) !== expected) return null
  return {
    id: 'site-editor-e2e-admin',
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

const navigation = [
  ['nav-about', 'Sobre', '/sobre-nos', 'primary'],
  ['nav-products', 'Soluções', '/produtos', 'primary'],
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
      heroVideoUrl: 'https://www.youtube.com/watch?v=e2e',
      heroVideoLabel: localizedString('Ver vídeo institucional'),
      heroVideoCloseLabel: localizedString('Fechar vídeo'),
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
]

type FixtureState = {
  documents: Map<string, SiteEditorDocument>
  revision: number
}

const fixtureStates = new Map<string, FixtureState>()

const clone = <T,>(value: T): T => structuredClone(value)

const stateFor = (scope = 'default') => {
  let state = fixtureStates.get(scope)
  if (!state) {
    state = {
      documents: new Map(
        initialDocuments().map((document) => [normalizeEditorDocumentId(document._id), document]),
      ),
      revision: 1,
    }
    fixtureStates.set(scope, state)
  }
  return state
}

const contentFillerNodes = (): SiteEditorNode[] => [
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
  },
  {
    id: 'fixture-blog-collection',
    kind: 'collection',
    area: 'content',
    title: 'Artigos do Blog',
    route: '/blog',
    collectionType: 'blogPost',
    count: 24,
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

export const getSiteEditorE2eManifest = (
  canPublish: boolean,
  scope = 'default',
): SiteEditorManifest => {
  stateFor(scope)
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
      ...contentFillerNodes(),
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

export const saveSiteEditorE2eDocument = (
  input: SiteEditorDocument,
  scope = 'default',
) => {
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

export const publishSiteEditorE2eDocument = (
  input: SiteEditorDocument,
  scope = 'default',
) => {
  const saved = saveSiteEditorE2eDocument(input, scope)
  return {...saved, _id: normalizeEditorDocumentId(saved._id)} as SiteEditorDocument
}

export const createSiteEditorE2eDocument = (
  type: SiteEditorDocumentType,
  title: string,
  route: string | undefined,
  scope = 'default',
) => {
  const id = `${type}.${randomUUID()}`
  const document = {
    _id: editorDraftId(id),
    _type: type,
    _rev: `fixture-${++stateFor(scope).revision}`,
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
    ...(type === 'sitePage'
      ? {editorVersion: 1, title, route: route || '/pagina-de-teste', active: true, sections: []}
      : {title: localizedString(title), slug: {_type: 'slug', current: 'conteudo-de-teste'}}),
  } as SiteEditorDocument
  stateFor(scope).documents.set(id, document)
  return clone(document)
}

export const deleteSiteEditorE2eDocument = (id: string, scope = 'default') => {
  stateFor(scope).documents.delete(normalizeEditorDocumentId(id))
}

export const uploadSiteEditorE2eAsset = (file: File, kind: 'image' | 'video') => {
  const extension = file.name.split('.').at(-1)?.replace(/[^a-zA-Z0-9]/g, '') ||
    (kind === 'image' ? 'png' : 'mp4')
  const token = randomUUID().replace(/-/g, '')
  const id = kind === 'image'
    ? `image-${token}-1200x800-${extension}`
    : `file-${token}-${extension}`
  return {
    id,
    url: `https://cdn.sanity.io/${kind === 'image' ? 'images' : 'files'}/u4uyfix8/site-editor-e2e/${token}.${extension}`,
    originalFilename: file.name,
    mimeType: file.type,
    size: file.size,
  }
}
