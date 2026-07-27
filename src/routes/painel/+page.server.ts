import {listSubmissionsByStatus, countSubmissionsByStatus} from '$lib/server/crm-postgres'
import {listOrdersExcludingStatus, countOrdersExcludingStatus} from '$lib/server/orders'
import {canManageStaff} from '$lib/server/staff-auth'
import {listStaffActivity} from '$lib/server/staff-activity'
import {countOpenOperationalIncidents} from '$lib/server/incidents'
import type {PageServerLoad} from './$types'

const openLeadStatuses = ['new', 'inProgress']
const closedOrderStatuses = ['completed', 'cancelled']

export const load: PageServerLoad = async ({locals}) => {
  const isAdmin = canManageStaff(locals.staff)

  const [openLeads, openLeadsCount, activeOrders, activeOrdersCount, activity, incidentCount] = await Promise.all([
    listSubmissionsByStatus(openLeadStatuses, 8),
    countSubmissionsByStatus(openLeadStatuses),
    listOrdersExcludingStatus(closedOrderStatuses, 8),
    countOrdersExcludingStatus(closedOrderStatuses),
    isAdmin ? listStaffActivity({limit: 6}) : Promise.resolve([]),
    countOpenOperationalIncidents(),
  ])

  return {openLeads, openLeadsCount, activeOrders, activeOrdersCount, activity, incidentCount}
}
