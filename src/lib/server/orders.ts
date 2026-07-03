import {randomBytes} from 'node:crypto'
import {databaseConfigured, query, withTransaction} from './db'
import {
  calculateStoreEstimate,
  isSupportedStorePostalCode,
  normalizePostalCode,
  storeTransportMultiplier,
} from '$lib/store-shipping'
import type {
  LanguageCode,
  SiteContent,
  StoreFinish,
  StoreProduct,
  StoreProductVariant,
} from '$lib/site-content'
import {prepareIfthenpayPayByLink} from './payment'
import {ordersRecipient, sendTransactionalEmail, type EmailSendResult} from './email'

export type CheckoutCartItem = {
  slug: string
  variantIndex: number
  finish: StoreFinish
  quantity: number
}

export type CheckoutCustomerInput = {
  customerId?: string | null
  name: string
  email: string
  phone: string
  nif: string
  purchaseType: 'individual' | 'company'
  billingAddress: string
  billingPostalCode: string
  billingLocality: string
  deliveryAddress: string
  deliveryPostalCode: string
  deliveryLocality: string
  customerNotes: string
  language: LanguageCode
}

export type OrderDraftItem = {
  product: StoreProduct
  variant: StoreProductVariant
  variantIndex: number
  finish: StoreFinish
  finishLabel: string
  quantity: number
  unitPriceNet: number
  lineTotalNet: number
  unitWeightKg: number
  lineWeightKg: number
}

export type OrderDraft = {
  items: OrderDraftItem[]
  productNet: number
  transportNet: number
  vat: number
  totalGross: number
  totalWeightKg: number
  deliveryZone: string
  transportMultiplier: number
}

export type OrderRow = {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentProvider: string
  paymentUrl: string | null
  paymentReference: string | null
  language: string
  customerName: string
  email: string
  phone: string
  nif: string
  purchaseType: string
  billingAddress: string
  billingPostalCode: string
  billingLocality: string
  deliveryAddress: string
  deliveryPostalCode: string
  deliveryLocality: string
  deliveryZone: string
  customerNotes: string
  internalNotes: string
  productNet: number
  transportNet: number
  vat: number
  totalGross: number
  totalWeightKg: number
  transportMultiplier: number
  createdAt: string
  updatedAt: string
}

export type OrderItemRow = {
  id: string
  productSlug: string
  productTitle: string
  variantIndex: number
  variantLabel: string
  variantDimensions: string[]
  finish: string
  finishLabel: string
  quantity: number
  unitPriceNet: number
  lineTotalNet: number
  unitWeightKg: number
  lineWeightKg: number
}

export type OrderStatusEventRow = {
  id: string
  status: string
  note: string
  actorType: string
  actorLabel: string
  createdAt: string
}

export type CustomerAddressRow = {
  id: string
  addressType: 'billing' | 'delivery'
  addressLine1: string
  postalCode: string
  locality: string
  country: string
}

export type OrderDetail = OrderRow & {
  items: OrderItemRow[]
  events: OrderStatusEventRow[]
}

export class OrderInputError extends Error {
  status = 400
}

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const cleanLine = (value: string, max = 240) =>
  value
    .normalize('NFC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const cleanText = (value: string, max = 2000) =>
  value
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\f\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max)

const orderNumber = () => {
  const date = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '')
  return `DF4Y-${date}-${randomBytes(3).toString('hex').toUpperCase()}`
}

