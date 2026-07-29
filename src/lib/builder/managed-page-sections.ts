import type {BuilderSection, ManagedSectionComponent} from './types'

export const managedPageSectionScopes = [
  {id: 'page-home', title: 'Página inicial', route: '/', rootPath: 'home'},
  {id: 'page-about', title: 'Sobre', route: '/sobre-nos', rootPath: 'about'},
  {id: 'page-products', title: 'Produtos', route: '/produtos', rootPath: 'productsPage'},
  {id: 'page-store', title: 'Loja', route: '/loja', rootPath: 'storePage'},
  {id: 'page-cart', title: 'Carrinho', route: '/carrinho', rootPath: 'cartPage'},
  {id: 'page-catalogue', title: 'Catálogo', route: '/catalogo', rootPath: 'catalogue'},
  {
    id: 'page-cases',
    title: 'Casos de estudo',
    route: '/casos-de-estudo',
    rootPath: 'casesPage',
  },
  {id: 'page-blog', title: 'Blog', route: '/blog', rootPath: 'blogPage'},
  {id: 'page-contact', title: 'Contacto', route: '/contacto', rootPath: 'contactPage'},
  {
    id: 'page-returns',
    title: 'Política de devoluções',
    route: '/politica-de-devolucoes',
    rootPath: 'returnsPolicy',
  },
] as const

export type ManagedPageSectionScope = (typeof managedPageSectionScopes)[number]
export type ManagedPageSectionRoot = ManagedPageSectionScope['rootPath']

export const managedDetailSectionRoutes = [
  {prefix: '/produtos/', documentType: 'productCategory'},
  {prefix: '/loja/', documentType: 'storeProduct'},
  {prefix: '/casos-de-estudo/', documentType: 'caseStudy'},
  {prefix: '/blog/', documentType: 'blogPost'},
] as const

export const managedDetailSectionDocumentTypes = managedDetailSectionRoutes.map(
  ({documentType}) => documentType,
)

export type ManagedDetailSectionScope = {
  documentType: (typeof managedDetailSectionRoutes)[number]['documentType']
  slug: string
}

export type ManagedCoreSectionDefinition = {
  component: ManagedSectionComponent
  key: string
  label: string
  description: string
  panelIds: string[]
  fieldNames?: string[]
}

const fixedCoreDefinitions: Record<ManagedPageSectionRoot, ManagedCoreSectionDefinition> = {
  home: {
    component: 'homeCore',
    key: 'managed-home-core',
    label: 'Topo da página',
    description: 'Título e vídeo principal da página inicial',
    panelIds: ['home-main'],
    fieldNames: ['hero', 'heroVideo', 'heroVideoLabel', 'heroVideoCloseLabel'],
  },
  about: {
    component: 'aboutCore',
    key: 'managed-about-core',
    label: 'História da empresa',
    description: 'Topo, apresentação e momentos da empresa',
    panelIds: ['about-main'],
  },
  productsPage: {
    component: 'productsCore',
    key: 'managed-products-core',
    label: 'Produtos',
    description: 'Topo, pesquisa e lista dos produtos',
    panelIds: ['products-page'],
  },
  storePage: {
    component: 'storeCore',
    key: 'managed-store-core',
    label: 'Loja',
    description: 'Topo, filtros e lista dos produtos à venda',
    panelIds: ['store-page-hero'],
  },
  cartPage: {
    component: 'cartCore',
    key: 'managed-cart-core',
    label: 'Carrinho e resumo',
    description: 'Produtos, transporte, totais e ações do carrinho',
    panelIds: [
      'cart-page-top',
      'cart-page-actions',
      'cart-page-products',
      'cart-page-delivery',
      'cart-page-totals',
    ],
  },
  catalogue: {
    component: 'catalogueCore',
    key: 'managed-catalogue-core',
    label: 'Pedido de catálogo',
    description: 'Topo, informação e formulário do catálogo',
    panelIds: ['catalogue-page'],
  },
  casesPage: {
    component: 'casesCore',
    key: 'managed-cases-core',
    label: 'Casos de estudo',
    description: 'Topo, pesquisa e lista de casos',
    panelIds: ['cases-page'],
  },
  blogPage: {
    component: 'blogCore',
    key: 'managed-blog-core',
    label: 'Blog',
    description: 'Topo, pesquisa e lista de artigos',
    panelIds: ['blog-page'],
  },
  contactPage: {
    component: 'contactCore',
    key: 'managed-contact-core',
    label: 'Contacto e formulário',
    description: 'Informação de contacto e formulário',
    panelIds: ['contact-page'],
  },
  returnsPolicy: {
    component: 'returnsCore',
    key: 'managed-returns-core',
    label: 'Política de devoluções',
    description: 'Título, introdução e condições',
    panelIds: ['returns-policy'],
  },
}

