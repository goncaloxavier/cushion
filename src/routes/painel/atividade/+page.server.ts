import {error} from '@sveltejs/kit'
import {canManageStaff} from '$lib/server/staff-auth'
import {listStaffActivity} from '$lib/server/staff-activity'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({locals}) => {
  if (!canManageStaff(locals.staff)) error(403, 'Acesso restrito a administradores.')
  return {activity: await listStaffActivity({limit: 200})}
}
