import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {destroySession, sessionCookieName} from '$lib/server/auth'
import {getStats, listSubmissions} from '$lib/server/crm-admin'
import {getPainelOrderStats} from '$lib/server/orders'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

export const load: PageServerLoad = async () => {
  const [stats, orderStats, recent] = await Promise.all([
    getStats(),
    getPainelOrderStats(),
    listSubmissions('all', 8),
  ])
  return {stats: {...stats, ...orderStats}, recent}
}

export const actions: Actions = {
  logout: async ({cookies, request, url}) => {
    const data = await request.formData()
    const csrfToken = String(data.get('csrfToken') ?? '')

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.'})
    }

    await destroySession(cookies.get(sessionCookieName))
    cookies.delete(sessionCookieName, {path: '/painel'})
    redirect(303, '/painel/login')
  },
}
