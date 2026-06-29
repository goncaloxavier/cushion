import {error} from '@sveltejs/kit'
import {pageFromSearchParams} from '$lib/collection-page'
import type {PageServerLoad} from './$types'

const productSlugAliases: Record<string, string> = {
  decking: 'decking-pavimentos-passadicos',
}

export const load: PageServerLoad = async ({params, parent, url}) => {
  const {site, language} = await parent()
  const content = site[language]
  const product =
    content.products.find((item) => item.slug === params.slug) ??
    content.products.find((item) => item.slug === productSlugAliases[params.slug])

  if (!product) {
    error(404, 'Product not found')
  }

  return {
    product,
    language,
    returnPage: pageFromSearchParams(url.searchParams, 'fromPage'),
  }
}
