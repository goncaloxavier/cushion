import {error, json} from '@sveltejs/kit'
import {uploadBuilderAsset} from '$lib/server/builder'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import type {RequestHandler} from './$types'
import {siteEditorE2eEnabled, uploadSiteEditorE2eAsset} from '$lib/server/site-editor-e2e'

const csrfCookieName = 'df4y_painel_csrf'

export const POST: RequestHandler = async ({request, url, cookies, locals}) => {
  if (!locals.staff) error(401, 'Inicie sessão para carregar ficheiros.')
  if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
    error(403, 'Origem inválida.')
  }
  if (!csrfOk(cookies.get(csrfCookieName), request.headers.get('x-csrf-token') || '')) {
    error(403, 'Sessão de edição inválida. Atualize a página.')
  }

  const form = await request.formData()
  const file = form.get('file')
  const kind = form.get('kind')
  if (!(file instanceof File) || (kind !== 'image' && kind !== 'video')) {
    error(400, 'Escolha uma imagem ou vídeo válido.')
  }

  const asset = siteEditorE2eEnabled()
    ? uploadSiteEditorE2eAsset(file, kind)
    : await uploadBuilderAsset(file, kind)
  return json({
    asset: {
      id: '_id' in asset ? asset._id : asset.id,
      url: asset.url,
      originalFilename: asset.originalFilename,
      mimeType: asset.mimeType,
      size: asset.size,
    },
  })
}
