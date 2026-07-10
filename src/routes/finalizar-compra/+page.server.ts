import {randomBytes} from 'node:crypto'
import {fail} from '@sveltejs/kit'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {databaseConfigured} from '$lib/server/db'
import {
  buildOrderDraft,
  createOrder,
  listCustomerAddresses,
  OrderInputError,
  sendOrderEmails,
  type CustomerAddressRow,
  type CheckoutCartItem,
} from '$lib/server/orders'
import {isValidEmail} from '$lib/server/customer-auth'
import {rateLimit, rateLimitKey} from '$lib/server/rate-limit'
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
  // Minted fresh on every page load (unlike the CSRF cookie, which is reused
  // across a session) so it can double as a one-time idempotency key for the
  // order this exact form render creates — see createOrder in $lib/server/orders.
  submissionToken: randomBytes(16).toString('base64url'),
  customer: locals.customer,
  addresses: locals.customer ? await listCustomerAddresses(locals.customer.id) : [],
  databaseReady: databaseConfigured(),
})

const selectedAddress = (
  addresses: CustomerAddressRow[],
  addressType: 'billing' | 'delivery',
  addressId: string,
) => {
  if (!addressId || addressId === 'custom') return null
  return addresses.find((address) => address.addressType === addressType && address.id === addressId) ?? null
}

export const actions: Actions = {
  default: async ({cookies, getClientAddress, locals, request, url}) => {
    const form = await request.formData()
    const language = getLanguage(cleanLine(form.get('language'), 8))
    const csrfToken = cleanLine(form.get('csrfToken'), 128)
    const submissionToken = cleanLine(form.get('submissionToken'), 64)
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
      billingAddressId: cleanLine(form.get('billingAddressId'), 80),
      deliveryAddress: cleanLine(form.get('deliveryAddress'), 240),
      deliveryPostalCode: cleanLine(form.get('deliveryPostalCode'), 32),
      deliveryLocality: cleanLine(form.get('deliveryLocality'), 120),
      deliveryAddressId: cleanLine(form.get('deliveryAddressId'), 80),
      customerNotes: cleanText(form.get('customerNotes'), 2000),
      paymentMethod: ((): string => {
        const method = cleanLine(form.get('paymentMethod'), 20)
        return method === 'multibanco' || method === 'card' ? method : 'mbway'
      })(),
    }

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.', values})
    }

    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.', values})
    }

    if (!submissionToken || submissionToken.length < 20) {
      return fail(400, {message: 'Atualize a página antes de finalizar o pedido.', values})
    }

    if (!databaseConfigured()) {
      return fail(503, {
        message: 'Checkout ainda não configurado neste ambiente. Falta DATABASE_URL.',
        values,
      })
    }

    let persistBillingAddress = true
    let persistDeliveryAddress = true
    if (locals.customer) {
      const addresses = await listCustomerAddresses(locals.customer.id)
      const billing = selectedAddress(addresses, 'billing', values.billingAddressId)
      const delivery = selectedAddress(addresses, 'delivery', values.deliveryAddressId)

      if (values.billingAddressId && values.billingAddressId !== 'custom') {
        if (!billing) {
          return fail(400, {message: 'Escolha uma morada de faturação válida.', values})
        }
        values.billingAddress = billing.addressLine1
        values.billingPostalCode = billing.postalCode
        values.billingLocality = billing.locality
        persistBillingAddress = false
      }

      if (values.deliveryAddressId && values.deliveryAddressId !== 'custom') {
        if (!delivery) {
          return fail(400, {message: 'Escolha uma morada de entrega válida.', values})
        }
        values.deliveryAddress = delivery.addressLine1
        values.deliveryPostalCode = delivery.postalCode
        values.deliveryLocality = delivery.locality
        persistDeliveryAddress = false
      }
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
    if (required.some((value) => value.length < 2) || !isValidEmail(values.email)) {
      return fail(400, {message: 'Preencha todos os dados obrigatórios para finalizar o pedido.', values})
    }

    if (values.paymentMethod === 'card') {
      return fail(400, {
        message: 'Pagamento por cartão fica disponível em breve. Escolha MB WAY ou Multibanco.',
        values,
      })
    }

    if (values.paymentMethod === 'mbway' && !/^9\d{8}$/.test(values.phone.replace(/\D/g, '').replace(/^351/, ''))) {
      return fail(400, {
        message: 'Indique um telemóvel português válido (9 dígitos) para pagar com MB WAY.',
        values,
      })
    }

    let cartItems: CheckoutCartItem[]
    try {
      cartItems = parseCartItems(form.get('cartItems'))
    } catch {
      return fail(400, {message: 'Não foi possível ler o carrinho. Atualize a página.', values})
    }

    // Rate-limit only once a submission has passed every shape/field check
    // above — a customer who mistypes an email or misses a field a few times
    // shouldn't burn the same budget as a scripted attempt to spam real orders.
    const ipKey = rateLimitKey('checkout', getClientAddress())
    if (rateLimit(ipKey, 8, 15 * 60 * 1000)) {
      return fail(429, {message: 'Demasiados pedidos. Aguarde alguns minutos antes de tentar novamente.', values})
    }

    const site = contentFromSanity(await getSanityCollections(false))
    const content = site[language]

    try {
      const draft = buildOrderDraft(content, cartItems, values.deliveryPostalCode)
      const {order, isNew} = await createOrder(
        {
          ...values,
          persistBillingAddress,
          persistDeliveryAddress,
          customerId: locals.customer?.id ?? null,
          language,
          submissionToken,
        },
        draft,
      )
      // isNew is false when this exact form render already produced an order
      // (double-click, back-button resubmit) — skip re-sending confirmation
      // email/payment link for a resubmit, the customer already got them.
      if (isNew) {
        await sendOrderEmails(order).catch((error) => {
          console.warn(
            `[checkout] order email dispatch failed for ${order.orderNumber}: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          )
        })
      }

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
      console.error(
        `[checkout] order creation failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
      )
      return fail(500, {
        message: 'Não foi possível criar a encomenda. Tente novamente dentro de instantes.',
        values,
      })
    }
  },
}
