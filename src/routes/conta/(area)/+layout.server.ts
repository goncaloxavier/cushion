import {redirect} from '@sveltejs/kit'
import {issueCsrfToken} from '$lib/server/form-guard'
import type {LayoutServerLoad} from './$types'

// Shared guard + CSRF for the whole account area, so the shell (and its data)
// stays mounted while navigating between Dados / Moradas / Encomendas.
export const load: LayoutServerLoad = async ({cookies, locals, url}) => {
  if (!locals.customer) {
    redirect(303, `/conta/entrar?lang=${url.searchParams.get('lang') || 'pt'}`)
  }

  return {
    customer: locals.customer,
    csrfToken: issueCsrfToken(cookies, 'df4y_customer_account_csrf', '/conta', url.protocol === 'https:'),
  }
}
