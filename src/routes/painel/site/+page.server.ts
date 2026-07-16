import {
  siteEditorCapabilities,
  siteEditorDataset,
  siteEditorProjectId,
} from '$lib/server/site-editor'
import {
  builderPreviewConfigured,
  issueBuilderPreviewCookie,
} from '$lib/server/builder-preview'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({cookies, locals, parent, url}) => {
  const layout = await parent()
  const previewReady = Boolean(
    locals.staff && issueBuilderPreviewCookie(cookies, url, locals.staff),
  )

  return {
    builderCsrfToken: layout.painelCsrfToken,
    staffRole: locals.staff?.role ?? 'staff',
    capabilities: siteEditorCapabilities(),
    previewReady: previewReady && builderPreviewConfigured(),
    projectId: siteEditorProjectId,
    dataset: siteEditorDataset(),
  }
}
