import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {
  authenticateCustomer,
  createCustomerSession,
  customerRateLimit,
  setCustomerSessionCookie,
  tokenHashOf,
} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import {getLanguage} from '$lib/site-content'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_customer_login_csrf'

const clean = (value: FormDataEntryValue | null, max = 254) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)

export const load: PageServerLoad = async ({cookies, locals, url}) => {
  if (locals.customer) redirect(303, `/conta?lang=${url.searchParams.get('lang') || 'pt'}`)
  return {
    csrfToken: issueCsrfToken(cookies, csrfCookieName, '/conta/entrar', url.protocol === 'https:'),
    databaseReady: databaseConfigured(),
    justVerified: url.searchParams.get('email') === 'verified',
    justReset: url.searchParams.get('password') === 'reset',
  }
}

export const actions: Actions = {
  default: async ({cookies, getClientAddress, request, url}) => {
    const data = await request.formData()
    const language = getLanguage(clean(data.get('language'), 8))
    const email = clean(data.get('email')).toLowerCase()
    const password = clean(data.get('password'), 500)
    const csrfToken = clean(data.get('csrfToken'), 128)

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.', email})
    }

    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.', email})
    }

    if (!databaseConfigured()) {
      return fail(503, {message: 'A área de cliente ainda não está configurada.', email})
    }

    const ipHash = tokenHashOf(`ip:${getClientAddress()}`)
    if (customerRateLimit(`login:${ipHash}`, 10, 10 * 60 * 1000)) {
      return fail(429, {message: 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.', email})
    }

    const customer = await authenticateCustomer(email, password)
    if (!customer) {
      return fail(400, {message: 'Email ou password inválidos.', email})
    }

    const session = await createCustomerSession(customer.id, {
      ipHash,
      userAgent: request.headers.get('user-agent') ?? '',
    })
    setCustomerSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:')
    redirect(303, `/conta?lang=${language}`)
  },
}
