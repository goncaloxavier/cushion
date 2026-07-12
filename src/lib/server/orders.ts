import {randomBytes} from 'node:crypto'
import {databaseConfigured, query, withTransaction} from './db'
import {
  calculateStoreEstimate,
  hasFlatTransport,
  isSupportedStorePostalCode,
  normalizePostalCode,
  normalizedTransportMultiplier,
} from '$lib/store-shipping'
import type {
  LanguageCode,
  SiteContent,
  StoreFinish,
  StoreProduct,
  StoreProductVariant,
} from '$lib/site-content'
import {prepareIfthenpayPayByLink} from './payment'
import {logEmailFailure, ordersRecipient, sendTransactionalEmail, type EmailSendResult} from './email'

export type CheckoutCartItem = {
  slug: string
  variantKey?: string
  variantIndex?: number
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
  billingName: string
  billingAddress: string
  billingPostalCode: string
  billingLocality: string
  deliveryName: string
  deliveryAddress: string
  deliveryPostalCode: string
  deliveryLocality: string
  customerNotes: string
  paymentMethod: string
  persistBillingAddress?: boolean
  persistDeliveryAddress?: boolean
  language: LanguageCode
  // Fresh, single-use token minted per checkout page load (not the session-sticky
  // CSRF token, which persists across visits). Lets createOrder tell a genuine
  // resubmit (double-click, back-button) from a new, legitimate order.
  submissionToken?: string
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
  paymentMethod: string
  paymentUrl: string | null
  paymentReference: string | null
  language: string
  customerName: string
  email: string
  phone: string
  nif: string
  purchaseType: string
  billingName: string
  billingAddress: string
  billingPostalCode: string
  billingLocality: string
  deliveryName: string
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
  name: string
  // Only meaningful for billing addresses — the NIF tied to that invoice
  // name, distinct from the account holder's own customers.nif.
  nif: string
  addressLine1: string
  addressLine2: string
  postalCode: string
  locality: string
  country: string
  isDefault: boolean
  updatedAt: string
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
  paymentMethod: String(row.payment_method ?? ''),
  paymentUrl: row.payment_url ? String(row.payment_url) : null,
  paymentReference: row.payment_reference ? String(row.payment_reference) : null,
  language: String(row.language),
  customerName: String(row.customer_name),
  email: String(row.email),
  phone: String(row.phone ?? ''),
  nif: String(row.nif ?? ''),
  purchaseType: String(row.purchase_type),
  billingName: String(row.billing_name ?? ''),
  billingAddress: String(row.billing_address ?? ''),
  billingPostalCode: String(row.billing_postal_code ?? ''),
  billingLocality: String(row.billing_locality ?? ''),
  deliveryName: String(row.delivery_name ?? ''),
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
  name: String(row.name ?? ''),
  nif: String(row.nif ?? ''),
  addressLine1: String(row.address_line1 ?? ''),
  addressLine2: String(row.address_line2 ?? ''),
  postalCode: String(row.postal_code ?? ''),
  locality: String(row.locality ?? ''),
  country: String(row.country ?? 'PT'),
  isDefault: Boolean(row.is_default),
  updatedAt: String(row.updated_at ?? ''),
})

