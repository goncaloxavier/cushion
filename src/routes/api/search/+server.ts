import {isQueryTooShort} from '$lib/search'
import {getSanityCollections} from '$lib/sanity'
import {rateLimit, rateLimitKey} from '$lib/server/rate-limit'
import {searchSite} from '$lib/server/search'
import {contentFromSanity, getLanguage} from '$lib/site-content'
import {json} from '@sveltejs/kit'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({url, getClientAddress, setHeaders}) => {
  const language = getLanguage(url.searchParams.get('lang'))
  const query = url.searchParams.get('q') ?? ''

  setHeaders({'cache-control': 'no-store'})

  // Generous enough for a debounced type-as-you-search box (fires at most
  // every ~180ms client-side) while still bounding a scripted hammering loop.
  const ipKey = rateLimitKey('search', getClientAddress())
  if (rateLimit(ipKey, 60, 60 * 1000)) {
    return json({error: 'rate_limited'}, {status: 429})
  }

  if (isQueryTooShort(query)) {
    return json({query, results: {products: [], storeProducts: [], caseStudies: [], blogPosts: []}})
  }

  const site = contentFromSanity(await getSanityCollections())
  return json({query, results: searchSite(site[language], query)})
}
