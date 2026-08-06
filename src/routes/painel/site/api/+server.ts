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
import {siteEditorE2eRequestStaff, siteEditorE2eScope} from '$lib/server/site-editor-e2e'
import {
  SiteEditorCategoryInUseError,
  SiteEditorDuplicateError,
  SiteEditorValidationError,
} from '$lib/server/site-editor-errors'
import {logStaffActivity} from '$lib/server/staff-activity'
import {siteDocumentTypeLabel} from '$lib/painel'
import type {RequestHandler} from './$types'

/**
 * A document's own name, for the Entidade column of the activity log. Titles are
 * a localized object on most types and a plain string on sitePage, so both are
 * read here rather than at each call site.
 */
const siteDocumentTitle = (document: {_id: string; title?: unknown; route?: unknown}) => {
  const title = document.title
  if (typeof title === 'string' && title.trim()) return title.trim()
  if (title && typeof title === 'object') {
    const localized = title as Record<string, unknown>
    for (const language of ['pt', 'en', 'es']) {
      const value = localized[language]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  }
  if (typeof document.route === 'string' && document.route.trim()) return document.route.trim()
  return document._id
}

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
    | {
        action: 'create'
        documentType?: string
        title?: string
        route?: string
        sitePageStarter?: string
        storeCategory?: string
      }
  >(request)
  const scope = siteEditorE2eScope(request.headers)

  if (body.action === 'publish') {
    if (!canManageStaff(locals.staff)) error(403, 'Apenas administradores podem publicar.')
    if (!body.document) error(400, 'Conteúdo em falta.')
    const published = await runMutation(() => publishSiteEditorDocument(body.document!, scope))
    if (!siteEditorE2eRequestStaff(request.headers)) {
      await logStaffActivity({
        staff: locals.staff,
        action: 'site.publish',
        entityType: 'siteDocument',
        entityId: body.document._id,
        // The title, not the Sanity type. Entidade used to read
        // "productCategory" here -- the code's word for it, in the one column
        // meant to tell a person which page they touched.
        entityLabel: siteDocumentTitle(body.document),
        detail: siteDocumentTypeLabel(body.document._type),
      })
    }
    return json({document: published})
  }
  if (body.action === 'create') {
    return json({
      document: await runMutation(() =>
        createSiteEditorDocument(
          body.documentType,
          body.title,
          body.route,
          scope,
          body.sitePageStarter,
          body.storeCategory,
        ),
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
  // Read before deleting: afterwards there is nothing left to name it with, and
  // the log used to record the bare identifier.
  const scope = siteEditorE2eScope(request.headers)
  const doomed = await getSiteEditorDocument(id, scope).catch(() => null)
  const deletedLabel = doomed ? siteDocumentTitle(doomed) : undefined
  const deletedType = doomed?._type
  await runMutation(() => deleteSiteEditorDocument(id, scope))
  if (!siteEditorE2eRequestStaff(request.headers)) {
    await logStaffActivity({
      staff: locals.staff,
      action: 'site.delete',
      entityType: 'siteDocument',
      entityId: id,
      entityLabel: deletedLabel ?? id,
      detail: deletedType ? siteDocumentTypeLabel(deletedType) : '',
    })
  }
  return json({ok: true})
}
