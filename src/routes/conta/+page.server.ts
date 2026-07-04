import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {
  createEmailVerificationToken,
  customerRateLimit,
  findCustomerByEmail,
  tokenHashOf,
} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import {appOrigin, deliverVerificationEmail, logEmailFailure} from '$lib/server/email'
import {listOrdersForCustomer} from '$lib/server/orders'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_customer_account_csrf'

export const load: PageServerLoad = async ({cookies, locals, url}) => {
  if (!locals.customer) {
    redirect(303, `/conta/entrar?lang=${url.searchParams.get('lang') || 'pt'}`)
  }

  return {
    customer: locals.customer,
    orders: await listOrdersForCustomer(locals.customer.id),
    csrfToken: issueCsrfToken(cookies, csrfCookieName, '/conta', url.protocol === 'https:'),
    emailDelivery: url.searchParams.get('email') === 'failed' ? 'failed' : '',
  }
}

export const actions: Actions = {
  resendVerification: async ({cookies, getClientAddress, locals, request, url}) => {
    if (!locals.customer) redirect(303, '/conta/entrar')

    const data = await request.formData()
    const csrfToken = String(data.get('csrfToken') ?? '')

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {resend: 'error', message: 'Não foi possível validar a origem do pedido.'})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {resend: 'error', message: 'Atualize a página e tente novamente.'})
    }
    if (locals.customer.emailVerifiedAt) {
      return {resend: 'already'}
    }

    const ipHash = tokenHashOf(`ip:${getClientAddress()}`)
    if (customerRateLimit(`resend:${locals.customer.id}`, 3, 15 * 60 * 1000) || customerRateLimit(`resend-ip:${ipHash}`, 8, 15 * 60 * 1000)) {
      return fail(429, {resend: 'error', message: 'Já enviámos vários emails. Aguarde alguns minutos.'})
    }

    if (!databaseConfigured()) {
      return fail(503, {resend: 'error', message: 'A área de cliente ainda não está configurada.'})
    }

    // Re-read to avoid acting on a stale session snapshot.
    const row = await findCustomerByEmail(locals.customer.email)
    if (!row || row.email_verified_at) {
      return {resend: 'already'}
    }

    const token = await createEmailVerificationToken(row.id)
    const origin = appOrigin() || url.origin
    const verifyUrl = `${origin}/conta/verificar-email?token=${encodeURIComponent(token)}&lang=${url.searchParams.get('lang') || 'pt'}`
    const emailResult = await deliverVerificationEmail(row.email, verifyUrl).catch((error) => ({
      ok: false as const,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown email delivery error.',
    }))
    logEmailFailure('customer verification resend', emailResult)
    if (!emailResult.ok) {
      return fail(502, {
        resend: 'error',
        message: 'Não foi possível enviar o email agora. Confirme a configuração de email e tente novamente.',
      })
    }

    return {resend: 'sent'}
  },
}