const detailCoreDefinitions: Record<
  ManagedDetailSectionScope['documentType'],
  ManagedCoreSectionDefinition
> = {
  productCategory: {
    component: 'productDetailCore',
    key: 'managed-product-detail-core',
    label: 'Apresentação do produto',
    description: 'Título, descrição, galeria e informação técnica',
    panelIds: ['content', 'media', 'specs'],
  },
  storeProduct: {
    component: 'storeDetailCore',
    key: 'managed-store-detail-core',
    label: 'Produto da Loja',
    description: 'Título, preço, variantes, peso e galeria',
    panelIds: ['content', 'pricing', 'media'],
  },
  caseStudy: {
    component: 'caseDetailCore',
    key: 'managed-case-detail-core',
    label: 'Caso de estudo',
    description: 'Título, local, descrição e galeria',
    panelIds: ['content', 'media'],
  },
  blogPost: {
    component: 'blogDetailCore',
    key: 'managed-blog-detail-core',
    label: 'Artigo',
    description: 'Informação, texto, capa e galeria do artigo',
    panelIds: ['article-details', 'article-content', 'media'],
  },
}

export const managedCoreSectionForRoot = (rootPath: string | undefined) =>
  rootPath && rootPath in fixedCoreDefinitions
    ? fixedCoreDefinitions[rootPath as ManagedPageSectionRoot]
    : undefined

export const managedCoreSectionForDocumentType = (documentType: string | undefined) =>
  documentType && documentType in detailCoreDefinitions
    ? detailCoreDefinitions[documentType as ManagedDetailSectionScope['documentType']]
    : undefined

export const managedCoreSectionFor = (
  rootPath: string | undefined,
  documentType: string | undefined,
) =>
  managedCoreSectionForRoot(rootPath) ??
  managedCoreSectionForDocumentType(documentType)

export const createManagedCoreSection = (
  definition: ManagedCoreSectionDefinition,
): BuilderSection => ({
  _type: 'builderManagedSection',
  _key: definition.key,
  component: definition.component,
  internalLabel: definition.label,
  enabled: true,
})

export const isManagedCoreSection = (
  section: BuilderSection | undefined,
): section is BuilderSection & {_type: 'builderManagedSection'; component: ManagedSectionComponent} =>
  section?._type === 'builderManagedSection' && Boolean(section.component)

/**
 * Managed areas are virtual during rollout and become persisted as soon as
 * the client changes the page order or visibility. Existing authored sections
 * retain their keys and order; duplicate managed markers are discarded.
 */
export const withManagedCoreSection = (
  sections: BuilderSection[] | undefined,
  definition: ManagedCoreSectionDefinition | undefined,
): BuilderSection[] => {
  if (!definition) return sections ?? []

  const next: BuilderSection[] = []
  let foundCore = false
  for (const section of sections ?? []) {
    if (section._type !== 'builderManagedSection') {
      next.push(section)
      continue
    }
    if (!foundCore && section.component === definition.component) {
      foundCore = true
      next.push({
        ...section,
        _key: definition.key,
        component: definition.component,
        internalLabel: section.internalLabel?.trim() || definition.label,
      })
    }
  }

  return foundCore ? next : [createManagedCoreSection(definition), ...next]
}

