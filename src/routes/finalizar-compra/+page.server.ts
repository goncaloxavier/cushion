import {fail} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {databaseConfigured} from '$lib/server/db'
import {
  buildOrderDraft,
  createOrder,
  listCustomerDefaultAddresses,
  OrderInputError,
  sendOrderEmails,
  type CheckoutCartItem,
} from '$lib/server/orders'
import {contentFromSanity, getLanguage, type StoreFinish} from '$lib/site-content'
import {getSanityCollections} from '$lib/sanity'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_checkout_csrf'

const cleanLine = (value: FormDataEntryValue | null, max = 240) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const cleanText = (value: FormDataEntryValue | null, max = 2000) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\f\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)

const parseCartItems = (value: FormDataEntryValue | null): CheckoutCartItem[] => {
  const parsed = JSON.parse(String(value ?? '[]')) as unknown
  if (!Array.isArray(parsed)) return []

  return parsed.map((item) => {
    const raw = item as Record<string, unknown>
    return {
      slug: String(raw.slug ?? '').slice(0, 120),
      variantIndex: Math.max(0, Math.floor(Number(raw.variantIndex ?? 0))),
      finish: (raw.finish === 'dark' ? 'dark' : 'natural') as StoreFinish,
      quantity: Math.min(99, Math.max(1, Math.floor(Number(raw.quantity ?? 1)))),
    }
  })
}

export const load: PageServerLoad = async ({cookies, locals, url}) => ({
  csrfToken: issueCsrfToken(cookies, csrfCookieName, '/finalizar-compra', url.protocol === 'https:'),
  customer: locals.customer,
  addresses: locals.customer ? await listCustomerDefaultAddresses(locals.customer.id) : [],
  databaseReady: databaseConfigured(),
})

export const actions: Actions = {
  default: async ({cookies, locals, request, url}) => {
    const form = await request.formData()
    const language = getLanguage(cleanLine(form.get('language'), 8))
    const csrfToken = cleanLine(form.get('csrfToken'), 128)
    const values = {
      name: cleanLine(form.get('name'), 160),
      email: cleanLine(form.get('email'), 254).toLowerCase(),
      phone: cleanLine(form.get('phone'), 40),
      nif: cleanLine(form.get('nif'), 16),
      purchaseType: (cleanLine(form.get('purchaseType'), 20) === 'company'
        ? 'company'
        : 'individual') as 'individual' | 'company',
      billingAddress: cleanLine(form.get('billingAddress'), 240),
      billingPostalCode: cleanLine(form.get('billingPostalCode'), 32),
      billingLocality: cleanLine(form.get('billingLocality'), 120),
      deliveryAddress: cleanLine(form.get('deliveryAddress'), 240),
      deliveryPostalCode: cleanLine(form.get('deliveryPostalCode'), 32),
      deliveryLocality: cleanLine(form.get('deliveryLocality'), 120),
      customerNotes: cleanText(form.get('customerNotes'), 2000),
    }

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.', values})
    }

    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.', values})
    }

    if (!databaseConfigured()) {
      return fail(503, {
        message: 'Checkout ainda não configurado neste ambiente. Falta DATABASE_URL.',
        values,
      })
    }

    const required = [
      values.name,
      values.email,
      values.phone,
      values.billingAddress,
      values.billingPostalCode,
      values.billingLocality,
      values.deliveryAddress,
      values.deliveryPostalCode,
      values.deliveryLocality,
    ]
    if (required.some((value) => value.length < 2) || !values.email.includes('@')) {
      return fail(400, {message: 'Preencha todos os dados obrigatórios para finalizar o pedido.', values})
    }

    let cartItems: CheckoutCartItem[]
    try {
      cartItems = parseCartItems(form.get('cartItems'))
    } catch {
      return fail(400, {message: 'Não foi possível ler o carrinho. Atualize a página.', values})
    }

    const site = contentFromSanity(await getSanityCollections(false))
    const content = site[language]

    try {
      const draft = buildOrderDraft(content, cartItems, values.deliveryPostalCode)
      const order = await createOrder(
        {
          ...values,
          customerId: locals.customer?.id ?? null,
          language,
        },
        draft,
      )
      await sendOrderEmails(order).catch(() => undefined)

      return {
        success: true,
        orderNumber: order.orderNumber,
        totalGross: order.totalGross,
        message:
          'Pedido recebido. A equipa vai confirmar a encomenda e enviar o link de pagamento.',
      }
    } catch (error) {
      if (error instanceof OrderInputError) {
        return fail(error.status, {message: error.message, values})
      }
      return fail(500, {
        message: 'Não foi possível criar a encomenda. Tente novamente dentro de instantes.',
        values,
      })
    }
  },
}
