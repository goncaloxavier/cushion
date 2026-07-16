import {error, fail} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {canManageStaff, createStaff, findStaffByUsername, listStaff} from '$lib/server/staff-auth'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

export const load: PageServerLoad = async ({locals}) => {
  if (!canManageStaff(locals.staff)) error(403, 'Acesso restrito a administradores.')
  return {staff: await listStaff()}
}

export const actions: Actions = {
  create: async ({cookies, locals, request, url}) => {
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

    const name = String(data.get('name') ?? '').trim().slice(0, 160)
    const username = String(data.get('username') ?? '').trim().slice(0, 120)
    const password = String(data.get('password') ?? '')
    const role = data.get('role') === 'admin' ? 'admin' : 'staff'

    if (!name || !username) return fail(400, {message: 'Preencha o nome e o utilizador.'})
    if (password.length < 10) return fail(400, {message: 'A palavra-passe deve ter pelo menos 10 caracteres.'})
    if (await findStaffByUsername(username)) return fail(400, {message: 'Já existe uma conta com esse utilizador.'})

    await createStaff({name, username, password, role})
    return {ok: true}
  },
}