export const splitManagedCoreSections = (
  sections: BuilderSection[],
  definition: ManagedCoreSectionDefinition,
) => {
  const normalized = withManagedCoreSection(sections, definition)
  const coreIndex = normalized.findIndex(
    (section) =>
      section._type === 'builderManagedSection' &&
      section.component === definition.component,
  )

  return {
    sections: normalized,
    before: normalized.slice(0, coreIndex).filter((section) => !isManagedCoreSection(section)),
    core: normalized[coreIndex] ?? createManagedCoreSection(definition),
    after: normalized.slice(coreIndex + 1).filter((section) => !isManagedCoreSection(section)),
  }
}

const normalizeRoute = (route: string) => route.replace(/\/+$/, '') || '/'

export const managedPageSectionScopeForRoot = (rootPath: string | undefined) =>
  managedPageSectionScopes.find((scope) => scope.rootPath === rootPath)

export const managedPageSectionScopeForRoute = (route: string) => {
  const normalized = normalizeRoute(route)
  return managedPageSectionScopes.find((scope) => scope.route === normalized)
}

export const managedDetailSectionScopeForRoute = (
  route: string,
): ManagedDetailSectionScope | undefined => {
  const normalized = normalizeRoute(route)
  const definition = managedDetailSectionRoutes.find(
    ({prefix}) => normalized.startsWith(prefix) && !normalized.slice(prefix.length).includes('/'),
  )
  if (!definition) return undefined

  const slug = decodeURIComponent(normalized.slice(definition.prefix.length)).trim()
  if (!slug) return undefined
  const canonicalSlug =
    definition.documentType === 'productCategory' && slug === 'decking'
      ? 'decking-pavimentos-passadicos'
      : slug
  return {documentType: definition.documentType, slug: canonicalSlug}
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const managedPageSectionsFrom = (
  siteContent: unknown,
  rootPath: ManagedPageSectionRoot,
): BuilderSection[] => {
  if (!isRecord(siteContent)) return []
  const page = siteContent[rootPath]
  if (!isRecord(page) || !Array.isArray(page.sections)) return []
  return page.sections as BuilderSection[]
}

export type BuilderCollectionScope = {
  products: boolean
  store: boolean
  cases: boolean
  blog: boolean
}

export const emptyBuilderCollectionScope = (): BuilderCollectionScope => ({
  products: false,
  store: false,
  cases: false,
  blog: false,
})

export const builderCollectionScopeForSections = (
  sections: BuilderSection[] | undefined,
): BuilderCollectionScope => {
  const scope = emptyBuilderCollectionScope()

  for (const section of sections ?? []) {
    if (section.enabled === false || section._type !== 'builderCollectionSection') continue
    if (section.source === 'storeProduct') scope.store = true
    else if (section.source === 'caseStudy') scope.cases = true
    else if (section.source === 'blogPost') scope.blog = true
    else scope.products = true
  }

  return scope
}

export const mergeBuilderCollectionScopes = (
  left: Partial<BuilderCollectionScope>,
  right: Partial<BuilderCollectionScope>,
): BuilderCollectionScope => ({
  products: Boolean(left.products || right.products),
  store: Boolean(left.store || right.store),
  cases: Boolean(left.cases || right.cases),
  blog: Boolean(left.blog || right.blog),
})

export const builderCollectionScopesEqual = (
  left: Partial<BuilderCollectionScope>,
  right: Partial<BuilderCollectionScope>,
) =>
  Boolean(left.products) === Boolean(right.products) &&
  Boolean(left.store) === Boolean(right.store) &&
  Boolean(left.cases) === Boolean(right.cases) &&
  Boolean(left.blog) === Boolean(right.blog)
