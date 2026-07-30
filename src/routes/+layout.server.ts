import {
  contentFromSanity,
  getLanguage,
  languages,
  type SiteContent,
} from '$lib/site-content'
import {
  getBuilderDocumentSections,
  getSanityCollections,
  getSiteEditorSettings,
  sanityDataset,
  sanityStudioUrl,
} from '$lib/sanity'
import {
  builderCollectionScopeForSections,
  builderCollectionScopesEqual,
  managedDetailSectionScopeForRoute,
  managedPageSectionScopeForRoute,
  managedPageSectionsFrom,
  mergeBuilderCollectionScopes,
} from '$lib/builder/managed-page-sections'
import {isPreview} from '$lib/server/preview'
import {isBuilderPreviewRequest} from '$lib/server/builder-preview'
import type {LayoutServerLoad} from './$types'

const collectionScopeForRoute = (pathname: string) => ({
  products: pathname === '/' || pathname.startsWith('/produtos'),
  store:
    pathname.startsWith('/loja') ||
    pathname.startsWith('/carrinho') ||
    pathname.startsWith('/finalizar-compra') ||
    pathname.startsWith('/contacto'),
  cases: pathname === '/' || pathname.startsWith('/casos-de-estudo'),
  blog: pathname.startsWith('/blog'),
})

const contentForRoute = (
  content: SiteContent,
  pathname: string,
  preserveCollections: boolean,
): SiteContent => {
  if (preserveCollections) return content

  const knownRoute =
    pathname === '/' ||
    pathname.startsWith('/sobre-nos') ||
    pathname.startsWith('/produtos') ||
    pathname.startsWith('/loja') ||
    pathname.startsWith('/carrinho') ||
    pathname.startsWith('/finalizar-compra') ||
    pathname.startsWith('/casos-de-estudo') ||
    pathname.startsWith('/blog') ||
    pathname.startsWith('/catalogo') ||
    pathname.startsWith('/contacto') ||
    pathname.startsWith('/conta') ||
    pathname.startsWith('/painel') ||
    pathname.startsWith('/politica-de-devolucoes')

  // Flexible Sanity pages can contain collection sections, so retain every
  // collection for routes that are not part of the fixed application shell.
  if (!knownRoute) return content

  const managedScope = managedPageSectionScopeForRoute(pathname)
  const sectionCollections = builderCollectionScopeForSections(
    managedScope ? managedPageSectionsFrom(content, managedScope.rootPath) : [],
  )
  const needsProducts =
    pathname === '/' || pathname.startsWith('/produtos') || sectionCollections.products
  const needsStore =
    pathname.startsWith('/loja') ||
    pathname.startsWith('/carrinho') ||
    pathname.startsWith('/finalizar-compra') ||
    pathname.startsWith('/contacto') ||
    sectionCollections.store
  const needsCases =
    pathname === '/' || pathname.startsWith('/casos-de-estudo') || sectionCollections.cases
  const needsBlog = pathname.startsWith('/blog') || sectionCollections.blog

  return {
    ...content,
    products: needsProducts ? content.products : [],
    storeProducts: needsStore ? content.storeProducts : [],
    caseStudies: needsCases ? content.caseStudies : [],
    blogPosts: needsBlog ? content.blogPosts : [],
  }
}

export const load: LayoutServerLoad = async ({url, cookies, locals, request}) => {
  const preview = isPreview(cookies, request.headers)
  const builderPreview = isBuilderPreviewRequest(cookies, url, request.headers)
  const draftPreview = preview || builderPreview
  const managedScope = managedPageSectionScopeForRoute(url.pathname)
  const managedDetailScope = managedDetailSectionScopeForRoute(url.pathname)
  const baseCollectionScope = collectionScopeForRoute(url.pathname)
  const [initialCollections, settings, detailSections] = await Promise.all([
    getSanityCollections(
      draftPreview,
      draftPreview ? undefined : baseCollectionScope,
    ),
    managedScope || managedDetailScope
      ? getSiteEditorSettings(draftPreview)
      : Promise.resolve(null),
    managedDetailScope
      ? getBuilderDocumentSections(managedDetailScope, draftPreview)
      : Promise.resolve(null),
  ])
  let collections = initialCollections

  if (!draftPreview && (managedScope || managedDetailScope) && initialCollections) {
    const sectionScope = builderCollectionScopeForSections(
      managedScope
        ? managedPageSectionsFrom(initialCollections.siteContent, managedScope.rootPath)
        : detailSections ?? [],
    )
    const completeScope = mergeBuilderCollectionScopes(baseCollectionScope, sectionScope)
    if (!builderCollectionScopesEqual(baseCollectionScope, completeScope)) {
      collections = await getSanityCollections(false, completeScope)
    }
  }
  const language = getLanguage(url.searchParams.get('lang'))

  const currentContent = contentFromSanity(collections)[language]

  return {
    // contentFromSanity builds all 3 languages (cheap in-memory work off a
    // single Sanity fetch), but every consumer only ever reads the current
    // language's slice (grep confirms it — nothing needs a second language
    // without its own page reload). Slicing here instead of shipping the
    // full Record<LanguageCode, SiteContent> to the client cuts the layout
    // payload roughly 3x; a login page no longer ships the entire product
    // catalogue in two languages it will never render.
    site: contentForRoute(
      currentContent,
      url.pathname,
      preview || builderPreview,
    ),
    language,
    languages,
    currentPath: url.pathname,
    preview,
    builderPreview,
    settings,
    detailSections: detailSections ?? [],
    sanityDataset,
    studioUrl: preview || builderPreview ? sanityStudioUrl : '',
    // Minimal, non-sensitive account summary for header state. The customer's
    // own data; full details load per-page under /conta.
    account: locals.customer
      ? {
          name: locals.customer.name,
          firstName: locals.customer.name.trim().split(/\s+/)[0] ?? '',
          emailVerified: Boolean(locals.customer.emailVerifiedAt),
        }
      : null,
    isUsingSanityContent: Boolean(
      collections?.siteContent ||
        collections?.products?.length ||
        collections?.storeProducts?.length ||
        collections?.caseStudies?.length ||
        collections?.blogPosts?.length,
    ),
  }
}
