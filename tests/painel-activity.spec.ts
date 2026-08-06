import {expect, test} from '@playwright/test'
import {databaseConfigured, query} from '../src/lib/server/db'
import {
  createSession as createStaffSession,
  createStaff,
  sessionCookieName,
} from '../src/lib/server/staff-auth'

/**
 * The activity log, read by someone who does not write software.
 *
 * Correcting the call sites only corrects rows written afterwards. Every row
 * already recorded still holds what the old scheme put there — a bare UUID, or
 * a Sanity type name like `productCategory` — so this seeds exactly those rows
 * and asserts the page refuses to print any of it. The client cannot be asked
 * to know what a document type is.
 */
const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

test.describe('painel activity log', () => {
  test('never shows an identifier or a type name, however the row was recorded', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Runs once against CI Postgres',
    )
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    let adminId = ''

    try {
      const admin = await createStaff({
        name: 'Atividade Admin',
        username: `atividade-${suffix}`,
        password: 'Atividade-password-123!',
        role: 'admin',
      })
      adminId = admin.id

      // Rows in the shape the old code wrote them.
      const legacyRows: Array<[string, string, string, string, string]> = [
        ['order.note', 'order', '7f3a1c2e-9d4b-4a51-8b7c-0e1f2a3b4c5d', '', 'Cliente pediu fatura'],
        ['site.publish', 'siteDocument', 'productCategory-compostores', 'productCategory', ''],
        ['site.delete', 'siteDocument', 'drafts.sitePage-abc12345', '', ''],
        ['lead.status', 'submission', 'a1b2c3d4-e5f6-4711-8899-aabbccddeeff', 'Em acompanhamento', ''],
        ['mystery.action', 'profile', 'b2c3d4e5-f6a7-4811-99aa-bbccddeeff00', '', ''],
      ]
      for (const [action, entityType, entityId, entityLabel, detail] of legacyRows) {
        await query(
          `insert into staff_activity_log
             (staff_id, staff_name, staff_role, action, entity_type, entity_id, entity_label, detail)
           values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [admin.id, admin.name, 'admin', action, entityType, entityId, entityLabel, detail],
        )
      }

      const session = await createStaffSession(admin.id, {
        ipHash: 'atividade-ip',
        userAgent: 'Playwright',
      })
      await page.context().clearCookies()
      await page.goto('/painel/login')
      const url = new URL(page.url())
      await page.context().addCookies([
        {
          name: sessionCookieName,
          value: session.token,
          domain: url.hostname,
          path: '/painel',
          httpOnly: true,
          secure: false,
          sameSite: 'Lax',
        },
      ])

      await page.goto('/painel/atividade')
      await expect(page.getByRole('heading', {name: 'Atividade'})).toBeVisible()

      const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
      const entities = await page.locator('td[data-label="Entidade"]').allInnerTexts()
      const actions = await page.locator('td[data-label="Ação"]').allInnerTexts()
      expect(entities.length).toBeGreaterThanOrEqual(legacyRows.length)

      for (const cell of entities) {
        const value = cell.trim()
        expect(value, 'an Entidade cell is empty').not.toBe('')
        expect(value, `Entidade shows a raw identifier: ${value}`).not.toMatch(uuid)
        expect(value, `Entidade shows a Sanity type name: ${value}`).not.toMatch(
          /^(sitePage|productCategory|storeProduct|storeCategory|caseStudy|blogPost|siteLanding)$/,
        )
        expect(value, `Entidade shows a document id: ${value}`).not.toMatch(/^drafts\./)
      }

      // An action nobody mapped must not print its dotted key either.
      for (const cell of actions) {
        expect(cell.trim(), `Ação shows a code: ${cell}`).not.toMatch(/^[a-z]+\.[a-z_]+$/)
      }

      // The fallbacks say what kind of thing the row is about.
      expect(entities.map((value) => value.trim())).toEqual(
        expect.arrayContaining(['Encomenda', 'Produto', 'Conteúdo do site', 'Pedido de contacto']),
      )

      // The old scheme put the status in Entidade and left Detalhe empty. That
      // row is not in code, but it is in the wrong column, so the two are put
      // back in order for display: the lead is named, and "Em curso" is the
      // detail it always should have been.
      const details = await page.locator('td[data-label="Detalhe"]').allInnerTexts()
      const rows = entities.map((entity, index) => [entity.trim(), details[index]!.trim()])
      expect(rows).toContainEqual(['Pedido de contacto', 'Em acompanhamento'])
      expect(rows.map(([entity]) => entity)).not.toContain('Em acompanhamento')
    } finally {
      if (adminId) {
        await query('delete from staff_activity_log where staff_id = $1', [adminId])
        await query('delete from staff_sessions where staff_id = $1', [adminId])
        await query('delete from staff_users where id = $1', [adminId])
      }
    }
  })
})
