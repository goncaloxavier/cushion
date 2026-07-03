import {redirect} from '@sveltejs/kit'
import {
  clearCustomerSessionCookie,
  customerSessionCookieName,
  destroyCustomerSession,
} from '$lib/server/customer-auth'
import type {Actions} from './$types'

export const actions: Actions = {
  logout: async ({cookies, url}) => {
    await destroyCustomerSession(cookies.get(customerSessionCookieName))
    clearCustomerSessionCookie(cookies, url.protocol === 'https:')
    redirect(303, '/')
  },
}
