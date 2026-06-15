import {contentFromSanity, getLanguage, languages} from '$lib/site-content'
import {getSanityCollections} from '$lib/sanity'
import type {LayoutServerLoad} from './$types'

export const load: LayoutServerLoad = async ({url}) => {
  const collections = await getSanityCollections()
  const language = getLanguage(url.searchParams.get('lang'))

  return {
    site: contentFromSanity(collections),
    language,
    languages,
    currentPath: url.pathname,
    isUsingSanityContent: Boolean(
      collections?.products?.length || collections?.caseStudies?.length || collections?.blogPosts?.length,
    ),
  }
}
