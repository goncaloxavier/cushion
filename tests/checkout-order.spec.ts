import {expect, test} from '@playwright/test'
import {databaseConfigured, query} from '../src/lib/server/db'
import {
  createSession as createStaffSession,
  createStaff,
  sessionCookieName,
} from '../src/lib/server/staff-auth'

/**
 * A customer placing an order, through the browser, from the shop to the row a
 * member of staff opens the next morning.
 *
 * Every order in the suite until now was inserted with raw SQL. The staff side
 * was well covered — statuses, notes, the activity log — but all of it against a
 * row that no form had ever produced, so the checkout form itself, the single
 * most commercially important thing on the site, was the one flow nobody
 * exercised. `add to cart → cart → checkout` in commerce.spec.ts stops at
 * "renders the order form" and never presses the button.
 *
 * Postgres-gated like the rest of server-foundation: CI supplies an ephemeral
 * database, and locally it skips unless DATABASE_URL is set.
 */
const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const seedPostalCode = (page: import('@playwright/test').Page) =>
  page.addInitScript(() => {
    try {
      localStorage.setItem('df4y-store-delivery-postal-code-v1', '1000-001')
    } catch {
      /* storage may be unavailable */
    }
  })

test.describe('checkout', () => {
  test('a customer places an order through the form and staff can open it', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Runs once against CI Postgres',
    )
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const email = `checkout-${suffix}@example.test`
    let orderId = ''
    let adminId = ''

    try {
      await seedPostalCode(page)

      // The real path a customer takes, not a direct hop to /finalizar-compra:
      // the cart has to actually contain something the server will price.
      await page.goto('/loja?lang=pt')
      await page.locator('a[href*="/loja/"]:visible').first().click()
      await expect(page).toHaveURL(/\/loja\/.+/)
      await page.getByRole('button', {name: /adicionar ao carrinho/i}).first().click()
      await expect(page.locator('.header-actions .cart-count')).toHaveText(/[1-9]/)

      await page.goto('/finalizar-compra?lang=pt')
      // The checkout reveals its panels on scroll, so controls are still moving
      // when the page settles. Playwright refuses to click an element that is not
      // stable, and this test is about the order, not the animation.
      await page.addStyleTag({
        content: `*, *::before, *::after {
          animation: none !important;
          transition: none !important;
        }`,
      })
      await expect(page.locator('form input[name="email"]')).toBeVisible()

      await page.locator('input[name="name"]').fill('Cliente Playwright')
      await page.locator('input[name="email"]').fill(email)
      await page.locator('input[name="phone"]').fill('912345678')

      await page.locator('input[name="billingName"]:visible').fill('Cliente Playwright')
      await page.locator('input[name="nif"]:visible').fill('123456789')
      await page.locator('input[name="billingAddress"]:visible').fill('Rua de Teste 1')
      await page.locator('input[name="billingPostalCode"]:visible').fill('1000-001')
      await page.locator('input[name="billingLocality"]:visible').fill('Lisboa')

      await page.locator('input[name="deliveryName"]:visible').fill('Cliente Playwright')
      await page.locator('input[name="deliveryAddress"]:visible').fill('Rua de Teste 1')
      await page.locator('input[name="deliveryPostalCode"]:visible').fill('1000-001')
      await page.locator('input[name="deliveryLocality"]:visible').fill('Lisboa')

      // Card is deliberately disabled in the UI, so choosing it would leave the
      // submit button unclickable and the failure would read as a timeout.
      await page.locator('input[name="paymentMethod"][value="multibanco"]').check()
      await page.locator('input[name="privacyConsent"]').check()

      const submit = page.locator('button[form="checkout-order-form"][type="submit"]')
      await expect(submit).toBeEnabled()
      await submit.click()

      // Wait for either outcome and report the rejection, rather than timing out
      // on the success block with no idea which field the server objected to --
      // the feedback sits at the top of the form, off-screen from the button.
      const success = page.locator('.checkout-success')
      const feedback = page.locator('.form-feedback')
      await expect(success.or(feedback).first()).toBeVisible({timeout: 15_000})
      if (await feedback.count()) {
        throw new Error(`checkout rejected the order: ${(await feedback.first().innerText()).trim()}`)
      }
      const orderNumber = (await success.locator('h1').innerText()).trim()
      expect(orderNumber).not.toBe('')

      const stored = await query<{id: string; email: string; total_gross: string; status: string}>(
        `select id, email, total_gross, status from orders where order_number = $1`,
        [orderNumber],
      )
      expect(stored.rows.length, `order ${orderNumber} was shown but not stored`).toBe(1)
      orderId = stored.rows[0]!.id
      expect(stored.rows[0]!.email).toBe(email)
      expect(Number(stored.rows[0]!.total_gross)).toBeGreaterThan(0)

      // The order is only real if the people who fulfil it can see it. This is
      // the half that every previous order test faked with an INSERT.
      const admin = await createStaff({
        name: 'Checkout Admin',
        username: `checkout-admin-${suffix}`,
        password: 'Checkout-password-123!',
        role: 'admin',
      })
      adminId = admin.id
      const adminSession = await createStaffSession(adminId, {
        ipHash: 'checkout-ip',
        userAgent: 'Playwright',
      })

      await page.context().clearCookies()
      await page.goto('/painel/login')
      const url = new URL(page.url())
      await page.context().addCookies([
        {
          name: sessionCookieName,
          value: adminSession.token,
          domain: url.hostname,
          path: '/painel',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ])

      await page.goto('/painel/encomendas')
      await expect(page.getByText(orderNumber, {exact: false}).first()).toBeVisible()

      await page.goto(`/painel/encomendas/${orderId}`)
      await expect(page.getByText(email, {exact: false}).first()).toBeVisible()
      await expect(page.locator('#order-status')).toBeVisible()
    } finally {
      if (orderId) {
        await query('delete from order_status_events where order_id = $1', [orderId])
        await query('delete from order_items where order_id = $1', [orderId]).catch(() => undefined)
        await query('delete from orders where id = $1', [orderId])
      }
      if (adminId) {
        await query('delete from staff_activity_log where staff_id = $1', [adminId])
        await query('delete from staff_sessions where staff_id = $1', [adminId])
        await query('delete from staff_users where id = $1', [adminId])
      }
      await query(`delete from rate_limit_buckets where key like 'checkout:%'`).catch(() => undefined)
    }
  })
})
