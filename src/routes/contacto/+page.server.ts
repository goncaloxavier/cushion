import {fail} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {
  cleanMessage,
  cleanSingleLine,
  normalizeEmail,
  normalizePhone,
  storeContactSubmission,
  validateSubmission,
  type SubmissionSource,
} from '$lib/server/crm'
import {getLanguage, type LanguageCode} from '$lib/site-content'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_contact_csrf'

const messages: Record<LanguageCode, Record<string, string>> = {
  pt: {
    invalid: 'Preencha todos os campos obrigatórios antes de enviar.',
    csrf: 'Não foi possível validar o formulário. Atualize a página e tente novamente.',
    origin: 'Não foi possível validar a origem do pedido.',
    success: 'Pedido recebido. Entraremos em contacto consigo assim que possível.',
  },
  en: {
    invalid: 'Fill in all required fields before sending.',
    csrf: 'We could not validate the form. Refresh the page and try again.',
    origin: 'We could not validate the request origin.',
    success: 'Request received. We will contact you as soon as possible.',
  },
  es: {
    invalid: 'Rellena todos los campos obligatorios antes de enviar.',
    csrf: 'No se pudo validar el formulario. Actualiza la página e inténtalo de nuevo.',
    origin: 'No se pudo validar el origen de la solicitud.',
    success: 'Solicitud recibida. Nos pondremos en contacto contigo lo antes posible.',
  },
}

const sourceMap: Record<string, SubmissionSource> = {
  contacto: 'contact',
  contact: 'contact',
  catalogo: 'catalogue',
  catalogue: 'catalogue',
  catálogo: 'catalogue',
  produto: 'product',
  product: 'product',
  loja: 'store',
  store: 'store',
  tienda: 'store',
  caso: 'case',
  case: 'case',
  blog: 'blog',
}

const sourceFromValue = (value: FormDataEntryValue | string | null): SubmissionSource => {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return sourceMap[normalized] || 'contact'
}

const formValuesFromData = (data: FormData) => {
  const firstName = cleanSingleLine(data.get('firstName'), 80)
  const lastName = cleanSingleLine(data.get('lastName'), 80)

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim(),
    email: normalizeEmail(cleanSingleLine(data.get('email'), 254)),
    phone: cleanSingleLine(data.get('phone'), 40),
    address: cleanSingleLine(data.get('address'), 200),
    postalCode: cleanSingleLine(data.get('postalCode'), 32),
    locality: cleanSingleLine(data.get('locality'), 120),
    message: cleanMessage(data.get('message'), 3000),
  }
}

export const load: PageServerLoad = async ({cookies, url}) => {
  return {
    csrfToken: issueCsrfToken(cookies, csrfCookieName, '/contacto', url.protocol === 'https:'),
    submissionSource: sourceFromValue(url.searchParams.get('source')),
  }
}

export const actions: Actions = {
  default: async ({cookies, getClientAddress, request, url}) => {
    const data = await request.formData()
    const language = getLanguage(cleanSingleLine(data.get('language'), 8))
    const values = formValuesFromData(data)
    const marketingConsent = data.get('marketingConsent') === 'on'
    const privacyConsent = data.get('privacyConsent') === 'on'
    const source = sourceFromValue(data.get('source'))
    const honeypot = cleanSingleLine(data.get('companyWebsite'), 240)
    const csrfToken = cleanSingleLine(data.get('csrfToken'), 128)
    const cookieToken = cookies.get(csrfCookieName)

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: messages[language].origin, values})
    }

    if (!csrfOk(cookieToken, csrfToken)) {
      return fail(403, {message: messages[language].csrf, values})
    }

    if (honeypot) {
      return {success: true, message: messages[language].success}
    }

    const submission = {
      ...values,
      phone: normalizePhone(values.phone),
      marketingConsent,
      privacyConsent,
      consentText: cleanMessage(data.get('consentText'), 1000),
      language,
      source,
      sourcePath: url.pathname,
      ipAddress: getClientAddress(),
      userAgent: cleanSingleLine(request.headers.get('user-agent'), 300),
    }

    const errors = validateSubmission(submission)
    if (errors.length > 0) {
      return fail(400, {message: messages[language].invalid, values, errors})
    }

    const result = await storeContactSubmission(submission)
    if (!result.ok) {
      return fail(result.status, {message: result.message, values})
    }

    return {success: true, message: messages[language].success}
  },
}
