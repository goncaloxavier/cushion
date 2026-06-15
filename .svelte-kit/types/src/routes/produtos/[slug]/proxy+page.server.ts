// @ts-nocheck
import {error} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'

export const load = async ({params, parent}: Parameters<PageServerLoad>[0]) => {
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
