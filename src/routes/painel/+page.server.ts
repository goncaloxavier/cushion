import {listSubmissions} from '$lib/server/crm-postgres'
import {listOrdersForPainel} from '$lib/server/orders'
import {canManageStaff} from '$lib/server/staff-auth'
import {listStaffActivity} from '$lib/server/staff-activity'
import type {PageServerLoad} from './$types'

const openLeadStatuses = new Set(['new', 'inProgress'])
const closedOrderStatuses = new Set(['completed', 'cancelled'])

export const load: PageServerLoad = async ({locals}) => {
  const [submissions, orders] = await Promise.all([listSubmissions('all'), listOrdersForPainel()])

  const openLeads = submissions.filter((s) => openLeadStatuses.has(s.status))
  const activeOrders = orders.filter((o) => !closedOrderStatuses.has(o.status))

  return {
    openLeads: openLeads.slice(0, 8),
    openLeadsCount: openLeads.length,
    activeOrders: activeOrders.slice(0, 8),
    activeOrdersCount: activeOrders.length,
    activity: canManageStaff(locals.staff) ? await listStaffActivity({limit: 6}) : [],
  }
}