const mapOrder = (row: Record<string, unknown>): OrderRow => ({
  id: String(row.id),
  orderNumber: String(row.order_number),
  status: String(row.status),
  paymentStatus: String(row.payment_status),
  paymentProvider: String(row.payment_provider),
  paymentUrl: row.payment_url ? String(row.payment_url) : null,
  paymentReference: row.payment_reference ? String(row.payment_reference) : null,
  language: String(row.language),
  customerName: String(row.customer_name),
  email: String(row.email),
  phone: String(row.phone ?? ''),
  nif: String(row.nif ?? ''),
  purchaseType: String(row.purchase_type),
  billingAddress: String(row.billing_address ?? ''),
  billingPostalCode: String(row.billing_postal_code ?? ''),
  billingLocality: String(row.billing_locality ?? ''),
  deliveryAddress: String(row.delivery_address ?? ''),
  deliveryPostalCode: String(row.delivery_postal_code ?? ''),
  deliveryLocality: String(row.delivery_locality ?? ''),
  deliveryZone: String(row.delivery_zone ?? ''),
  customerNotes: String(row.customer_notes ?? ''),
  internalNotes: String(row.internal_notes ?? ''),
  productNet: Number(row.product_net),
  transportNet: Number(row.transport_net),
  vat: Number(row.vat),
  totalGross: Number(row.total_gross),
  totalWeightKg: Number(row.total_weight_kg),
  transportMultiplier: Number(row.transport_multiplier),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
})

const mapOrderItem = (row: Record<string, unknown>): OrderItemRow => ({
  id: String(row.id),
  productSlug: String(row.product_slug),
  productTitle: String(row.product_title),
  variantIndex: Number(row.variant_index),
  variantLabel: String(row.variant_label),
  variantDimensions: Array.isArray(row.variant_dimensions)
    ? (row.variant_dimensions as string[])
    : [],
  finish: String(row.finish),
  finishLabel: String(row.finish_label),
  quantity: Number(row.quantity),
  unitPriceNet: Number(row.unit_price_net),
  lineTotalNet: Number(row.line_total_net),
  unitWeightKg: Number(row.unit_weight_kg),
  lineWeightKg: Number(row.line_weight_kg),
})

const mapEvent = (row: Record<string, unknown>): OrderStatusEventRow => ({
  id: String(row.id),
  status: String(row.status),
  note: String(row.note ?? ''),
  actorType: String(row.actor_type ?? ''),
  actorLabel: String(row.actor_label ?? ''),
  createdAt: String(row.created_at),
})

const mapAddress = (row: Record<string, unknown>): CustomerAddressRow => ({
  id: String(row.id),
  addressType: String(row.address_type) === 'billing' ? 'billing' : 'delivery',
  addressLine1: String(row.address_line1 ?? ''),
  postalCode: String(row.postal_code ?? ''),
  locality: String(row.locality ?? ''),
  country: String(row.country ?? 'PT'),
})

const transportMultiplierFor = (content: SiteContent) =>
  Number.isFinite(content.storePage.transportMultiplier) && content.storePage.transportMultiplier > 0
    ? content.storePage.transportMultiplier
    : storeTransportMultiplier

