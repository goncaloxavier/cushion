import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {
  clearCustomerSessionCookie,
  customerSessionCookieName,
  destroyCustomerSession,
} from '$lib/server/customer-auth'
import type {Actions} from './$types'

const csrfCookieName = 'df4y_customer_account_csrf'

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

    await destroyCustomerSession(cookies.get(customerSessionCookieName))
    clearCustomerSessionCookie(cookies, url.protocol === 'https:')
    redirect(303, '/')
  },
}
