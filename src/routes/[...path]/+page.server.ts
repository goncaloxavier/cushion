import {error} from '@sveltejs/kit'
import {getSiteEditorSettings, getSitePage, sanityDataset} from '$lib/sanity'
import {isBuilderPreviewRequest} from '$lib/server/builder-preview'
import {isPreview} from '$lib/server/preview'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, cookies, request, url}) => {
  const route = `/${params.path || ''}`.replace(/\/$/, '') || '/'
  const preview =
    isPreview(cookies, request.headers) ||
    isBuilderPreviewRequest(cookies, url, request.headers)
  const [page, settings] = await Promise.all([
    getSitePage(route, preview),
    getSiteEditorSettings(preview),
  ])
  if (!page) error(404, 'Página não encontrada.')
  return {page, settings, sanityDataset, preview}
}
