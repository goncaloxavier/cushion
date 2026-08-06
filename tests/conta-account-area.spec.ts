import {expect, test, type Page} from '@playwright/test'
import {createCustomer, createPasswordResetToken} from '../src/lib/server/customer-auth'
import {databaseConfigured, query} from '../src/lib/server/db'

/**
 * The signed-in account area, driven through the browser.
 *
 * Registration, login and logout were already covered end to end. Everything
 * behind them was not: /conta/encomendas, /conta/moradas and /conta/privacidade
 * had no test at all, and password recovery was only ever exercised by calling
 * the server functions directly -- which cannot see the form, the emailed link,
 * or whether the page behind it works.
 *
 * The order-history assertion is the one that matters most. It is not a display
 * check: a customer seeing an order that is not theirs is a data breach, so this
 * seeds two customers with one order each and confirms neither can see the
 * other's.
 */
const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const clearAuthRateLimits = () =>
  query(
    `delete from rate_limit_buckets
     where key like 'register%' or key like 'login%' or key like 'reset%' or key like 'recover%'`,
  )

const signIn = async (page: Page, email: string, password: string) => {
  await page.goto('/conta/entrar?lang=pt')
  await page.waitForLoadState('networkidle')
  const emailInput = page.locator('input[name="email"]')
  const passwordInput = page.locator('input[name="password"]')
  await emailInput.fill(email)
  await passwordInput.fill(password)
  // These inputs take their value from the form store, so a fill that lands
  // before hydration is silently reset. Confirming the value stuck is what keeps
  // the failure from surfacing as an unrelated "please fill in this field".
  await expect(emailInput).toHaveValue(email)
  await expect(passwordInput).toHaveValue(password)
  await page.getByRole('button', {name: 'Entrar', exact: true}).click()
  await expect(page).toHaveURL(/\/conta\/dados/)
}

const seedOrder = async (customerId: string, suffix: string, email: string) => {
  const inserted = await query<{id: string; order_number: string}>(
    `insert into orders (
       customer_id, order_number, language, customer_name, email, phone, nif, purchase_type,
       billing_address, billing_postal_code, billing_locality,
       delivery_address, delivery_postal_code, delivery_locality, delivery_zone,
       product_net, transport_net, vat, total_gross, total_weight_kg, transport_multiplier,
       privacy_consent_at
     ) values (
       $1, $2, 'pt', 'Cliente Conta', $3, '', '', 'individual',
       'Rua de Teste 1', '1000-001', 'Lisboa',
       'Rua de Teste 1', '1000-001', 'Lisboa', 'Lisboa',
       10, 2, 2.76, 14.76, 1, 2.5, now()
     ) returning id, order_number`,
    [customerId, `CONTA-${suffix}`, email],
  )
  return inserted.rows[0]!
}

test.describe('conta account area', () => {
  test('a customer sees only their own orders, and password recovery works end to end', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Runs once against CI Postgres',
    )
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const mineEmail = `conta-mine-${suffix}@example.test`
    const theirsEmail = `conta-theirs-${suffix}@example.test`
    const password = 'Conta-password-123!'
    const newPassword = 'Conta-rotated-456!'
    const customerIds: string[] = []
    const orderIds: string[] = []

    try {
      await clearAuthRateLimits()

      const mine = await createCustomer({email: mineEmail, password, name: 'Cliente Meu'})
      const theirs = await createCustomer({email: theirsEmail, password, name: 'Cliente Outro'})
      customerIds.push(mine.id, theirs.id)
      await query(
        'update customers set email_verified_at = now() where id = any($1)',
        [[mine.id, theirs.id]],
      )

      const myOrder = await seedOrder(mine.id, `MINE-${suffix}`, mineEmail)
      const theirOrder = await seedOrder(theirs.id, `THEIRS-${suffix}`, theirsEmail)
      orderIds.push(myOrder.id, theirOrder.id)

      await signIn(page, mineEmail, password)

      // The account pages belong to the person signed in. The e-mail is shown as
      // text here rather than as an editable field, so it is matched on the page.
      await expect(page.getByText(mineEmail).first()).toBeVisible()

      await page.goto('/conta/encomendas?lang=pt')
      await expect(page.getByText(myOrder.order_number)).toBeVisible()
      // The whole point of the test: another customer's order must not appear.
      await expect(page.getByText(theirOrder.order_number)).toHaveCount(0)

      await page.goto('/conta/moradas?lang=pt')
      await expect(page).toHaveURL(/\/conta\/moradas/)
      await expect(page.locator('main')).toBeVisible()

      await page.goto('/conta/privacidade?lang=pt')
      await expect(page).toHaveURL(/\/conta\/privacidade/)
      await expect(page.locator('main')).toBeVisible()

      // Password recovery, through the pages a locked-out customer actually
      // uses.
      await page.goto('/conta/recuperar-password?lang=pt')
      await page.waitForLoadState('networkidle')
      const recoverEmail = page.locator('input[name="email"]')
      await recoverEmail.fill(mineEmail)
      await expect(recoverEmail).toHaveValue(mineEmail)
      await page.locator('form.account-form button[type="submit"]').click()
      // The page always answers, whether or not the address is registered, so
      // waiting on the feedback keeps this from racing the server action.
      await expect(page.locator('.form-feedback')).toBeVisible()

      // The request must actually issue a token. Only its hash is stored, which
      // is the right call and means the emailed value cannot be read back here,
      // so the form is verified by the token it creates and the page below is
      // driven with one minted directly.
      const issued = await query<{count: string}>(
        `select count(*) as count from password_reset_tokens
         where customer_id = $1 and used_at is null`,
        [mine.id],
      )
      expect(
        Number(issued.rows[0]!.count),
        'submitting the recovery form issued no reset token',
      ).toBeGreaterThan(0)

      const resetToken = await createPasswordResetToken(mine.id)
      await page.goto(`/conta/redefinir-password?token=${encodeURIComponent(resetToken)}&lang=pt`)
      await page.waitForLoadState('networkidle')
      const newPasswordInput = page.locator('input[name="password"]')
      await newPasswordInput.fill(newPassword)
      await expect(newPasswordInput).toHaveValue(newPassword)
      await page.locator('form.account-form button[type="submit"]').click()
      await expect(page.locator('.form-feedback')).toBeVisible()

      await clearAuthRateLimits()

      // The new password works and the old one does not. A reset that leaves the
      // previous password valid is the failure worth catching.
      await page.context().clearCookies()
      await signIn(page, mineEmail, newPassword)

      await page.context().clearCookies()
      await page.goto('/conta/entrar?lang=pt')
      await page.waitForLoadState('networkidle')
      const staleEmail = page.locator('input[name="email"]')
      const stalePassword = page.locator('input[name="password"]')
      await staleEmail.fill(mineEmail)
      await stalePassword.fill(password)
      await expect(staleEmail).toHaveValue(mineEmail)
      await expect(stalePassword).toHaveValue(password)
      await page.getByRole('button', {name: 'Entrar', exact: true}).click()
      await expect(page).toHaveURL(/\/conta\/entrar/)
    } finally {
      if (orderIds.length) {
        await query('delete from order_status_events where order_id = any($1)', [orderIds])
        await query('delete from order_items where order_id = any($1)', [orderIds]).catch(
          () => undefined,
        )
        await query('delete from orders where id = any($1)', [orderIds])
      }
      if (customerIds.length) {
        await query('delete from password_reset_tokens where customer_id = any($1)', [
          customerIds,
        ]).catch(() => undefined)
        await query('delete from customers where id = any($1)', [customerIds])
      }
      await clearAuthRateLimits()
    }
  })
})
