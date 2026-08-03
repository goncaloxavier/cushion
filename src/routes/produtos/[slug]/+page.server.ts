import {error} from '@sveltejs/kit'
import {pageFromSearchParams} from '$lib/collection-page'
import {detailSlugCandidates} from '$lib/builder/managed-page-sections'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, parent, url}) => {
  const {site, language, detailSections} = await parent()
  const content = site
  // One shared alias list, so the product lookup and the section fetch can never
  // disagree about which document this route means.
  const candidates = detailSlugCandidates(params.slug)
  const product = content.products.find((item) => candidates.includes(item.slug))

  if (!product) {
    error(404, 'Product not found')
  }

  return {
    product: {...product, sections: detailSections},
    language,
    returnPage: pageFromSearchParams(url.searchParams, 'fromPage'),
  }
}
