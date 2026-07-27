import {databaseConfigured, query, withTransaction} from './db'
import type {CustomerUser} from './customer-auth'

export type PrivacyRequestType =
  | 'access'
  | 'portability'
  | 'erasure'
  | 'restriction'
  | 'marketing_withdrawal'

export type PrivacyRequestStatus = 'new' | 'in_progress' | 'completed' | 'rejected'

export type PrivacyRequestRow = {
  id: string
  customerId: string | null
  customerEmail: string
  requestType: PrivacyRequestType
  status: PrivacyRequestStatus
  customerNote: string
  internalNote: string
  handledBy: string | null
  handledAt: string | null
  createdAt: string
  updatedAt: string
}

type DatabasePrivacyRequest = {
  id: string
  customer_id: string | null
  customer_email: string
  request_type: PrivacyRequestType
  status: PrivacyRequestStatus
  customer_note: string
  internal_note: string
  handled_by: string | null
  handled_at: string | null
  created_at: string
  updated_at: string
}

const mapRequest = (row: DatabasePrivacyRequest): PrivacyRequestRow => ({
  id: row.id,
  customerId: row.customer_id,
  customerEmail: row.customer_email,
  requestType: row.request_type,
  status: row.status,
  customerNote: row.customer_note,
  internalNote: row.internal_note,
  handledBy: row.handled_by,
  handledAt: row.handled_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const requestSelect = `
  select id, customer_id, customer_email, request_type, status, customer_note,
         internal_note, handled_by, handled_at, created_at, updated_at
  from privacy_requests
`

export const listCustomerPrivacyRequests = async (customerId: string) => {
  if (!databaseConfigured()) return []
  const result = await query<DatabasePrivacyRequest>(
    `${requestSelect}
     where customer_id = $1
     order by created_at desc`,
    [customerId],
  )
  return result.rows.map((row) => ({
    ...mapRequest(row),
    internalNote: '',
    handledBy: null,
  }))
}

export const createPrivacyRequest = async (
  customer: CustomerUser,
  requestType: PrivacyRequestType,
  note: string,
) =>
  withTransaction(async (client) => {
    if (requestType === 'marketing_withdrawal') {
      await client.query(
        `update crm_client_profiles
         set marketing_consent = false,
             marketing_consent_at = null,
             marketing_withdrawn_at = now(),
             updated_at = now()
         where email_normalized = $1`,
        [customer.email.trim().toLowerCase()],
      )
    }

    const status: PrivacyRequestStatus =
      requestType === 'marketing_withdrawal' ? 'completed' : 'new'
    const result = await client.query<DatabasePrivacyRequest>(
      `insert into privacy_requests (
         customer_id, customer_email, request_type, status, customer_note,
         handled_at, updated_at
       )
       values ($1, $2, $3, $4, $5, case when $4 = 'completed' then now() end, now())
       on conflict (customer_id, request_type)
         where customer_id is not null and status in ('new', 'in_progress')
       do update
       set customer_note = excluded.customer_note,
           updated_at = now()
       returning id, customer_id, customer_email, request_type, status, customer_note,
                 internal_note, handled_by, handled_at, created_at, updated_at`,
      [customer.id, customer.email, requestType, status, note.trim().slice(0, 1000)],
    )
    return mapRequest(result.rows[0])
  })

export const exportCustomerData = async (customerId: string) => {
  const [customer, addresses, orders, items, events, privacyRequests] = await Promise.all([
    query(
      `select id, email, name, phone, nif, purchase_type, email_verified_at,
              privacy_consent_at, created_at, updated_at
       from customers where id = $1`,
      [customerId],
    ),
    query(
      `select id, address_type, name, address_line1, address_line2, postal_code,
              locality, country, is_default, created_at, updated_at
       from customer_addresses where customer_id = $1 order by created_at asc`,
      [customerId],
    ),
    query(
      `select id, order_number, status, payment_status, language, customer_name, email,
              phone, nif, purchase_type, billing_address, billing_postal_code,
              billing_locality, delivery_address, delivery_postal_code, delivery_locality,
              delivery_zone, customer_notes, product_net, transport_net, vat, total_gross,
              total_weight_kg, transport_multiplier, created_at, updated_at
       from orders where customer_id = $1 order by created_at desc`,
      [customerId],
    ),
    query(
      `select item.*
       from order_items item
       join orders on orders.id = item.order_id
       where orders.customer_id = $1
       order by item.created_at asc`,
      [customerId],
    ),
    query(
      `select event.*
       from order_status_events event
       join orders on orders.id = event.order_id
       where orders.customer_id = $1
       order by event.created_at asc`,
      [customerId],
    ),
    query(
      `${requestSelect}
       where customer_id = $1
       order by created_at desc`,
      [customerId],
    ),
  ])

  return {
    exportedAt: new Date().toISOString(),
    customer: customer.rows[0] ?? null,
    addresses: addresses.rows,
    orders: orders.rows,
    orderItems: items.rows,
    orderEvents: events.rows,
    privacyRequests: privacyRequests.rows.map((row) => {
      const request = mapRequest(row as unknown as DatabasePrivacyRequest)
      return {
        id: request.id,
        requestType: request.requestType,
        status: request.status,
        customerNote: request.customerNote,
        handledAt: request.handledAt,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      }
    }),
  }
}

export const listPrivacyRequests = async (status = '') => {
  if (!databaseConfigured()) return []
  const allowed = new Set<PrivacyRequestStatus>(['new', 'in_progress', 'completed', 'rejected'])
  const useStatus = allowed.has(status as PrivacyRequestStatus)
  const result = await query<DatabasePrivacyRequest>(
    `${requestSelect}
     ${useStatus ? 'where status = $1' : ''}
     order by
       case status when 'new' then 0 when 'in_progress' then 1 else 2 end,
       created_at asc`,
    useStatus ? [status] : [],
  )
  return result.rows.map(mapRequest)
}

export const getPrivacyRequest = async (id: string) => {
  if (!databaseConfigured()) return null
  const result = await query<DatabasePrivacyRequest>(`${requestSelect} where id = $1 limit 1`, [id])
  return result.rows[0] ? mapRequest(result.rows[0]) : null
}

export const updatePrivacyRequest = async (input: {
  id: string
  status: PrivacyRequestStatus
  internalNote: string
  staffId: string
}) => {
  return withTransaction(async (client) => {
    const existing = await client.query<DatabasePrivacyRequest>(
      `${requestSelect} where id = $1 for update`,
      [input.id],
    )
    const request = existing.rows[0]
    if (!request) return null

    if (input.status === 'completed' && request.customer_id) {
      if (request.request_type === 'restriction') {
        await client.query(
          'update customers set processing_restricted_at = now(), updated_at = now() where id = $1',
          [request.customer_id],
        )
      }

      if (request.request_type === 'erasure') {
        const normalizedEmail = request.customer_email.trim().toLowerCase()
        await client.query('update orders set customer_id = null where customer_id = $1', [
          request.customer_id,
        ])
        await client.query(
          `update crm_form_submissions
           set first_name = '',
               last_name = '',
               name = 'Dados removidos',
               email = concat('removed+', left(encode(digest(email, 'sha256'), 'hex'), 16), '@invalid.local'),
               phone = '',
               address = '',
               postal_code = '',
               locality = '',
               message = '',
               consent_text = '',
               ip_hash = '',
               user_agent = '',
               internal_notes = ''
           where lower(email) = $1`,
          [normalizedEmail],
        )
        await client.query(
          `delete from crm_client_profiles where email_normalized = $1`,
          [normalizedEmail],
        )
        await client.query('delete from customers where id = $1', [request.customer_id])
        await client.query(
          `update privacy_requests
           set customer_email = concat(
             'removed+',
             left(encode(digest(customer_email, 'sha256'), 'hex'), 16),
             '@invalid.local'
           )
           where id = $1`,
          [input.id],
        )
      }
    }

    const result = await client.query<DatabasePrivacyRequest>(
      `update privacy_requests
       set status = $2,
           internal_note = $3,
           handled_by = $4,
           handled_at = case when $2 in ('completed', 'rejected') then now() else handled_at end,
           updated_at = now()
       where id = $1
       returning id, customer_id, customer_email, request_type, status, customer_note,
                 internal_note, handled_by, handled_at, created_at, updated_at`,
      [input.id, input.status, input.internalNote.trim().slice(0, 2000), input.staffId],
    )
    return result.rows[0] ? mapRequest(result.rows[0]) : null
  })
}
