import {error, fail} from '@sveltejs/kit'
import {appendOrderNote, getOrderDetail, setOrderStatus} from '$lib/server/orders'
import {orderStatuses} from '$lib/painel'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

export const load: PageServerLoad = async ({params}) => {
  const order = await getOrderDetail(params.id)
  if (!order) error(404, 'Encomenda não encontrada')
  return {order}
}

export const actions: Actions = {
  setStatus: async ({cookies, locals, params, request, url}) => {
    if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
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
    }
  },
  addNote: async ({cookies, locals, params, request, url}) => {
    if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
    const data = await request.formData()
    const csrfToken = String(data.get('csrfToken') ?? '')
    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.'})
    }
    await appendOrderNote(params.id, String(data.get('note') ?? ''), locals.staff.username)
  },
}