const transportMultiplierFor = (content: SiteContent) =>
  normalizedTransportMultiplier(content.storePage.transportMultiplier)

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
    const variant = item.variantKey
      ? product?.variants.find((candidate) => candidate.key === item.variantKey)
      : product?.variants[Math.max(0, Math.floor(item.variantIndex || 0))]
    if (!product || !variant || (item.finish !== 'natural' && item.finish !== 'dark')) {
      throw new OrderInputError('O carrinho tem produtos inválidos. Atualize a página e tente novamente.')
    }

    const quantity = Math.min(99, Math.max(1, Math.floor(item.quantity || 1)))
    const finish = product.hasFinishChoice ? item.finish : 'natural'
    const unitPriceNet = Number(variant.prices[finish])
    const unitWeightKg = Number(variant.weightKg ?? 0)
    // A flat-rate product (see hasFlatTransport) is priced without needing a
    // weight at all — calculateStoreEstimate already excludes it from the
    // weight-based calculation, so this must not reject it for lacking one.
    const weightRequired = !hasFlatTransport(product)
    if (
      !Number.isFinite(unitPriceNet) ||
      unitPriceNet <= 0 ||
      (weightRequired && (!Number.isFinite(unitWeightKg) || unitWeightKg <= 0))
    ) {
      throw new OrderInputError('Não foi possível calcular o preço ou transporte de um produto.')
    }

    return {
      product,
      variant,
      variantIndex: product.variants.indexOf(variant),
      finish,
      finishLabel: product.hasFinishChoice ? content.storePage.finishLabels[finish] : '',
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
      flatTransportPrice: item.product.flatTransportPrice,
    })),
    postalCode,
    {transportMultiplier},
  )

  if (!estimate.transport || estimate.totalGross === null || estimate.vat === null || estimate.subtotalNet === null) {
    if (estimate.transportIssue === 'overweight') {
      throw new OrderInputError('O peso total excede o limite de transporte automático. Contacte-nos para organizar a entrega.')
    }
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

  const submissionToken = input.submissionToken?.trim() || ''
  if (submissionToken.length < 20) {
    throw new OrderInputError('Atualize a página antes de finalizar o pedido.')
  }

  const created = await withTransaction(async (client) => {
    const number = orderNumber()
    const orderResult = await client.query(
      `insert into orders (
        order_number, customer_id, language, customer_name, email, phone, nif, purchase_type,
        billing_name, billing_address, billing_postal_code, billing_locality,
        delivery_name, delivery_address, delivery_postal_code, delivery_locality, delivery_zone,
        customer_notes, product_net, transport_net, vat, total_gross, total_weight_kg, transport_multiplier,
        payment_method, submission_token, privacy_consent_at
      )
      values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12,
        $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24,
        $25, $26, now()
      )
      on conflict (submission_token) do nothing
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
        cleanLine(input.billingName, 160),
        cleanLine(input.billingAddress, 240),
        normalizePostalCode(input.billingPostalCode),
        cleanLine(input.billingLocality, 120),
        cleanLine(input.deliveryName, 160),
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
        cleanLine(input.paymentMethod, 20),
        submissionToken,
      ],
    )

    if (orderResult.rows.length === 0) {
      // A row with this submission_token already exists (resubmit of the same
      // checkout attempt) — return the original order untouched instead of
      // creating a duplicate, and signal the caller to skip payment/email.
      const existing = await client.query('select * from orders where submission_token = $1', [
        submissionToken,
      ])
      return {order: mapOrder(existing.rows[0]), isNew: false}
    }
    const order = mapOrder(orderResult.rows[0])

    // Insert every line item in one statement. The order still stays fully
    // transactional, without making checkout latency grow by one round trip
    // per cart line.
    const itemColumnCount = 13
    const itemValues = draft.items.flatMap((item) => [
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
    ])
    const itemPlaceholders = draft.items
      .map((_, itemIndex) => {
        const offset = itemIndex * itemColumnCount
        return `(${Array.from({length: itemColumnCount}, (_, columnIndex) => `$${offset + columnIndex + 1}`).join(', ')})`
      })
      .join(', ')

    await client.query(
      `insert into order_items (
        order_id, product_slug, product_title, variant_index, variant_label, variant_dimensions,
        finish, finish_label, quantity, unit_price_net, line_total_net, unit_weight_kg, line_weight_kg
      )
      values ${itemPlaceholders}`,
      itemValues,
    )

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
        const shouldPersist =
          addressType === 'billing'
            ? input.persistBillingAddress !== false
            : input.persistDeliveryAddress !== false
        if (!shouldPersist) continue

        const address =
          addressType === 'billing'
            ? {
                name: input.billingName,
                nif: input.nif,
                line1: input.billingAddress,
                postalCode: input.billingPostalCode,
                locality: input.billingLocality,
              }
            : {
                name: input.deliveryName,
                nif: '',
                line1: input.deliveryAddress,
                postalCode: input.deliveryPostalCode,
                locality: input.deliveryLocality,
              }

        const name = cleanLine(address.name, 160)
        const nif = cleanLine(address.nif, 16)
        const line1 = cleanLine(address.line1, 240)
        const postalCode = normalizePostalCode(address.postalCode)
        const locality = cleanLine(address.locality, 120)

        await client.query(
          `update customer_addresses
           set is_default = false, updated_at = now()
           where customer_id = $1 and address_type = $2`,
          [input.customerId, addressType],
        )
        // The unique address identity added in migration 0004 makes this safe
        // under concurrent checkout requests: the address is either reused or
        // inserted exactly once, never duplicated by a select-then-insert race.
        await client.query(
          `insert into customer_addresses (
            customer_id, address_type, name, nif, address_line1, address_line2, postal_code, locality, country, is_default
          )
          values ($1, $2, $3, $4, $5, '', $6, $7, 'PT', true)
          on conflict (customer_id, address_type, address_line1, address_line2, postal_code, locality, country)
          do update set name = excluded.name, nif = excluded.nif, is_default = true, updated_at = now()`,
          [input.customerId, addressType, name, nif, line1, postalCode, locality],
        )
      }
    }

    return {order, isNew: true}
  })

  if (created.isNew) {
    const payment = await prepareIfthenpayPayByLink({
      orderId: created.order.id,
      orderNumber: created.order.orderNumber,
      totalGross: created.order.totalGross,
      customerEmail: created.order.email,
    })

    await query(
      `insert into payment_attempts (order_id, provider, status, request_json, response_json, payment_url, reference)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        created.order.id,
        payment.provider,
        payment.status,
        JSON.stringify({totalGross: created.order.totalGross, email: created.order.email}),
        JSON.stringify(payment.response),
        payment.ok ? payment.paymentUrl : null,
        payment.ok ? payment.reference : null,
      ],
    ).catch(() => undefined)
  }

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
  const paymentMethod =
    order.paymentMethod === 'mbway'
      ? 'MB WAY'
      : order.paymentMethod === 'multibanco'
        ? 'Multibanco'
        : order.paymentMethod === 'card'
          ? 'Cartão'
          : 'A confirmar'
  const customerSubject = `Encomenda ${order.orderNumber} recebida`
  const customerText = [
    `Recebemos a sua encomenda ${order.orderNumber}.`,
    '',
    `Total estimado com transporte e IVA: ${order.totalGross.toFixed(2)} EUR.`,
    `Método de pagamento escolhido: ${paymentMethod}.`,
    'O pagamento por link ainda está pendente. A equipa enviará os dados de pagamento assim que confirmar a encomenda.',
  ].join('\n')
  const staffTo = ordersRecipient()
  const staffSubject = `Nova encomenda ${order.orderNumber}`
  const staffText = [
    `Nova encomenda ${order.orderNumber}`,
    `Cliente: ${order.customerName} <${order.email}>`,
    `Telefone: ${order.phone || '-'}`,
    `Faturação: ${order.billingName || '-'}${order.nif ? ` · NIF ${order.nif}` : ''}`,
    `Entrega: ${order.deliveryName || '-'}`,
    `Zona: ${order.deliveryZone} (${order.deliveryPostalCode})`,
    `Total: ${order.totalGross.toFixed(2)} EUR`,
    `Método de pagamento: ${paymentMethod}`,
    'Estado: pendente de link de pagamento',
  ].join('\n')

  const customerResult = await sendTransactionalEmail({
    to: order.email,
    subject: customerSubject,
    text: customerText,
  })
  logEmailFailure('customer order email', customerResult)
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
    logEmailFailure('staff order email', staffResult)
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

export const listCustomerAddresses = async (customerId: string): Promise<CustomerAddressRow[]> => {
  if (!databaseConfigured()) return []
  const result = await query(
    `select *
     from customer_addresses
     where customer_id = $1
     order by address_type asc, is_default desc, updated_at desc`,
    [customerId],
  )
  return result.rows.map(mapAddress)
}

export type CustomerAddressInput = {
  name: string
  nif: string
  line1: string
  line2: string
  postalCode: string
  locality: string
  country: string
}

const cleanCountry = (value: string) => cleanLine(value, 2).toUpperCase() || 'PT'

export const createCustomerAddress = async (
  customerId: string,
  addressType: 'billing' | 'delivery',
  input: CustomerAddressInput,
  makeDefault = false,
) => {
  if (!databaseConfigured()) return null
  return withTransaction(async (client) => {
    const shouldDefault = makeDefault
    if (shouldDefault) {
      await client.query(
        `update customer_addresses set is_default = false, updated_at = now()
         where customer_id = $1 and address_type = $2`,
        [customerId, addressType],
      )
    }
    const result = await client.query(
      `insert into customer_addresses (
        customer_id, address_type, name, nif, address_line1, address_line2, postal_code, locality, country, is_default
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (customer_id, address_type, address_line1, address_line2, postal_code, locality, country)
      do update set
        name = excluded.name,
        nif = excluded.nif,
        is_default = customer_addresses.is_default or excluded.is_default,
        updated_at = now()
      returning *`,
      [
        customerId,
        addressType,
        cleanLine(input.name, 120),
        cleanLine(input.nif, 16),
        cleanLine(input.line1, 240),
        cleanLine(input.line2, 240),
        normalizePostalCode(input.postalCode),
        cleanLine(input.locality, 120),
        cleanCountry(input.country),
        shouldDefault,
      ],
    )
    return mapAddress(result.rows[0])
  })
}

// Appends a new default address while keeping previous entries as address history.
export const saveCustomerAddress = async (
  customerId: string,
  addressType: 'billing' | 'delivery',
  input: {line1: string; postalCode: string; locality: string},
) =>
  createCustomerAddress(
    customerId,
    addressType,
    {name: '', nif: '', line1: input.line1, line2: '', postalCode: input.postalCode, locality: input.locality, country: 'PT'},
    true,
  )

export const saveCustomerDeliveryAddress = async (
  customerId: string,
  input: {line1: string; postalCode: string; locality: string},
) => saveCustomerAddress(customerId, 'delivery', input)

export const updateCustomerAddress = async (
  customerId: string,
  addressId: string,
  input: CustomerAddressInput,
): Promise<CustomerAddressRow | null> => {
  if (!databaseConfigured()) return null
  const result = await query(
    `update customer_addresses
     set name = $3, nif = $4, address_line1 = $5, address_line2 = $6, postal_code = $7,
         locality = $8, country = $9, updated_at = now()
     where customer_id = $1 and id = $2
     returning *`,
    [
      customerId,
      addressId,
      cleanLine(input.name, 120),
      cleanLine(input.nif, 16),
      cleanLine(input.line1, 240),
      cleanLine(input.line2, 240),
      normalizePostalCode(input.postalCode),
      cleanLine(input.locality, 120),
      cleanCountry(input.country),
    ],
  )
  return result.rows[0] ? mapAddress(result.rows[0]) : null
}

export const setCustomerDefaultAddress = async (
  customerId: string,
  addressId: string,
): Promise<boolean> => {
  if (!databaseConfigured()) return false
  return withTransaction(async (client) => {
    const current = await client.query(
      `select address_type from customer_addresses where customer_id = $1 and id = $2 limit 1`,
      [customerId, addressId],
    )
    const addressType = current.rows[0]?.address_type
    if (addressType !== 'billing' && addressType !== 'delivery') return false
    await client.query(
      `update customer_addresses set is_default = false, updated_at = now()
       where customer_id = $1 and address_type = $2`,
      [customerId, addressType],
    )
    await client.query(
      `update customer_addresses set is_default = true, updated_at = now()
       where customer_id = $1 and id = $2`,
      [customerId, addressId],
    )
    return true
  })
}

export const deleteCustomerAddress = async (
  customerId: string,
  addressId: string,
): Promise<boolean> => {
  if (!databaseConfigured()) return false
  return withTransaction(async (client) => {
    const current = await client.query(
      `select address_type, is_default
       from customer_addresses
       where customer_id = $1 and id = $2
       limit 1`,
      [customerId, addressId],
    )
    const row = current.rows[0]
    if (!row) return false
    await client.query(`delete from customer_addresses where customer_id = $1 and id = $2`, [
      customerId,
      addressId,
    ])
    if (row.is_default) {
      await client.query(
        `update customer_addresses
         set is_default = true, updated_at = now()
         where id = (
           select id from customer_addresses
           where customer_id = $1 and address_type = $2
           order by updated_at desc
           limit 1
         )`,
        [customerId, row.address_type],
      )
    }
    return true
  })
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
