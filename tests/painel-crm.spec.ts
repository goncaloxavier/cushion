import {expect, test, type Page} from '@playwright/test'
import {storeContactSubmission} from '../src/lib/server/crm'
import {databaseConfigured, query} from '../src/lib/server/db'
import {
  createSession as createStaffSession,
  createStaff,
  sessionCookieName,
} from '../src/lib/server/staff-auth'

/**
 * Leads and client profiles, driven through the rendered forms.
 *
 * /painel/pedidos and /painel/perfis are where the day actually happens -- a
 * contact form arrives, someone sets a status and writes a note -- and neither
 * had a test beyond "redirects to login when signed out". The write paths were
 * only ever exercised by calling the server functions directly, which cannot
 * see that both pages disable every control for non-admin staff.
 *
 * That read-only rule is asserted here too. It is enforced in the markup with
 * `disabled`, so a server-side check alone would not notice if the attribute
 * were dropped, and staff would be handed buttons that fail when pressed.
 */
const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

const loginAs = async (page: Page, token: string) => {
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

const submitLead = async (email: string, message: string) => {
  const result = await storeContactSubmission({
    firstName: 'Lead',
    lastName: 'Playwright',
    name: 'Lead Playwright',
    email,
    phone: '912345678',
    address: 'Rua de Teste 1',
    postalCode: '1000-001',
    locality: 'Lisboa',
    message,
    marketingConsent: false,
    consentText: 'Aceito a política de privacidade',
    privacyConsent: true,
    language: 'pt',
    source: 'contact',
    sourcePath: '/contacto',
    ipAddress: '',
    userAgent: 'Playwright',
  })
  if (!result.ok) throw new Error(`could not seed a lead: ${result.message}`)
  return result.requestId
}

test.describe('painel leads and profiles', () => {
  test('an admin works a lead and its profile, and staff see them read-only', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Runs once against CI Postgres',
    )
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const email = `lead-${suffix}@example.test`
    const note = `Nota de teste ${suffix}`
    const ids: string[] = []
    let submissionId = ''
    let profileId = ''

    try {
      await query(`delete from rate_limit_buckets where key like 'crm-%'`)
      await submitLead(email, `Mensagem de teste ${suffix}`)

      const submission = await query<{id: string}>(
        'select id from crm_form_submissions where email = $1',
        [email],
      )
      expect(submission.rows.length, 'the contact form did not store a lead').toBe(1)
      submissionId = submission.rows[0]!.id

      const profile = await query<{id: string}>(
        'select id from crm_client_profiles where email = $1',
        [email],
      )
      expect(profile.rows.length, 'the lead did not produce a client profile').toBe(1)
      profileId = profile.rows[0]!.id

      const admin = await createStaff({
        name: 'CRM Admin',
        username: `crm-admin-${suffix}`,
        password: 'Crm-password-123!',
        role: 'admin',
      })
      ids.push(admin.id)
      const plain = await createStaff({
        name: 'CRM Staff',
        username: `crm-staff-${suffix}`,
        password: 'Crm-password-123!',
        role: 'staff',
      })
      ids.push(plain.id)

      const adminSession = await createStaffSession(admin.id, {
        ipHash: 'crm-ip',
        userAgent: 'Playwright',
      })
      await loginAs(page, adminSession.token)

      // The lead is reachable from the list, not only by its id.
      await page.goto('/painel/pedidos')
      await expect(page.getByText(email).first()).toBeVisible()

      await page.goto(`/painel/pedidos/${submissionId}`)
      await page.locator('#rec-status').selectOption('inProgress')
      await page.getByRole('button', {name: 'Guardar estado'}).click()
      await expect(page.locator('#rec-status')).toHaveValue('inProgress')

      await page.locator('textarea[name="note"]').fill(note)
      await page.getByRole('button', {name: 'Adicionar nota'}).click()
      await expect(page.getByText(note).first()).toBeVisible()

      // The same client, seen as a profile rather than as a single enquiry.
      await page.goto(`/painel/perfis/${profileId}`)
      await expect(page.getByText(email).first()).toBeVisible()
      await page.locator('select[name="status"]').selectOption('customer')
      await page.getByRole('button', {name: 'Guardar estado'}).click()
      await expect(page.locator('select[name="status"]')).toHaveValue('customer')

      const storedStatus = await query<{status: string}>(
        'select status from crm_client_profiles where id = $1',
        [profileId],
      )
      expect(storedStatus.rows[0]!.status).toBe('customer')

      // A change log has to say what it changed from. The lead went from Novo to
      // Em acompanhamento and the profile from Novo to Cliente, and the row that
      // records it should read as that movement rather than as a destination.
      await page.goto('/painel/atividade')
      await expect(
        page.locator('td[data-label="Detalhe"]').filter({hasText: 'Novo → Em acompanhamento'}).first(),
      ).toBeVisible()
      await expect(
        page.locator('td[data-label="Detalhe"]').filter({hasText: 'Novo → Cliente'}).first(),
      ).toBeVisible()

      // Every row of the activity log names the person or thing acted on in the
      // Entidade column and what changed in Detalhe. Both were being filled by
      // whichever value the call site happened to pass: the new status went into
      // Entidade, Detalhe was left empty, and rows with no label fell back to a
      // raw UUID. A log nobody can read is not an audit trail.
      await page.goto('/painel/atividade')
      const entityCells = page.locator('td[data-label="Entidade"]')
      const detailCells = page.locator('td[data-label="Detalhe"]')
      await expect(entityCells.first()).toBeVisible()

      const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const entities = await entityCells.allInnerTexts()
      const details = await detailCells.allInnerTexts()
      expect(entities.length).toBeGreaterThan(0)
      expect(entities.length).toBe(details.length)

      for (const [index, entity] of entities.entries()) {
        const value = entity.trim()
        expect(value, 'the Entidade column fell back to a raw identifier').not.toMatch(uuid)
        expect(value, 'an Entidade cell is empty').not.toBe('')
        expect(value, 'the Entidade column is showing a Sanity type name').not.toMatch(
          /^(sitePage|productCategory|storeProduct|storeCategory|caseStudy|blogPost|siteLanding)$/,
        )
        expect(details[index]!.trim(), `Detalhe is empty beside "${value}"`).not.toBe('-')
      }

      // Non-admin staff read both pages and can change nothing on either.
      const plainSession = await createStaffSession(plain.id, {
        ipHash: 'crm-ip',
        userAgent: 'Playwright',
      })
      await loginAs(page, plainSession.token)

      await page.goto(`/painel/pedidos/${submissionId}`)
      await expect(page.getByText(email).first()).toBeVisible()
      await expect(page.locator('#rec-status')).toBeDisabled()
      await expect(page.getByRole('button', {name: 'Guardar estado'})).toBeDisabled()
      await expect(page.locator('textarea[name="note"]')).toBeDisabled()

      await page.goto(`/painel/perfis/${profileId}`)
      await expect(page.locator('select[name="status"]')).toBeDisabled()
      await expect(page.getByRole('button', {name: 'Guardar estado'})).toBeDisabled()
    } finally {
      if (ids.length) {
        await query('delete from staff_activity_log where staff_id = any($1)', [ids])
        await query('delete from staff_sessions where staff_id = any($1)', [ids])
        await query('delete from staff_users where id = any($1)', [ids])
      }
      if (submissionId) await query('delete from crm_form_submissions where id = $1', [submissionId])
      if (profileId) await query('delete from crm_client_profiles where id = $1', [profileId])
      await query(`delete from rate_limit_buckets where key like 'crm-%'`)
    }
  })
})
