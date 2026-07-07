import {isQueryTooShort} from '$lib/search'
import {getSanityCollections} from '$lib/sanity'
import {searchSite} from '$lib/server/search'
import {contentFromSanity, getLanguage} from '$lib/site-content'
import {json} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({url, setHeaders}) => {
  const language = getLanguage(url.searchParams.get('lang'))
  const query = url.searchParams.get('q') ?? ''

  setHeaders({'cache-control': 'no-store'})

  if (isQueryTooShort(query)) {
    return json({query, results: {products: [], storeProducts: [], caseStudies: [], blogPosts: []}})
  }

  const site = contentFromSanity(await getSanityCollections())
  return json({query, results: searchSite(site[language], query)})
}
