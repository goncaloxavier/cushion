import {expect, test, type Page} from '@playwright/test'
import {createCustomer} from '../src/lib/server/customer-auth'
import {databaseConfigured, query} from '../src/lib/server/db'

/**
 * The two forms that produce the client's leads, and the ways a login is
 * supposed to fail.
 *
 * /catalogo and /contacto are where enquiries actually come from -- the
 * "Pedir orçamento" buttons all route to /contacto with a source -- and neither
 * had a test that pressed the button. A lead that is silently dropped is
 * invisible to everyone until the client wonders why the phone stopped ringing.
 *
 * The login cases matter for the opposite reason: they must fail. An unverified
 * account that can sign in, or a wrong password that is accepted, is not a bug
 * anyone sees until it is exploited.
 */
const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const clearLeadLimits = () =>
  query(`delete from rate_limit_buckets where key like 'crm-%' or key like 'login%'`)

const fillContactFields = async (page: Page, email: string, message: string) => {
  const fields: Array<[string, string]> = [
    ['firstName', 'Cliente'],
    ['lastName', 'Playwright'],
    ['email', email],
    ['phone', '912345678'],
    ['address', 'Rua de Teste 1'],
    ['postalCode', '1000-001'],
    ['locality', 'Lisboa'],
    ['message', message],
  ]
  for (const [name, value] of fields) {
    const input = page.locator(`[name="${name}"]`).first()
    if ((await input.count()) === 0) continue
    await input.fill(value)
    // These inputs are bound to component state, so a fill landing before
    // hydration is discarded and the submit button stays disabled.
    await expect(input).toHaveValue(value)
  }
  const privacy = page.locator('input[name="privacyConsent"]')
  await privacy.check()
  await expect(privacy).toBeChecked()
}

test.describe('lead forms', () => {
  test('the catálogo and orçamento forms both produce a lead the backoffice can see', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Runs once against CI Postgres',
    )
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const catalogueEmail = `catalogo-${suffix}@example.test`
    const quoteEmail = `orcamento-${suffix}@example.test`

    try {
      await clearLeadLimits()

      // Catálogo. The button stays disabled until every field is filled, so
      // reaching an enabled submit is itself part of what is under test.
      await page.goto('/catalogo?lang=pt')
      await page.waitForLoadState('networkidle')
      await fillContactFields(page, catalogueEmail, `Pedido de catálogo ${suffix}`)
      const catalogueSubmit = page.locator('form.catalogue-form button[type="submit"]')
      await expect(catalogueSubmit).toBeEnabled()
      await catalogueSubmit.click()
      await expect(page.locator('.form-feedback')).toBeVisible()

      const catalogueLead = await query<{source: string; message: string}>(
        'select source, message from crm_form_submissions where email = $1',
        [catalogueEmail],
      )
      expect(catalogueLead.rows.length, 'the catálogo form stored no lead').toBe(1)
      expect(catalogueLead.rows[0]!.source).toBe('catalogue')

      // Orçamento. Every "Pedir orçamento" button lands on /contacto carrying a
      // source, and that source is how the client tells a quote request from a
      // general enquiry -- so it has to survive the round trip.
      await page.goto('/contacto?source=produto&lang=pt')
      await page.waitForLoadState('networkidle')
      await fillContactFields(page, quoteEmail, `Pedido de orçamento ${suffix}`)
      const quoteSubmit = page.locator('form button[type="submit"]').last()
      await expect(quoteSubmit).toBeEnabled()
      await quoteSubmit.click()
      await expect(page.locator('.form-feedback')).toBeVisible()

      const quoteLead = await query<{source: string}>(
        'select source from crm_form_submissions where email = $1',
        [quoteEmail],
      )
      expect(quoteLead.rows.length, 'the orçamento form stored no lead').toBe(1)
      expect(quoteLead.rows[0]!.source, 'the quote lost the source it came from').toBe('product')
    } finally {
      await query('delete from crm_form_submissions where email = any($1)', [
        [catalogueEmail, quoteEmail],
      ])
      await query('delete from crm_client_profiles where email = any($1)', [
        [catalogueEmail, quoteEmail],
      ])
      await clearLeadLimits()
    }
  })
})

test.describe('customer login failures', () => {
  test('a wrong password and an unverified account are both refused', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Runs once against CI Postgres',
    )
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const verifiedEmail = `login-ok-${suffix}@example.test`
    const unverifiedEmail = `login-pending-${suffix}@example.test`
    const password = 'Login-password-123!'
    const customerIds: string[] = []

    const attemptSignIn = async (email: string, secret: string) => {
      await page.context().clearCookies()
      await page.goto('/conta/entrar?lang=pt')
      await page.waitForLoadState('networkidle')
      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')
      await emailInput.fill(email)
      await passwordInput.fill(secret)
      await expect(emailInput).toHaveValue(email)
      await expect(passwordInput).toHaveValue(secret)
      await page.getByRole('button', {name: 'Entrar', exact: true}).click()
    }

    try {
      await clearLeadLimits()

      const verified = await createCustomer({
        email: verifiedEmail,
        password,
        name: 'Login Verificado',
      })
      const unverified = await createCustomer({
        email: unverifiedEmail,
        password,
        name: 'Login Pendente',
      })
      customerIds.push(verified.id, unverified.id)
      await query('update customers set email_verified_at = now() where id = $1', [verified.id])

      // A wrong password never reaches the account area.
      await attemptSignIn(verifiedEmail, 'Definitely-not-it-999!')
      await expect(page).toHaveURL(/\/conta\/entrar/)
      await expect(page.locator('.form-feedback')).toBeVisible()
      await expect(page.locator('body')).not.toContainText('A sua conta')

      // Neither does an account whose e-mail was never confirmed, even with the
      // correct password.
      await attemptSignIn(unverifiedEmail, password)
      await expect(page).toHaveURL(/\/conta\/entrar/)
      await expect(page.locator('.form-feedback')).toBeVisible()

      // The same credentials on a verified account do get in, so the two
      // refusals above are the rule being applied rather than the form being
      // broken for everyone.
      await attemptSignIn(verifiedEmail, password)
      await expect(page).toHaveURL(/\/conta\/dados/)
    } finally {
      if (customerIds.length) {
        await query('delete from customers where id = any($1)', [customerIds])
      }
      await clearLeadLimits()
    }
  })
})
