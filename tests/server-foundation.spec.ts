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
import {
  authenticate as authenticateStaff,
  createSession as createStaffSession,
  createStaff,
  sessionCookieName,
} from '../src/lib/server/staff-auth'
import {syncPreviewAdminPolicy} from '../src/lib/server/preview-admin'
import {storeContactSubmission} from '../src/lib/server/crm'
import {deleteSetting, getSetting, getSettingMeta, setSetting} from '../src/lib/server/app-settings'
import {
  countOpenOperationalIncidents,
  listOperationalIncidents,
  recordOperationalIncident,
  resolveOperationalIncident,
} from '../src/lib/server/incidents'
import {
  createPrivacyRequest,
  exportCustomerData,
  listCustomerPrivacyRequests,
} from '../src/lib/server/privacy'

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

  test('customer registration, verified login, account access, and logout work through the real routes', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const email = `route-account-${suffix}@example.test`
    const password = 'Route-password-123!'
    let customerId = ''

    try {
      // This suite deliberately reuses a local development database between
      // runs. Clear only its test-owned customer-auth buckets so repeated
      // audits do not trip the production rate limit with Playwright's shared
      // loopback address.
      await query(
        `delete from rate_limit_buckets
         where key like 'register:%'
            or key like 'register-email:%'
            or key like 'login:%'
            or key like 'login-email:%'`,
      )

      await page.goto('/conta/registar?lang=pt')
      await page.waitForLoadState('networkidle')
      const firstNameInput = page.locator('input[name="firstName"]')
      const lastNameInput = page.locator('input[name="lastName"]')
      const emailInput = page.locator('input[name="email"]')
      await firstNameInput.fill('Conta')
      await lastNameInput.fill('Auditoria')
      await emailInput.fill(email)
      await page.locator('input[name="password"]').fill(password)
      await page.locator('input[name="passwordConfirm"]').fill(password)
      await page.locator('input[name="privacyConsent"]').check()
      await expect(firstNameInput).toHaveValue('Conta')
      await expect(lastNameInput).toHaveValue('Auditoria')
      await expect(emailInput).toHaveValue(email)
      await page.getByRole('button', {name: 'Criar conta'}).click()
      await expect(page).toHaveURL(/\/conta\/entrar/)

      const customer = await query<{id: string}>(
        `update customers
         set email_verified_at = now(), updated_at = now()
         where email = $1
         returning id`,
        [email],
      )
      customerId = customer.rows[0]!.id

      await page.waitForLoadState('networkidle')
      const loginEmailInput = page.locator('input[name="email"]')
      const loginPasswordInput = page.locator('input[name="password"]')
      await loginEmailInput.fill(email)
      await loginPasswordInput.fill(password)
      await expect(loginEmailInput).toHaveValue(email)
      await expect(loginPasswordInput).toHaveValue(password)
      await page.getByRole('button', {name: 'Entrar', exact: true}).click()
      await expect(page).toHaveURL(/\/conta\/dados/)
      await expect(page.getByRole('heading', {name: 'A sua conta'})).toBeVisible()

      await page.getByRole('button', {name: 'Terminar sessão'}).click()
      await expect(page).toHaveURL(/^http:\/\/127\.0\.0\.1:\d+\/$/)
      await page.goto('/conta/dados?lang=pt')
      await expect(page).toHaveURL(/\/conta\/entrar/)
    } finally {
      if (customerId) await query('delete from customers where id = $1', [customerId])
      await query(
        `delete from rate_limit_buckets
         where key like 'register:%'
            or key like 'register-email:%'
            or key like 'login:%'
            or key like 'login-email:%'`,
      )
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

  test('painel dashboard lands after login, an order status change is logged, and the activity log is admin-only', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    let adminId = ''
    let staffId = ''
    let orderId = ''

    const loginAs = async (token: string) => {
      await page.context().clearCookies()
      await page.goto('/painel/login')
      const url = new URL(page.url())
      await page.context().addCookies([
        {
          name: sessionCookieName,
          value: token,
          domain: url.hostname,
          path: '/painel',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ])
    }

    try {
      const admin = await createStaff({
        name: 'Audit Admin',
        username: `audit-admin-${suffix}`,
        password: 'Audit-password-123!',
        role: 'admin',
      })
      adminId = admin.id
      const staffMember = await createStaff({
        name: 'Audit Staff',
        username: `audit-staff-${suffix}`,
        password: 'Audit-password-123!',
        role: 'staff',
      })
      staffId = staffMember.id

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
        [`AUDIT-DASH-${suffix}`, `audit-dash-${suffix}@example.test`],
      )
      orderId = inserted.rows[0]!.id

      const adminSession = await createStaffSession(adminId, {ipHash: 'audit-ip', userAgent: 'Playwright'})
      await loginAs(adminSession.token)

      // Bare /painel lands on the dashboard (regression coverage for the
      // removed hardcoded /painel -> /painel/pedidos redirect).
      await page.goto('/painel')
      await expect(page.getByRole('heading', {name: 'Painel de controlo'})).toBeVisible()

      // Change the order's status through the real rendered form so the
      // setStatus action's logStaffActivity call is exercised end-to-end.
      await page.goto(`/painel/encomendas/${orderId}`)
      await page.locator('#order-status').selectOption('payment_link_sent')
      await page.getByRole('button', {name: 'Guardar estado'}).click()
      await expect(page.locator('#order-status')).toHaveValue('payment_link_sent')

      await page.goto('/painel/atividade')
      await expect(page.getByRole('cell', {name: 'Alterou o estado da encomenda'})).toBeVisible()

      const activityRow = await query<{id: string}>(
        `select id from staff_activity_log where staff_id = $1 and action = 'order.status' and entity_id = $2`,
        [adminId, orderId],
      )
      expect(activityRow.rows.length).toBe(1)

      // A non-admin staff account is gated out of the activity log server-side.
      const staffSession = await createStaffSession(staffId, {ipHash: 'audit-ip', userAgent: 'Playwright'})
      await loginAs(staffSession.token)
      await page.goto('/painel/atividade')
      await expect(page.getByRole('heading', {name: 'Acesso restrito'})).toBeVisible()
    } finally {
      if (adminId || staffId) {
        await query('delete from staff_activity_log where staff_id = any($1)', [[adminId, staffId].filter(Boolean)])
      }
      if (orderId) {
        await query('delete from order_status_events where order_id = $1', [orderId])
        await query('delete from orders where id = $1', [orderId])
      }
      if (adminId) {
        await query('delete from staff_sessions where staff_id = $1', [adminId])
        await query('delete from staff_users where id = $1', [adminId])
      }
      if (staffId) {
        await query('delete from staff_sessions where staff_id = $1', [staffId])
        await query('delete from staff_users where id = $1', [staffId])
      }
    }
  })

  test('the opt-in preview administrator is created and disabled as one disposable account', async ({
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const marker = `preview-bootstrap-admin.${suffix}`
    const username = `preview-admin-${suffix}`
    const password = 'Preview-password-123!'

    try {
      expect(
        await syncPreviewAdminPolicy(
          {enabled: true, name: 'Preview Admin', username, password},
          marker,
        ),
      ).toBe('ready')
      expect(await authenticateStaff(username, password)).toMatchObject({username, role: 'admin'})

      expect(
        await syncPreviewAdminPolicy(
          {enabled: false, name: 'Preview Admin', username, password: ''},
          marker,
        ),
      ).toBe('disabled')
      expect(await authenticateStaff(username, password)).toBeNull()
    } finally {
      await query('delete from staff_users where legacy_sanity_id = $1', [marker])
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

  test('app_settings stores and overwrites admin-editable values, keyed independently', async ({
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const key = `audit-setting-${suffix}`

    try {
      expect(await getSetting(key)).toBeNull()
      expect(await getSettingMeta(key)).toBeNull()

      await setSetting(key, 'first-value', 'audit-admin')
      expect(await getSetting(key)).toBe('first-value')
      const meta = await getSettingMeta(key)
      expect(meta?.updatedBy).toBe('audit-admin')

      // Re-saving must upsert in place, not duplicate the row (on conflict (key) do update).
      await setSetting(key, 'second-value', 'audit-admin-2')
      expect(await getSetting(key)).toBe('second-value')
      expect((await getSettingMeta(key))?.updatedBy).toBe('audit-admin-2')
      const rows = await query('select count(*)::int as n from app_settings where key = $1', [key])
      expect(rows.rows[0]!.n).toBe(1)

      await deleteSetting(key)
      expect(await getSetting(key)).toBeNull()
    } finally {
      await query('delete from app_settings where key = $1', [key])
    }
  })

  test('operational incidents deduplicate, remain visible, and can be resolved', async ({
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const fingerprint = `audit-incident-${suffix}`
    const title = `Falha de auditoria ${suffix}`
    let staffId = ''
    try {
      const staff = await createStaff({
        name: 'Incident Auditor',
        username: `incident-${suffix}`,
        password: 'Audit-password-123!',
        role: 'admin',
      })
      staffId = staff.id
      const before = await countOpenOperationalIncidents()
      await recordOperationalIncident({
        fingerprint,
        category: 'test',
        title,
        detail: 'Primeira ocorrência',
      })
      await recordOperationalIncident({
        fingerprint,
        category: 'test',
        severity: 'error',
        title,
        detail: 'Segunda ocorrência',
      })
      const incident = (await listOperationalIncidents()).find(
        (row) => row.title === title,
      )
      expect(incident).toBeTruthy()
      expect(incident?.occurrences).toBe(2)
      expect(await countOpenOperationalIncidents()).toBe(before + 1)
      expect(await resolveOperationalIncident(incident!.id, staff.id)).toBe(true)
      expect((await listOperationalIncidents()).some((row) => row.id === incident!.id)).toBe(false)
    } finally {
      await query(
        `delete from operational_incidents
         where category = 'test' and title = $1`,
        [title],
      )
      if (staffId) await query('delete from staff_users where id = $1', [staffId])
    }
  })

  test('customer privacy requests are deduplicated and exports include the request', async ({
    browserName,
  }, testInfo) => {
    test.skip(Boolean(browserName) && testInfo.project.name !== 'desktop-chrome', 'Runs once against CI Postgres')
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const email = `privacy-${suffix}@example.test`
    let customerId = ''
    try {
      const customer = await createCustomer({
        email,
        password: 'Audit-password-123!',
        name: 'Privacy Auditor',
      })
      customerId = customer.id
      const first = await createPrivacyRequest(customer, 'access', 'Primeiro pedido')
      const second = await createPrivacyRequest(customer, 'access', 'Pedido atualizado')
      expect(second.id).toBe(first.id)
      expect((await listCustomerPrivacyRequests(customer.id))).toHaveLength(1)
      const exported = await exportCustomerData(customer.id)
      expect(exported.customer).toMatchObject({email})
      expect(exported.privacyRequests).toHaveLength(1)
      expect(exported.privacyRequests[0]).toMatchObject({requestType: 'access'})
    } finally {
      if (customerId) {
        await query('delete from privacy_requests where customer_id = $1', [customerId])
        await query('delete from customers where id = $1', [customerId])
      }
    }
  })
})
