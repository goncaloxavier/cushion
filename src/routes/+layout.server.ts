import {contentFromSanity, getLanguage, languages} from '$lib/site-content'
import {getSanityCollections, sanityStudioUrl} from '$lib/sanity'
import {isPreview} from '$lib/server/preview'
import {isBuilderPreviewRequest} from '$lib/server/builder-preview'
import {
  builderDataset,
  getBuilderPreviewPage,
  getBuilderPreviewSettings,
} from '$lib/server/builder'
import type {LayoutServerLoad} from './$types'

export const load: LayoutServerLoad = async ({url, cookies, locals, request}) => {
  const preview = isPreview(cookies, request.headers)
  const builderPreview = isBuilderPreviewRequest(cookies, url, request.headers)
  const builderRenderMode =
    builderPreview && url.searchParams.get('__view') === 'builder' ? 'builder' : 'legacy'
  const collections = await getSanityCollections(preview || builderPreview)
  const language = getLanguage(url.searchParams.get('lang'))
  const [builderPage, builderSettings] =
    builderRenderMode === 'builder'
      ? await Promise.all([
          getBuilderPreviewPage(url.pathname).catch(() => null),
          getBuilderPreviewSettings().catch(() => null),
        ])
      : [null, null]

  return {
    // contentFromSanity builds all 3 languages (cheap in-memory work off a
    // single Sanity fetch), but every consumer only ever reads the current
    // language's slice (grep confirms it — nothing needs a second language
    // without its own page reload). Slicing here instead of shipping the
    // full Record<LanguageCode, SiteContent> to the client cuts the layout
    // payload roughly 3x; a login page no longer ships the entire product
    // catalogue in two languages it will never render.
    site: contentFromSanity(collections)[language],
    language,
    languages,
    currentPath: url.pathname,
    preview,
    builderPreview,
    builderRenderMode,
    builderPage,
    builderSettings,
    builderDataset: builderPreview ? builderDataset() : '',
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
