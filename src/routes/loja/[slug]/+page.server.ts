import {error} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, parent}) => {
  const {site, language} = await parent()
  const content = site[language]
  const storeProduct = content.storeProducts.find((item) => item.slug === params.slug)

  if (!storeProduct) {
    error(404, 'Store product not found')
  }

  return {
    storeProduct,
    language,
  }
}
