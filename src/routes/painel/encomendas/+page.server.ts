import {listOrdersForPainel} from '$lib/server/orders'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async () => ({
  orders: await listOrdersForPainel(),
})
