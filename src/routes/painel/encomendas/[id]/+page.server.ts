import {error, fail} from '@sveltejs/kit'
import {appendOrderNote, getOrderDetail, setOrderStatus} from '$lib/server/orders'
import {canManageStaff} from '$lib/server/staff-auth'
import {orderStatusLabels, orderStatuses} from '$lib/painel'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {logStaffActivity} from '$lib/server/staff-activity'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

export const load: PageServerLoad = async ({locals, params}) => {
  if (!locals.staff) error(401, 'Sessão expirada.')
  const order = await getOrderDetail(params.id)
  if (!order) error(404, 'Encomenda não encontrada')
  return {order}
}

export const actions: Actions = {
  setStatus: async ({cookies, locals, params, request, url}) => {
    if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
    if (!canManageStaff(locals.staff)) return fail(403, {message: 'A sua conta só tem acesso de consulta.'})
    const data = await request.formData()
    const csrfToken = String(data.get('csrfToken') ?? '')
    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.'})
    }
    const status = String(data.get('status') ?? '')
    if (orderStatuses.includes(status as (typeof orderStatuses)[number])) {
      await setOrderStatus(params.id, status, locals.staff.username)
      // Entidade names what was acted on; Detalhe says what changed. This put
      // the new status in Entidade and left Detalhe empty, so the activity log
      // read "Alterou o estado da encomenda / Pago / -" with nothing anywhere
      // to say which encomenda.
      const order = await getOrderDetail(params.id)
      await logStaffActivity({
        staff: locals.staff,
        action: 'order.status',
        entityType: 'order',
        entityId: params.id,
        entityLabel: order ? `Encomenda ${order.orderNumber}` : params.id,
        detail: orderStatusLabels[status as (typeof orderStatuses)[number]] ?? status,
      })
    }
  },
  addNote: async ({cookies, locals, params, request, url}) => {
    if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
    if (!canManageStaff(locals.staff)) return fail(403, {message: 'A sua conta só tem acesso de consulta.'})
    const data = await request.formData()
    const csrfToken = String(data.get('csrfToken') ?? '')
    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.'})
    }
    const note = String(data.get('note') ?? '')
    if (note.trim()) {
      await appendOrderNote(params.id, note, locals.staff.username)
      const order = await getOrderDetail(params.id)
      await logStaffActivity({
        staff: locals.staff,
        action: 'order.note',
        entityType: 'order',
        entityId: params.id,
        entityLabel: order ? `Encomenda ${order.orderNumber}` : params.id,
        detail: note.slice(0, 200),
      })
    }
  },
}
