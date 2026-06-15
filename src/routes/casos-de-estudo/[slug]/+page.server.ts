import {error} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, parent}) => {
  const {site, language} = await parent()
  const content = site[language]
  const caseStudy = content.caseStudies.find((item) => item.slug === params.slug)

  if (!caseStudy) {
    error(404, 'Case study not found')
  }

  return {
    caseStudy,
    language,
  }
}
