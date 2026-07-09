import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {
  createCustomer,
  createEmailVerificationToken,
  customerRateLimit,
  findCustomerByEmail,
  isValidEmail,
  tokenHashOf,
} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import {appOrigin, deliverVerificationEmail, logEmailFailure} from '$lib/server/email'
import {getLanguage} from '$lib/site-content'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_customer_register_csrf'

const clean = (value: FormDataEntryValue | null, max = 254) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)

export const load: PageServerLoad = async ({cookies, locals, url}) => {
  if (locals.customer) redirect(303, `/conta/dados?lang=${url.searchParams.get('lang') || 'pt'}`)
  return {
    csrfToken: issueCsrfToken(cookies, csrfCookieName, '/conta/registar', url.protocol === 'https:'),
    databaseReady: databaseConfigured(),
  }
}

export const actions: Actions = {
  default: async ({cookies, getClientAddress, request, url}) => {
    const data = await request.formData()
    const language = getLanguage(clean(data.get('language'), 8))
    const firstName = clean(data.get('firstName'), 80)
    const lastName = clean(data.get('lastName'), 80)
    const email = clean(data.get('email')).toLowerCase()
    const phoneCountry = clean(data.get('phoneCountry'), 12)
    const phoneNumber = clean(data.get('phone'), 40)
    const nif = clean(data.get('nif'), 16)
    const password = clean(data.get('password'), 500)
    const passwordConfirm = clean(data.get('passwordConfirm'), 500)
    const csrfToken = clean(data.get('csrfToken'), 128)

    const name = `${firstName} ${lastName}`.trim()
    const phone = phoneNumber ? `${phoneCountry}${phoneNumber}` : ''
    const values = {firstName, lastName, email, phone: phoneNumber, phoneCountry, nif}

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.', values})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.', values})
    }
    if (!databaseConfigured()) {
      return fail(503, {message: 'A área de cliente ainda não está configurada.', values})
    }

    const ipHash = tokenHashOf(`ip:${getClientAddress()}`)
    if (customerRateLimit(`register:${ipHash}`, 4, 30 * 60 * 1000)) {
      return fail(429, {message: 'Demasiados registos. Tente novamente mais tarde.', values})
    }

    if (!firstName || !lastName || !isValidEmail(email) || password.length < 10) {
      return fail(400, {
        message: 'Preencha nome, apelido, email válido e uma password com pelo menos 10 caracteres.',
        values,
      })
    }

    if (password !== passwordConfirm) {
      return fail(400, {message: 'As passwords não coincidem.', values})
    }

    if (await findCustomerByEmail(email)) {
      return fail(400, {message: 'Já existe uma conta com este email.', values})
    }

    let customer
    try {
      customer = await createCustomer({email, password, name, phone, nif})
    } catch (error) {
      // The pre-flight lookup above keeps the normal message friendly, while
      // this closes the small concurrent-registration race at the database.
      if ((error as {code?: string}).code === '23505') {
        return fail(400, {message: 'Já existe uma conta com este email.', values})
      }
      console.error(
        `[customer registration] failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return fail(503, {
        message: 'Não foi possível criar a conta neste momento. Tente novamente dentro de instantes.',
        values,
      })
    }
    const token = await createEmailVerificationToken(customer.id)
    const origin = appOrigin() || url.origin
    const verifyUrl = `${origin}/conta/verificar-email?token=${encodeURIComponent(token)}&lang=${language}`
    const emailResult = await deliverVerificationEmail(customer.email, verifyUrl).catch((error) => ({
      ok: false as const,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown email delivery error.',
    }))
    logEmailFailure('customer verification email', emailResult)

    redirect(303, `/conta/entrar?lang=${language}&registered=${emailResult.ok ? 'sent' : 'failed'}`)
  },
}
