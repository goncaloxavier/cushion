import {fail} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {
  createPasswordResetToken,
  customerRateLimit,
  findCustomerByEmail,
  tokenHashOf,
} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import {appOrigin, logEmailFailure, sendTransactionalEmail} from '$lib/server/email'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_customer_recover_csrf'

const clean = (value: FormDataEntryValue | null, max = 254) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)

export const load: PageServerLoad = async ({cookies, url}) => ({
  csrfToken: issueCsrfToken(cookies, csrfCookieName, '/conta/recuperar-password', url.protocol === 'https:'),
  databaseReady: databaseConfigured(),
})

export const actions: Actions = {
  default: async ({cookies, getClientAddress, request, url}) => {
    const data = await request.formData()
    const email = clean(data.get('email')).toLowerCase()
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
    const emailHash = tokenHashOf(`email:${email}`)
    if (
      customerRateLimit(`recover-ip:${ipHash}`, 8, 15 * 60 * 1000) ||
      customerRateLimit(`recover-email:${emailHash}`, 3, 30 * 60 * 1000)
    ) {
      return fail(429, {message: 'Aguarde alguns minutos antes de pedir um novo link.', email})
    }

    const customer = await findCustomerByEmail(email)
    if (customer) {
      const token = await createPasswordResetToken(customer.id)
      const origin = appOrigin() || url.origin
      const resetUrl = `${origin}/conta/redefinir-password?token=${encodeURIComponent(token)}`
      const emailResult = await sendTransactionalEmail({
        to: customer.email,
        subject: 'Redefinir password DaFábrica4You',
        text: `Para redefinir a password, abra este link:\n${resetUrl}`,
      }).catch((error) => ({
        ok: false as const,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown email delivery error.',
      }))
      logEmailFailure('customer password reset email', emailResult)
    }

    return {
      success: true,
      message: 'Se existir uma conta com este email, enviámos um link para redefinir a password.',
    }
  },
}
