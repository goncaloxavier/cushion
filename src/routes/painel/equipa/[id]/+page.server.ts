import {error, fail} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {
  canManageStaff,
  getStaff,
  resetStaffPassword,
  setStaffActive,
  updateStaffRole,
  type StaffMutationError,
} from '$lib/server/staff-auth'
import {logStaffActivity} from '$lib/server/staff-activity'
import {roleLabels} from '$lib/painel'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

const mutationMessages: Record<StaffMutationError, string> = {
  self: 'Não pode alterar a sua própria função ou estado por aqui.',
  'last-admin': 'Não é possível remover o último administrador ativo.',
}

export const load: PageServerLoad = async ({locals, params}) => {
  if (!canManageStaff(locals.staff)) error(403, 'Acesso restrito a administradores.')
  const member = await getStaff(params.id)
  if (!member) error(404, 'Conta não encontrada')
  return {member}
}

export const actions: Actions = {
  updateRole: async ({cookies, locals, params, request, url}) => {
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

    const role = data.get('role') === 'admin' ? 'admin' : 'staff'
    const member = await getStaff(params.id)
    const result = await updateStaffRole(locals.staff.id, params.id, role)
    if (!result.ok) return fail(400, {message: mutationMessages[result.error]})
    await logStaffActivity({
      staff: locals.staff,
      action: 'staff.role',
      entityType: 'staff',
      entityId: params.id,
      entityLabel: member ? `${member.name} (@${member.username})` : params.id,
      detail: roleLabels[role],
    })
    return {ok: true}
  },

  setActive: async ({cookies, locals, params, request, url}) => {
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

    const active = data.get('active') === 'true'
    const member = await getStaff(params.id)
    const result = await setStaffActive(locals.staff.id, params.id, active)
    if (!result.ok) return fail(400, {message: mutationMessages[result.error]})
    await logStaffActivity({
      staff: locals.staff,
      action: 'staff.active',
      entityType: 'staff',
      entityId: params.id,
      entityLabel: member ? `${member.name} (@${member.username})` : params.id,
      detail: active ? 'Reativada' : 'Desativada',
    })
    return {ok: true}
  },

  resetPassword: async ({cookies, locals, params, request, url}) => {
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

    const password = String(data.get('password') ?? '')
    if (password.length < 10) return fail(400, {message: 'A palavra-passe deve ter pelo menos 10 caracteres.'})

    const member = await getStaff(params.id)
    await resetStaffPassword(params.id, password)
    await logStaffActivity({
      staff: locals.staff,
      action: 'staff.password',
      entityType: 'staff',
      // Never the password, obviously — only that one was set, so the Detalhe
      // column is not blank for the single most security-relevant row here.
      detail: 'Palavra-passe redefinida',
      entityId: params.id,
      entityLabel: member ? `${member.name} (@${member.username})` : params.id,
    })
    return {ok: true, reset: true}
  },
}
