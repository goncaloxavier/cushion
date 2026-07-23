import {error, fail} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {canManageStaff} from '$lib/server/staff-auth'
import {
  checkDeeplKey,
  clearDeeplApiKeyOverride,
  getDeeplKeyStatus,
  getDeeplUsage,
  setDeeplApiKeyOverride,
} from '$lib/server/deepl-settings'
import {logStaffActivity} from '$lib/server/staff-activity'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

export const load: PageServerLoad = async ({locals}) => {
  if (!canManageStaff(locals.staff)) error(403, 'Acesso restrito a administradores.')
  const [status, usage] = await Promise.all([getDeeplKeyStatus(), getDeeplUsage()])
  return {status, usage}
}

export const actions: Actions = {
  saveKey: async ({cookies, locals, request, url}) => {
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

    const key = String(data.get('key') ?? '').trim()
    if (!key) return fail(400, {message: 'Cole a nova chave da API do DeepL.'})

    const checked = await checkDeeplKey(key)
    if (!checked.ok) {
      return fail(400, {
        message: `Não foi possível validar a chave junto do DeepL: ${checked.error}`,
      })
    }

    await setDeeplApiKeyOverride(key, locals.staff.username)
    await logStaffActivity({
      staff: locals.staff,
      action: 'settings.deepl_key',
      entityType: 'settings',
      entityLabel: 'Chave DeepL',
    })
    return {ok: true, saved: true}
  },

  clearKey: async ({cookies, locals, request, url}) => {
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

    await clearDeeplApiKeyOverride()
    await logStaffActivity({
      staff: locals.staff,
      action: 'settings.deepl_key_clear',
      entityType: 'settings',
      entityLabel: 'Chave DeepL',
    })
    return {ok: true, cleared: true}
  },
}
