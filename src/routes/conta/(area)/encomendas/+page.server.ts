import {listOrdersForCustomer} from '$lib/server/orders'
import type {PageServerLoad} from './$types'

// Guard + CSRF live in the shared (area) layout; await parent() ensures the
// guard runs before this touches locals.customer.
export const load: PageServerLoad = async ({locals, parent}) => {
  await parent()
  return {
    orders: await listOrdersForCustomer(locals.customer!.id),
  }
}
