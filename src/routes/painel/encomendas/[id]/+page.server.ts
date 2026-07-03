import {error} from '@sveltejs/kit'
import {appendOrderNote, getOrderDetail, setOrderStatus} from '$lib/server/orders'
import {orderStatuses} from '$lib/painel'
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params}) => {
  const order = await getOrderDetail(params.id)
  if (!order) error(404, 'Encomenda não encontrada')
  return {order}
}

export const actions: Actions = {
  setStatus: async ({locals, params, request}) => {
    const data = await request.formData()
    const status = String(data.get('status') ?? '')
    if (orderStatuses.includes(status as (typeof orderStatuses)[number])) {
      await setOrderStatus(params.id, status, locals.staff?.username ?? '')
    }
  },
  addNote: async ({locals, params, request}) => {
    const data = await request.formData()
    await appendOrderNote(params.id, String(data.get('note') ?? ''), locals.staff?.username ?? '')
  },
}
