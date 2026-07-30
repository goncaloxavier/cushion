import {fail} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {
  createPrivacyRequest,
  listCustomerPrivacyRequests,
  type PrivacyRequestType,
} from '$lib/server/privacy'
import {
  contactsRecipient,
  logEmailFailure,
  sendTransactionalEmail,
} from '$lib/server/email'
import type {Actions, PageServerLoad} from './$types'

const allowedTypes = new Set<PrivacyRequestType>([
  'access',
  'portability',
  'erasure',
  'restriction',
  'marketing_withdrawal',
])

export const load: PageServerLoad = async ({locals, parent}) => {
  await parent()
  return {
    requests: await listCustomerPrivacyRequests(locals.customer!.id),
  }
}

export const actions: Actions = {
  request: async ({cookies, locals, request, url}) => {
    if (!locals.customer) return fail(401, {message: 'Inicie sessão para continuar.'})
    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }

    const data = await request.formData()
    const csrfToken = String(data.get('csrfToken') ?? '')
    if (!csrfOk(cookies.get('df4y_customer_account_csrf'), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.'})
    }

    const requestType = String(data.get('requestType') ?? '') as PrivacyRequestType
    if (!allowedTypes.has(requestType)) {
      return fail(400, {message: 'Escolha um pedido válido.'})
    }

    const note = String(data.get('note') ?? '')
      .normalize('NFC')
      .replace(/[\u0000-\u0008\u000b\f\u000e-\u001f\u007f]/g, '')
      .trim()
      .slice(0, 1000)
    const privacyRequest = await createPrivacyRequest(locals.customer, requestType, note)
    const recipient = contactsRecipient()
    if (recipient && privacyRequest.status !== 'completed') {
      const result = await sendTransactionalEmail({
        to: recipient,
        subject: `Novo pedido de privacidade · ${locals.customer.email}`,
        text: [
          `Email: ${locals.customer.email}`,
          `Tipo: ${requestType}`,
          `Pedido: ${privacyRequest.id}`,
          note ? `Nota: ${note}` : '',
          '',
          // This email is the whole handover now: the staff queue it used to
          // point at is gone, because it listed an event that happens roughly
          // never and cost a permanent entry in a sidebar José reads every day.
          'Responda diretamente ao cliente. O prazo legal de resposta é de um mês.',
        ]
          .filter(Boolean)
          .join('\n'),
      }).catch((error) => ({
        ok: false as const,
        status: 500,
        error: error instanceof Error ? error.message : 'Unknown email delivery error.',
      }))
      logEmailFailure(`privacy request ${privacyRequest.id}`, result)
    }
    return {success: true, privacyRequest}
  },
}