export const buildOrderDraft = (
  content: SiteContent,
  cartItems: CheckoutCartItem[],
  deliveryPostalCode: string,
): OrderDraft => {
  const postalCode = normalizePostalCode(deliveryPostalCode)
  if (!isSupportedStorePostalCode(postalCode)) {
    throw new OrderInputError('Código postal inválido ou fora das zonas suportadas.')
  }

  if (!cartItems.length) {
    throw new OrderInputError('O carrinho está vazio.')
  }

  const items = cartItems.map((item) => {
    const product = content.storeProducts.find((candidate) => candidate.slug === item.slug)
    const variant = product?.variants[Math.max(0, Math.floor(item.variantIndex || 0))]
    if (!product || !variant || (item.finish !== 'natural' && item.finish !== 'dark')) {
      throw new OrderInputError('O carrinho tem produtos inválidos. Atualize a página e tente novamente.')
    }

    const quantity = Math.min(99, Math.max(1, Math.floor(item.quantity || 1)))
    const unitPriceNet = Number(variant.prices[item.finish])
    const unitWeightKg = Number(variant.weightKg ?? 0)
    if (!Number.isFinite(unitPriceNet) || unitPriceNet <= 0 || !Number.isFinite(unitWeightKg) || unitWeightKg <= 0) {
      throw new OrderInputError('Não foi possível calcular o preço ou transporte de um produto.')
    }

    return {
      product,
      variant,
      variantIndex: Math.max(0, Math.floor(item.variantIndex || 0)),
      finish: item.finish,
      finishLabel: content.storePage.finishLabels[item.finish],
      quantity,
      unitPriceNet,
      lineTotalNet: roundMoney(unitPriceNet * quantity),
      unitWeightKg,
      lineWeightKg: roundMoney(unitWeightKg * quantity),
    } satisfies OrderDraftItem
  })

  const transportMultiplier = transportMultiplierFor(content)
  const estimate = calculateStoreEstimate(
    items.map((item) => ({
      unitPrice: item.unitPriceNet,
      quantity: item.quantity,
      weightKg: item.unitWeightKg,
    })),
    postalCode,
    {transportMultiplier},
  )

  if (!estimate.transport || estimate.totalGross === null || estimate.vat === null || estimate.subtotalNet === null) {
    throw new OrderInputError('Não foi possível calcular transporte para este carrinho.')
  }

  return {
    items,
    productNet: estimate.productNet,
    transportNet: estimate.transport.transportNet,
    vat: estimate.vat,
    totalGross: estimate.totalGross,
    totalWeightKg: estimate.totalWeightKg,
    deliveryZone: estimate.transport.destination.label,
    transportMultiplier,
  }
}

