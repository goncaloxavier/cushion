import {expect, test} from '@playwright/test'
import {
  authenticateCustomer,
  createCustomer,
  createCustomerSession,
  createEmailVerificationToken,
  createPasswordResetToken,
  destroyCustomerSession,
  resetCustomerPasswordWithToken,
  validateCustomerSession,
  verifyCustomerEmailToken,
} from '../src/lib/server/customer-auth'
import {databaseConfigured, query} from '../src/lib/server/db'
import {appendOrderNote, getOrderDetail, setOrderStatus} from '../src/lib/server/orders'

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
test.describe('server foundations', () => {
  test('customer lifecycle and staff order updates persist against Postgres', async ({browserName}, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const email = `audit-${suffix}@example.test`
    let customerId = ''
    let orderId = ''

    try {
      const customer = await createCustomer({
        email,
        password: 'Audit-password-123!',
        name: 'Audit customer',
      })
      customerId = customer.id

      expect(await authenticateCustomer(email, 'Audit-password-123!')).not.toBeNull()

      const verificationToken = await createEmailVerificationToken(customer.id)
      const verification = await verifyCustomerEmailToken(verificationToken)
      expect(verification).toEqual({ok: true, customerId: customer.id})
      expect(await verifyCustomerEmailToken(verificationToken)).toEqual({ok: false, customerId: ''})

      const session = await createCustomerSession(customer.id, {ipHash: 'audit-ip', userAgent: 'Playwright'})
      expect((await validateCustomerSession(session.token))?.id).toBe(customer.id)

      const resetToken = await createPasswordResetToken(customer.id)
      expect(await resetCustomerPasswordWithToken(resetToken, 'Updated-password-456!')).toBe(true)
      expect(await validateCustomerSession(session.token)).toBeNull()
      expect(await authenticateCustomer(email, 'Audit-password-123!')).toBeNull()
      expect(await authenticateCustomer(email, 'Updated-password-456!')).not.toBeNull()
      await destroyCustomerSession(session.token)

      const inserted = await query<{id: string}>(
        `insert into orders (
          order_number, language, customer_name, email, phone, nif, purchase_type,
          billing_address, billing_postal_code, billing_locality,
          delivery_address, delivery_postal_code, delivery_locality, delivery_zone,
          product_net, transport_net, vat, total_gross, total_weight_kg, transport_multiplier
        ) values (
          $1, 'pt', 'Audit customer', $2, '', '', 'individual',
          'Rua de teste', '1000-001', 'Lisboa',
          'Rua de teste', '1000-001', 'Lisboa', 'Lisboa',
          10, 2, 2.76, 14.76, 1, 2.5
        ) returning id`,
        [`AUDIT-${suffix}`, email],
      )
      orderId = inserted.rows[0]!.id

      await setOrderStatus(orderId, 'payment_link_sent', 'CI audit')
      await appendOrderNote(orderId, 'Pagamento preparado para validação.', 'CI audit')
      const order = await getOrderDetail(orderId)
      expect(order?.status).toBe('payment_link_sent')
      expect(order?.internalNotes).toContain('Pagamento preparado para validação.')
      expect(order?.events.some((event) => event.status === 'payment_link_sent')).toBe(true)
      expect(order?.events.some((event) => event.status === 'internal_note')).toBe(true)
    } finally {
      if (orderId) await query('delete from orders where id = $1', [orderId])
      if (customerId) await query('delete from customers where id = $1', [customerId])
    }
  })
})
