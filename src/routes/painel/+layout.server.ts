import {issueCsrfToken} from '$lib/server/form-guard'
import type {LayoutServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_csrf'

export const load: LayoutServerLoad = async ({cookies, locals, url}) => {
  return {
    staff: locals.staff,
    painelCsrfToken: locals.staff
      ? issueCsrfToken(cookies, csrfCookieName, '/painel', url.protocol === 'https:')
      : '',
  }
}
