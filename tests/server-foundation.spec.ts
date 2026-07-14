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
import {authenticate as authenticateStaff, createSession as createStaffSession} from '../src/lib/server/staff-auth'
import {storeContactSubmission} from '../src/lib/server/crm'

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
          product_net, transport_net, vat, total_gross, total_weight_kg, transport_multiplier,
          privacy_consent_at
        ) values (
          $1, 'pt', 'Audit customer', $2, '', '', 'individual',
          'Rua de teste', '1000-001', 'Lisboa',
          'Rua de teste', '1000-001', 'Lisboa', 'Lisboa',
          10, 2, 2.76, 14.76, 1, 2.5, now()
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

  test('a staff password hash migrated from the legacy Sanity system authenticates with zero forced reset', async ({
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    // This hash was generated once, offline, with the exact scrypt format the
    // old Sanity-backed auth.ts produced (scrypt$N.r.p$saltB64$derivedB64) —
    // not by any code path this test exercises. It stands in for a row
    // copied byte-for-byte by scripts/migrate-crm-to-postgres.ts. If this
    // ever stops verifying, the "zero forced resets" migration guarantee is
    // broken.
    const legacyHash =
      'scrypt$32768.8.1$lUD5AKLmFETg7xMYGZvbjA==$F8pLMlbHw9qLgnEIyoiArKmc0IM0THDyF2tlGBA+3L/unHbAa5vanTWOeuTdeq/Jh1IVmi0+iaLr+EVNpo5Sww=='

    const suffix = uniqueSuffix()
    const username = `audit-staff-${suffix}`
    let staffId = ''

    try {
      const inserted = await query<{id: string}>(
        `insert into staff_users (name, username, password_hash, role, active, legacy_sanity_id)
         values ($1, $2, $3, 'admin', true, $4)
         returning id`,
        ['Migrated Admin', username, legacyHash, `staffUser.${suffix}`],
      )
      staffId = inserted.rows[0]!.id

      expect(await authenticateStaff(username, 'Legacy-password-789!')).not.toBeNull()
      expect(await authenticateStaff(username, 'wrong-password')).toBeNull()

      const session = await createStaffSession(staffId, {ipHash: 'audit-ip', userAgent: 'Playwright'})
      expect(session.token.length).toBeGreaterThan(20)
    } finally {
      if (staffId) {
        await query('delete from staff_sessions where staff_id = $1', [staffId])
        await query('delete from staff_users where id = $1', [staffId])
      }
    }
  })

  test('duplicate contact submissions from the same email merge into one profile', async ({
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const email = `audit-dedup-${suffix}@example.test`
    const base = {
      firstName: 'Audit',
      lastName: 'Dedup',
      name: 'Audit Dedup',
      email,
      phone: '+351910000000',
      address: 'Rua de teste',
      postalCode: '1000-001',
      locality: 'Lisboa',
      message: 'Primeira mensagem de auditoria.',
      marketingConsent: true,
      consentText: 'Eu concordo com a política de privacidade',
      privacyConsent: true,
      language: 'pt' as const,
      source: 'contact' as const,
      sourcePath: '/contacto',
      ipAddress: `203.0.113.${(Date.now() % 200) + 10}`,
      userAgent: 'Playwright',
    }

    try {
      const first = await storeContactSubmission(base)
      expect(first.ok).toBe(true)
      const second = await storeContactSubmission({...base, message: 'Segunda mensagem de auditoria.'})
      expect(second.ok).toBe(true)

      const profile = await query<{id: string; submission_count: number}>(
        'select id, submission_count from crm_client_profiles where email_normalized = $1',
        [email.toLowerCase()],
      )
      expect(profile.rows).toHaveLength(1)
      expect(profile.rows[0]!.submission_count).toBe(2)

      const submissions = await query('select id from crm_form_submissions where email = $1', [email])
      expect(submissions.rows).toHaveLength(2)
    } finally {
      await query('delete from crm_form_submissions where email = $1', [email])
      await query('delete from crm_client_profiles where email_normalized = $1', [email.toLowerCase()])
    }
  })
})
