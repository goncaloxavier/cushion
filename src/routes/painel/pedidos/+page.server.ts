import {fail, redirect} from '@sveltejs/kit'
import {listSubmissions} from '$lib/server/crm-postgres'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {clearStaffSessionCookie, destroySession, sessionCookieName} from '$lib/server/staff-auth'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

const isFilter = (value: string): value is 'all' | 'catalogue' | 'contact' =>
  value === 'catalogue' || value === 'contact' || value === 'all'

export const load: PageServerLoad = async ({url}) => {
  const requested = url.searchParams.get('source') ?? 'all'
  const filter = isFilter(requested) ? requested : 'all'
  return {rows: await listSubmissions(filter), filter}
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
    clearStaffSessionCookie(cookies, url.protocol === 'https:')
    redirect(303, '/painel/login')
  },
}
