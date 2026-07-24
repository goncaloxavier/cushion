import {error, json} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {canManageStaff} from '$lib/server/staff-auth'
import {
  createSiteEditorDocument,
  deleteSiteEditorDocument,
  getSiteEditorDocument,
  getSiteEditorManifest,
  publishSiteEditorDocument,
  saveSiteEditorDocument,
  SiteEditorConflictError,
} from '$lib/server/site-editor'
import type {SiteEditorDocument} from '$lib/site-editor/types'
import {siteEditorE2eScope} from '$lib/server/site-editor-e2e'
import {
  SiteEditorCategoryInUseError,
  SiteEditorDuplicateError,
  SiteEditorValidationError,
} from '$lib/server/site-editor-errors'
import {logStaffActivity} from '$lib/server/staff-activity'
import type {RequestHandler} from './$types'

const csrfCookieName = 'df4y_painel_csrf'
const maxJsonBytes = 4 * 1024 * 1024

const requireMutationAccess = (
  request: Request,
  url: URL,
  cookies: {get: (name: string) => string | undefined},
) => {
  if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
    error(403, 'Origem inválida.')
  }
  if (!csrfOk(cookies.get(csrfCookieName), request.headers.get('x-csrf-token') || '')) {
    error(403, 'Sessão de edição inválida. Atualize a página.')
  }
  const declaredLength = Number(request.headers.get('content-length') || 0)
  if (declaredLength > maxJsonBytes) error(413, 'A alteração excede o limite permitido.')
}

const readBody = async <T>(request: Request): Promise<T> => {
  const text = await request.text()
  if (Buffer.byteLength(text, 'utf8') > maxJsonBytes) {
    error(413, 'A alteração excede o limite permitido.')
  }
  try {
    return JSON.parse(text) as T
  } catch {
    error(400, 'O pedido não contém JSON válido.')
  }
}

const runMutation = async <T>(operation: () => Promise<T>) => {
  try {
    return await operation()
  } catch (cause) {
    if (cause instanceof SiteEditorConflictError) error(409, cause.message)
    if (cause instanceof SiteEditorDuplicateError) error(409, cause.message)
    if (cause instanceof SiteEditorCategoryInUseError) error(409, cause.message)
    if (cause instanceof SiteEditorValidationError) error(400, cause.message)
    // Anything else is unclassified, but its message was still written by a
    // developer to be read by a person — surfacing it beats SvelteKit's
    // generic, message-less 500 that this whole helper exists to avoid.
    if (cause instanceof Error && cause.message) error(500, cause.message)
    throw cause
  }
}

export const GET: RequestHandler = async ({locals, request, url}) => {
  if (!locals.staff) error(401, 'Inicie sessão para abrir o editor do site.')
  const scope = siteEditorE2eScope(request.headers)
  const documentId = url.searchParams.get('document')?.trim()
  if (documentId) {
    return json({document: await runMutation(() => getSiteEditorDocument(documentId, scope))})
  }
  return json(await runMutation(() => getSiteEditorManifest(canManageStaff(locals.staff), scope)))
}

export const PUT: RequestHandler = async ({request, url, cookies, locals}) => {
  if (!locals.staff) error(401, 'Inicie sessão para editar o site.')
  requireMutationAccess(request, url, cookies)
  const body = await readBody<{document?: SiteEditorDocument}>(request)
  if (!body.document) error(400, 'Conteúdo em falta.')
  const scope = siteEditorE2eScope(request.headers)
  return json({document: await runMutation(() => saveSiteEditorDocument(body.document!, scope))})
}

export const POST: RequestHandler = async ({request, url, cookies, locals}) => {
  if (!locals.staff) error(401, 'Inicie sessão para editar o site.')
  requireMutationAccess(request, url, cookies)
  const body = await readBody<
    | {action: 'publish'; document?: SiteEditorDocument}
    | {action: 'create'; documentType?: string; title?: string; route?: string}
  >(request)
  const scope = siteEditorE2eScope(request.headers)

  if (body.action === 'publish') {
    if (!canManageStaff(locals.staff)) error(403, 'Apenas administradores podem publicar.')
    if (!body.document) error(400, 'Conteúdo em falta.')
    const published = await runMutation(() => publishSiteEditorDocument(body.document!, scope))
    await logStaffActivity({
      staff: locals.staff,
      action: 'site.publish',
      entityType: 'siteDocument',
      entityId: body.document._id,
      entityLabel: body.document._type,
    })
    return json({document: published})
  }
  if (body.action === 'create') {
    return json({
      document: await runMutation(() =>
        createSiteEditorDocument(body.documentType, body.title, body.route, scope),
      ),
    })
  }
  error(400, 'Ação desconhecida.')
}

export const DELETE: RequestHandler = async ({request, url, cookies, locals}) => {
  if (!locals.staff) error(401, 'Inicie sessão para eliminar conteúdo.')
  if (!canManageStaff(locals.staff)) error(403, 'Apenas administradores podem eliminar conteúdo.')
  requireMutationAccess(request, url, cookies)
  const id = url.searchParams.get('id')?.trim()
  if (!id) error(400, 'Identificador em falta.')
  await runMutation(() => deleteSiteEditorDocument(id, siteEditorE2eScope(request.headers)))
  await logStaffActivity({
    staff: locals.staff,
    action: 'site.delete',
    entityType: 'siteDocument',
    entityId: id,
  })
  return json({ok: true})
}
