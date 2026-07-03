import {fail} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {createPasswordResetToken, findCustomerByEmail} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import {appOrigin, sendTransactionalEmail} from '$lib/server/email'
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
  default: async ({cookies, request, url}) => {
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

    const customer = await findCustomerByEmail(email)
    if (customer) {
      const token = await createPasswordResetToken(customer.id)
      const origin = appOrigin() || url.origin
      const resetUrl = `${origin}/conta/redefinir-password?token=${encodeURIComponent(token)}`
      await sendTransactionalEmail({
        to: customer.email,
        subject: 'Redefinir password DaFábrica4You',
        text: `Para redefinir a password, abra este link:\n${resetUrl}`,
      }).catch(() => undefined)
    }

    return {
      success: true,
      message: 'Se existir uma conta com este email, enviámos um link para redefinir a password.',
    }
  },
}
