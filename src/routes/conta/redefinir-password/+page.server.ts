import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {customerRateLimit, resetCustomerPasswordWithToken, tokenHashOf} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_customer_reset_csrf'

const clean = (value: FormDataEntryValue | null, max = 500) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)

export const load: PageServerLoad = async ({cookies, url}) => ({
  token: clean(url.searchParams.get('token'), 160),
  csrfToken: issueCsrfToken(cookies, csrfCookieName, '/conta/redefinir-password', url.protocol === 'https:'),
  databaseReady: databaseConfigured(),
})

export const actions: Actions = {
  default: async ({cookies, getClientAddress, request, url}) => {
    const data = await request.formData()
    const token = clean(data.get('token'), 160)
    const password = clean(data.get('password'))
    const csrfToken = clean(data.get('csrfToken'), 128)

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.', token})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.', token})
    }
    if (!databaseConfigured()) {
      return fail(503, {message: 'A área de cliente ainda não está configurada.', token})
    }
    if (!token || password.length < 10) {
      return fail(400, {message: 'Use uma password com pelo menos 10 caracteres.', token})
    }

    const ipHash = tokenHashOf(`ip:${getClientAddress()}`)
    if (customerRateLimit(`reset-ip:${ipHash}`, 8, 15 * 60 * 1000)) {
      return fail(429, {message: 'Demasiadas tentativas. Aguarde alguns minutos.', token})
    }

    const ok = await resetCustomerPasswordWithToken(token, password)
    if (!ok) return fail(400, {message: 'O link expirou ou é inválido.', token})

    redirect(303, '/conta/entrar?password=reset')
  },
}
