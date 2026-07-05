import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {
  createEmailVerificationToken,
  customerRateLimit,
  findCustomerByEmail,
  tokenHashOf,
  updateCustomerProfile,
} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import {appOrigin, deliverVerificationEmail, logEmailFailure} from '$lib/server/email'
import {
  listCustomerDefaultAddresses,
  listOrdersForCustomer,
  saveCustomerDeliveryAddress,
} from '$lib/server/orders'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_customer_account_csrf'

const clean = (value: FormDataEntryValue | null, max = 240) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\p{Cc}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

export const load: PageServerLoad = async ({cookies, locals, url}) => {
  if (!locals.customer) {
    redirect(303, `/conta/entrar?lang=${url.searchParams.get('lang') || 'pt'}`)
  }

  const addresses = await listCustomerDefaultAddresses(locals.customer.id)

  return {
    customer: locals.customer,
    orders: await listOrdersForCustomer(locals.customer.id),
    deliveryAddress: addresses.find((address) => address.addressType === 'delivery') ?? null,
    csrfToken: issueCsrfToken(cookies, csrfCookieName, '/conta', url.protocol === 'https:'),
    emailDelivery: url.searchParams.get('email') === 'failed' ? 'failed' : '',
  }
}

export const actions: Actions = {
  updateProfile: async ({cookies, locals, request, url}) => {
    if (!locals.customer) redirect(303, '/conta/entrar')

    const data = await request.formData()
    const csrfToken = clean(data.get('csrfToken'), 128)
    const firstName = clean(data.get('firstName'), 80)
    const lastName = clean(data.get('lastName'), 80)
    const phone = clean(data.get('phone'), 40)
    const nif = clean(data.get('nif'), 16)
    const purchaseType =
      clean(data.get('purchaseType'), 20) === 'company' ? 'company' : 'individual'
    const addressLine1 = clean(data.get('addressLine1'), 240)
    const postalCode = clean(data.get('postalCode'), 32)
    const locality = clean(data.get('locality'), 120)

    const values = {firstName, lastName, phone, nif, purchaseType, addressLine1, postalCode, locality}

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {profile: 'error', message: 'Não foi possível validar a origem do pedido.', values})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {profile: 'error', message: 'Atualize a página e tente novamente.', values})
    }
    if (!databaseConfigured()) {
      return fail(503, {profile: 'error', message: 'A área de cliente ainda não está configurada.', values})
    }
    if (!firstName || !lastName) {
      return fail(400, {profile: 'error', message: 'Indique o primeiro nome e o apelido.', values})
    }

    const name = `${firstName} ${lastName}`.trim()

    await updateCustomerProfile(locals.customer.id, {name, phone, nif, purchaseType})
    if (addressLine1) {
      await saveCustomerDeliveryAddress(locals.customer.id, {line1: addressLine1, postalCode, locality})
    }

    return {profile: 'saved'}
  },

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
