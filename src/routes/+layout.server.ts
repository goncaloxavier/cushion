import {contentFromSanity, getLanguage, languages} from '$lib/site-content'
import {getSanityCollections, sanityStudioUrl} from '$lib/sanity'
import {isPreview} from '$lib/server/preview'
import type {LayoutServerLoad} from './$types'

export const load: LayoutServerLoad = async ({url, cookies, locals, request}) => {
  const preview = isPreview(cookies, request.headers)
  const collections = await getSanityCollections(preview)
  const language = getLanguage(url.searchParams.get('lang'))

  return {
    site: contentFromSanity(collections),
    language,
    languages,
    currentPath: url.pathname,
    preview,
    studioUrl: preview ? sanityStudioUrl : '',
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
