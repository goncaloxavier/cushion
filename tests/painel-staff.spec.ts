import {expect, test, type Page} from '@playwright/test'
import {databaseConfigured, query} from '../src/lib/server/db'
import {
  authenticate as authenticateStaff,
  createSession as createStaffSession,
  createStaff,
  sessionCookieName,
} from '../src/lib/server/staff-auth'

/**
 * Staff administration, driven through the rendered forms.
 *
 * /painel/equipa had no test of any kind. It is the page that decides who can
 * reach the backoffice at all -- creating accounts, granting admin, revoking
 * access, resetting passwords -- so an error here is an access-control error,
 * not a cosmetic one. The existing suite covered the order and activity pages
 * and stopped short of this one.
 *
 * Every assertion goes through the browser because that is how the permission
 * actually reaches a person: a server function that refuses correctly is no use
 * if the page still renders the button.
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

test.describe('painel staff administration', () => {
  test('an admin creates, promotes and deactivates an account, and a non-admin cannot', async ({
    page,
    browserName,
  }, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Runs once against CI Postgres',
    )
    test.skip(!databaseConfigured(), 'Requires DATABASE_URL (CI supplies an ephemeral Postgres service)')

    const suffix = uniqueSuffix()
    const adminUser = `equipa-admin-${suffix}`
    const plainUser = `equipa-staff-${suffix}`
    const createdUser = `equipa-novo-${suffix}`
    const createdPassword = 'Equipa-password-123!'
    const rotatedPassword = 'Equipa-rotated-456!'
    const ids: string[] = []

    try {
      const admin = await createStaff({
        name: 'Equipa Admin',
        username: adminUser,
        password: 'Equipa-password-123!',
        role: 'admin',
      })
      ids.push(admin.id)
      const plain = await createStaff({
        name: 'Equipa Staff',
        username: plainUser,
        password: 'Equipa-password-123!',
        role: 'staff',
      })
      ids.push(plain.id)

      const adminSession = await createStaffSession(admin.id, {
        ipHash: 'equipa-ip',
        userAgent: 'Playwright',
      })
      await loginAs(page, adminSession.token)

      // Create an account through the real form.
      await page.goto('/painel/equipa')
      await expect(page.getByRole('heading', {name: 'Equipa'})).toBeVisible()
      await page.locator('input[name="name"]').fill('Conta Nova')
      await page.locator('input[name="username"]').fill(createdUser)
      await page.locator('input[name="password"]').fill(createdPassword)
      await page.locator('select[name="role"]').selectOption('staff')
      await page.getByRole('button', {name: 'Criar conta'}).click()

      await expect(page.getByText(`@${createdUser}`)).toBeVisible()
      const createdRow = await query<{id: string}>(
        'select id from staff_users where username = $1',
        [createdUser],
      )
      expect(createdRow.rows.length, 'the form did not create the account').toBe(1)
      const createdId = createdRow.rows[0]!.id
      ids.push(createdId)

      // The account it just created must actually be usable.
      expect(await authenticateStaff(createdUser, createdPassword)).not.toBeNull()

      // Promote to admin.
      await page.goto(`/painel/equipa/${createdId}`)
      await page.locator('select[name="role"]').selectOption('admin')
      await page.getByRole('button', {name: 'Guardar função'}).click()
      await expect(page.locator('select[name="role"]')).toHaveValue('admin')

      // Reset the password, and prove the old one stops working. A reset that
      // leaves the previous password valid is the failure worth catching here.
      await page.locator('input[name="password"]').fill(rotatedPassword)
      await page.getByRole('button', {name: 'Redefinir palavra-passe'}).click()
      await expect(page.getByRole('button', {name: 'Redefinir palavra-passe'})).toBeVisible()
      await expect
        .poll(async () => (await authenticateStaff(createdUser, rotatedPassword)) !== null, {
          timeout: 10_000,
        })
        .toBe(true)
      expect(await authenticateStaff(createdUser, createdPassword)).toBeNull()

      // Deactivate, and prove the credentials stop authenticating.
      await page.getByRole('button', {name: 'Desativar conta'}).click()
      await expect(page.getByRole('button', {name: 'Reativar conta'})).toBeVisible()
      expect(await authenticateStaff(createdUser, rotatedPassword)).toBeNull()

      // A non-admin is refused the page itself, not merely the actions on it.
      const plainSession = await createStaffSession(plain.id, {
        ipHash: 'equipa-ip',
        userAgent: 'Playwright',
      })
      await loginAs(page, plainSession.token)
      await page.goto('/painel/equipa')
      await expect(page.getByRole('heading', {name: 'Acesso restrito'})).toBeVisible()
      await expect(page.locator('input[name="username"]')).toHaveCount(0)

      await page.goto(`/painel/equipa/${createdId}`)
      await expect(page.getByRole('button', {name: 'Guardar função'})).toHaveCount(0)
    } finally {
      if (ids.length) {
        await query('delete from staff_activity_log where staff_id = any($1)', [ids])
        await query('delete from staff_sessions where staff_id = any($1)', [ids])
        await query('delete from staff_users where id = any($1)', [ids])
      }
    }
  })
})
