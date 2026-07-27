import {fail} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {
  listPrivacyRequests,
  updatePrivacyRequest,
  type PrivacyRequestStatus,
} from '$lib/server/privacy'
import {logStaffActivity} from '$lib/server/staff-activity'
import type {Actions, PageServerLoad} from './$types'

const allowedStatuses = new Set<PrivacyRequestStatus>([
  'new',
  'in_progress',
  'completed',
  'rejected',
])

export const load: PageServerLoad = async ({url}) => {
  const status = url.searchParams.get('status') ?? ''
  return {rows: await listPrivacyRequests(status), status}
}

export const actions: Actions = {
  update: async ({cookies, locals, request, url}) => {
    if (!locals.staff) return fail(401, {message: 'Inicie sessão para continuar.'})
    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }

    const data = await request.formData()
    if (!csrfOk(cookies.get('df4y_painel_csrf'), String(data.get('csrfToken') ?? ''))) {
      return fail(403, {message: 'Atualize a página e tente novamente.'})
    }

    const id = String(data.get('id') ?? '')
    const status = String(data.get('status') ?? '') as PrivacyRequestStatus
    const internalNote = String(data.get('internalNote') ?? '')
    if (!id || !allowedStatuses.has(status)) {
      return fail(400, {message: 'Dados inválidos.'})
    }

    const updated = await updatePrivacyRequest({
      id,
      status,
      internalNote,
      staffId: locals.staff.id,
    })
    if (!updated) return fail(404, {message: 'Pedido não encontrado.'})

    await logStaffActivity({
      staff: locals.staff,
      action: 'privacy_request_updated',
      entityType: 'privacy_request',
      entityId: updated.id,
      entityLabel: updated.customerEmail,
      detail: status,
    })
    return {success: true}
  },
}
