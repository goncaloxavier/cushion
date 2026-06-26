import {contentFromSanity, getLanguage, languages} from '$lib/site-content'
import {getSanityCollections} from '$lib/sanity'
import {isPreview} from '$lib/server/preview'
import type {LayoutServerLoad} from './$types'

export const load: LayoutServerLoad = async ({url, cookies}) => {
  const preview = isPreview(cookies)
  const collections = await getSanityCollections(preview)
  const language = getLanguage(url.searchParams.get('lang'))

  return {
    site: contentFromSanity(collections),
    language,
    languages,
    currentPath: url.pathname,
    preview,
    isUsingSanityContent: Boolean(
      collections?.siteContent ||
        collections?.products?.length ||
        collections?.storeProducts?.length ||
        collections?.caseStudies?.length ||
        collections?.blogPosts?.length,
    ),
  }
}
