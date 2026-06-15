import {error} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, parent}) => {
  const {site, language} = await parent()
  const content = site[language]
  const product = content.products.find((item) => item.slug === params.slug)

  if (!product) {
    error(404, 'Product not found')
  }

  return {
    product,
    language,
  }
}
