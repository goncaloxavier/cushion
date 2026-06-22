import {error} from '@sveltejs/kit'
import {pageFromSearchParams} from '$lib/collection-page'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, parent, url}) => {
  const {site, language} = await parent()
  const content = site[language]
  const storeProduct = content.storeProducts.find((item) => item.slug === params.slug)

  if (!storeProduct) {
    error(404, 'Store product not found')
  }

  return {
    storeProduct,
    language,
    returnPage: pageFromSearchParams(url.searchParams, 'fromPage'),
  }
}
