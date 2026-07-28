import {getSiteEditorSettings, sanityDataset} from '$lib/sanity'
import {isBuilderPreviewRequest} from '$lib/server/builder-preview'
import {isPreview} from '$lib/server/preview'
import type {PageServerLoad} from './$types'

// The landing page renders free builder sections below its designed blocks, and
// BuilderPageRenderer needs the shared theme settings plus the dataset to
// resolve image references. Fetched here rather than in the root layout so the
// rest of the site does not carry them in every page payload.
export const load: PageServerLoad = async ({cookies, request, url}) => {
  const preview = isPreview(cookies, request.headers) || isBuilderPreviewRequest(cookies, url, request.headers)
  return {
    settings: await getSiteEditorSettings(preview),
    sanityDataset,
    preview,
  }
}
