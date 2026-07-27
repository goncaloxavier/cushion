import {fail} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {
  listOperationalIncidents,
  resolveOperationalIncident,
} from '$lib/server/incidents'
import {logStaffActivity} from '$lib/server/staff-activity'
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async ({url}) => ({
  includeResolved: url.searchParams.get('resolvidos') === '1',
  incidents: await listOperationalIncidents(url.searchParams.get('resolvidos') === '1'),
})

export const actions: Actions = {
  resolve: async ({cookies, locals, request, url}) => {
    if (!locals.staff) return fail(401, {message: 'Inicie sessão para continuar.'})
    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }
    const data = await request.formData()
    if (!csrfOk(cookies.get('df4y_painel_csrf'), String(data.get('csrfToken') ?? ''))) {
      return fail(403, {message: 'Atualize a página e tente novamente.'})
    }
    const id = String(data.get('id') ?? '')
    if (!id || !(await resolveOperationalIncident(id, locals.staff.id))) {
      return fail(404, {message: 'O alerta já foi resolvido ou não existe.'})
    }
    await logStaffActivity({
      staff: locals.staff,
      action: 'incident.resolved',
      entityType: 'operational_incident',
      entityId: id,
    })
    return {success: true}
  },
}