export const createOrder = async (input: CheckoutCustomerInput, draft: OrderDraft) => {
  if (!databaseConfigured()) {
    throw new Error('DATABASE_URL is not configured')
  }

  const created = await withTransaction(async (client) => {
    const number = orderNumber()
    const orderResult = await client.query(
      `insert into orders (
        order_number, customer_id, language, customer_name, email, phone, nif, purchase_type,
        billing_address, billing_postal_code, billing_locality,
        delivery_address, delivery_postal_code, delivery_locality, delivery_zone,
        customer_notes, product_net, transport_net, vat, total_gross, total_weight_kg, transport_multiplier
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19, $20, $21, $22
      )
      returning *`,
      [
        number,
        input.customerId ?? null,
        input.language,
        cleanLine(input.name, 160),
        cleanLine(input.email, 254).toLowerCase(),
        cleanLine(input.phone, 40),
        cleanLine(input.nif, 16),
        input.purchaseType,
        cleanLine(input.billingAddress, 240),
        normalizePostalCode(input.billingPostalCode),
        cleanLine(input.billingLocality, 120),
        cleanLine(input.deliveryAddress, 240),
        normalizePostalCode(input.deliveryPostalCode),
        cleanLine(input.deliveryLocality, 120),
        draft.deliveryZone,
        cleanText(input.customerNotes, 2000),
        draft.productNet,
        draft.transportNet,
        draft.vat,
        draft.totalGross,
        draft.totalWeightKg,
        draft.transportMultiplier,
      ],
    )
    const order = mapOrder(orderResult.rows[0])

    for (const item of draft.items) {
      await client.query(
        `insert into order_items (
          order_id, product_slug, product_title, variant_index, variant_label, variant_dimensions,
          finish, finish_label, quantity, unit_price_net, line_total_net, unit_weight_kg, line_weight_kg
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          order.id,
          item.product.slug,
          item.product.title,
          item.variantIndex,
          item.variant.label,
          item.variant.dimensions,
          item.finish,
          item.finishLabel,
          item.quantity,
          item.unitPriceNet,
          item.lineTotalNet,
          item.unitWeightKg,
          item.lineWeightKg,
        ],
      )
    }

    await client.query(
      `insert into order_status_events (order_id, status, note, actor_type, actor_label)
       values ($1, $2, $3, 'system', 'checkout')`,
      [order.id, order.status, 'Encomenda criada. Pagamento por link ainda pendente.'],
    )

    if (input.customerId) {
      await client.query(
        `update customers
         set name = $1, phone = $2, nif = $3, purchase_type = $4, updated_at = now()
         where id = $5`,
        [
          cleanLine(input.name, 160),
          cleanLine(input.phone, 40),
          cleanLine(input.nif, 16),
          input.purchaseType,
          input.customerId,
        ],
      )

      for (const addressType of ['billing', 'delivery'] as const) {
        const address =
          addressType === 'billing'
            ? {
                line1: input.billingAddress,
                postalCode: input.billingPostalCode,
                locality: input.billingLocality,
              }
            : {
                line1: input.deliveryAddress,
                postalCode: input.deliveryPostalCode,
                locality: input.deliveryLocality,
              }

        await client.query(
          `update customer_addresses
           set is_default = false, updated_at = now()
           where customer_id = $1 and address_type = $2`,
          [input.customerId, addressType],
        )
        await client.query(
          `insert into customer_addresses (
            customer_id, address_type, address_line1, postal_code, locality, is_default
          )
          values ($1, $2, $3, $4, $5, true)`,
          [
            input.customerId,
            addressType,
            cleanLine(address.line1, 240),
            normalizePostalCode(address.postalCode),
            cleanLine(address.locality, 120),
          ],
        )
      }
    }

    return order
  })

  const payment = await prepareIfthenpayPayByLink({
    orderId: created.id,
    orderNumber: created.orderNumber,
    totalGross: created.totalGross,
    customerEmail: created.email,
  })

  await query(
    `insert into payment_attempts (order_id, provider, status, request_json, response_json, payment_url, reference)
     values ($1, $2, $3, $4, $5, $6, $7)`,
    [
      created.id,
      payment.provider,
      payment.status,
      JSON.stringify({totalGross: created.totalGross, email: created.email}),
      JSON.stringify(payment.response),
      payment.ok ? payment.paymentUrl : null,
      payment.ok ? payment.reference : null,
    ],
  ).catch(() => undefined)

  return created
}

export const recordOutboundEmail = async (
  input: {orderId: string; recipient: string; subject: string},
  result: EmailSendResult,
) => {
  if (!databaseConfigured()) return
  await query(
    `insert into outbound_emails (order_id, recipient, subject, status, provider_message_id, error)
     values ($1, $2, $3, $4, $5, $6)`,
    [
      input.orderId,
      input.recipient,
      input.subject,
      result.ok ? 'sent' : 'failed',
      result.ok ? result.id : null,
      result.ok ? null : result.error,
    ],
  ).catch(() => undefined)
}

export const sendOrderEmails = async (order: OrderRow) => {
  const customerSubject = `Encomenda ${order.orderNumber} recebida`
  const customerText = [
    `Recebemos a sua encomenda ${order.orderNumber}.`,
    '',
    `Total estimado com transporte e IVA: ${order.totalGross.toFixed(2)} EUR.`,
    'O pagamento por link ainda está pendente. A equipa enviará os dados de pagamento assim que confirmar a encomenda.',
  ].join('\n')
  const staffTo = ordersRecipient()
  const staffSubject = `Nova encomenda ${order.orderNumber}`
  const staffText = [
    `Nova encomenda ${order.orderNumber}`,
    `Cliente: ${order.customerName} <${order.email}>`,
    `Telefone: ${order.phone || '-'}`,
    `Zona: ${order.deliveryZone} (${order.deliveryPostalCode})`,
    `Total: ${order.totalGross.toFixed(2)} EUR`,
    'Estado: pendente de link de pagamento',
  ].join('\n')

  const customerResult = await sendTransactionalEmail({
    to: order.email,
    subject: customerSubject,
    text: customerText,
  })
  await recordOutboundEmail(
    {orderId: order.id, recipient: order.email, subject: customerSubject},
    customerResult,
  )

  if (staffTo) {
    const staffResult = await sendTransactionalEmail({
      to: staffTo,
      subject: staffSubject,
      text: staffText,
    })
    await recordOutboundEmail({orderId: order.id, recipient: staffTo, subject: staffSubject}, staffResult)
  }
}

const orderSelect = `select * from orders`

export const listOrdersForCustomer = async (customerId: string): Promise<OrderRow[]> => {
  if (!databaseConfigured()) return []
  const result = await query(`${orderSelect} where customer_id = $1 order by created_at desc limit 100`, [
    customerId,
  ])
  return result.rows.map(mapOrder)
}

export const listCustomerDefaultAddresses = async (
  customerId: string,
): Promise<CustomerAddressRow[]> => {
  if (!databaseConfigured()) return []
  const result = await query(
    `select *
     from customer_addresses
     where customer_id = $1 and is_default = true
     order by address_type asc, updated_at desc`,
    [customerId],
  )
  return result.rows.map(mapAddress)
}

export const listOrdersForPainel = async (limit = 200): Promise<OrderRow[]> => {
  if (!databaseConfigured()) return []
  const result = await query(`${orderSelect} order by created_at desc limit $1`, [limit])
  return result.rows.map(mapOrder)
}

export const getOrderDetail = async (id: string, customerId?: string | null): Promise<OrderDetail | null> => {
  if (!databaseConfigured()) return null
  const where = customerId ? 'where id = $1 and customer_id = $2' : 'where id = $1'
  const params = customerId ? [id, customerId] : [id]
  const orderResult = await query(`${orderSelect} ${where} limit 1`, params)
  const row = orderResult.rows[0]
  if (!row) return null

  const [itemsResult, eventsResult] = await Promise.all([
    query('select * from order_items where order_id = $1 order by created_at asc', [id]),
    query('select * from order_status_events where order_id = $1 order by created_at desc', [id]),
  ])

  return {
    ...mapOrder(row),
    items: itemsResult.rows.map(mapOrderItem),
    events: eventsResult.rows.map(mapEvent),
  }
}

export const getPainelOrderStats = async () => {
  if (!databaseConfigured()) return {orders: 0, pendingPaymentLink: 0}
  const result = await query<{
    orders: string
    pending_payment_link: string
  }>(`select
      count(*)::text as orders,
      count(*) filter (where status = 'pending_payment_link')::text as pending_payment_link
    from orders`)
  const row = result.rows[0]
  return {
    orders: Number(row?.orders ?? 0),
    pendingPaymentLink: Number(row?.pending_payment_link ?? 0),
  }
}

export const setOrderStatus = async (id: string, status: string, actorLabel: string) => {
  if (!databaseConfigured()) return
  const allowed = new Set([
    'pending_payment_link',
    'payment_link_sent',
    'paid',
    'in_preparation',
    'shipped',
    'completed',
    'cancelled',
  ])
  if (!allowed.has(status)) return

  await withTransaction(async (client) => {
    await client.query('update orders set status = $1, updated_at = now() where id = $2', [status, id])
    await client.query(
      `insert into order_status_events (order_id, status, note, actor_type, actor_label)
       values ($1, $2, '', 'staff', $3)`,
      [id, status, actorLabel],
    )
  })
}

export const appendOrderNote = async (id: string, note: string, actorLabel: string) => {
  if (!databaseConfigured()) return
  const trimmed = cleanText(note, 2000)
  if (!trimmed) return
  const stamp = new Date().toLocaleString('pt-PT')
  await query(
    `update orders
     set internal_notes = trim(both from concat_ws(E'\n', nullif(internal_notes, ''), $1)), updated_at = now()
     where id = $2`,
    [`[${stamp}${actorLabel ? ` · ${actorLabel}` : ''}] ${trimmed}`, id],
  )
  await query(
    `insert into order_status_events (order_id, status, note, actor_type, actor_label)
     values ($1, 'internal_note', $2, 'staff', $3)`,
    [id, trimmed, actorLabel],
  )
}
