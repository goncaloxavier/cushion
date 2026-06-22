import {error} from '@sveltejs/kit'
import {pageFromSearchParams} from '$lib/collection-page'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, parent, url}) => {
  const {site, language} = await parent()
  const content = site[language]
  const caseStudy = content.caseStudies.find((item) => item.slug === params.slug)

  if (!caseStudy) {
    error(404, 'Case study not found')
  }

  return {
    caseStudy,
    language,
    returnPage: pageFromSearchParams(url.searchParams, 'fromPage'),
  }
}
