import {databaseConfigured, withTransaction} from './db'
import {hashPassword} from './password-auth'
import {normalizeUsername} from './staff-auth'

const PREVIEW_ADMIN_MARKER = 'preview-bootstrap-admin'

export type PreviewAdminConfig = {
  enabled: boolean
  name: string
  username: string
  password: string
}

export type PreviewAdminSyncResult =
  | 'ready'
  | 'disabled'
  | 'database-unavailable'
  | 'missing-password'
  | 'invalid-username'
  | 'username-taken'

export const previewAdminConfig = (
  source: NodeJS.ProcessEnv = process.env,
): PreviewAdminConfig => ({
  enabled: source.PREVIEW_ADMIN_ENABLED === 'true',
  name: (source.PREVIEW_ADMIN_NAME || 'Administrador de preview').trim().slice(0, 160),
  username: normalizeUsername(source.PREVIEW_ADMIN_USERNAME || 'admin').slice(0, 120),
  password: source.PREVIEW_ADMIN_PASSWORD || '',
})

export const syncPreviewAdminPolicy = async (
  config: PreviewAdminConfig = previewAdminConfig(),
  marker = PREVIEW_ADMIN_MARKER,
): Promise<PreviewAdminSyncResult> => {
  if (!databaseConfigured()) return 'database-unavailable'

  if (!config.enabled) {
    await withTransaction(async (client) => {
      const disabled = await client.query<{id: string}>(
        `update staff_users
         set active = false, updated_at = now()
         where legacy_sanity_id = $1 and active = true
         returning id`,
        [marker],
      )

      if (disabled.rows[0]) {
        await client.query('delete from staff_sessions where staff_id = $1', [disabled.rows[0].id])
      }
    })
    return 'disabled'
  }

  if (!config.username) return 'invalid-username'
  if (!config.password) return 'missing-password'

  const passwordHash = await hashPassword(config.password.slice(0, 200))

  return withTransaction(async (client) => {
    const existing = await client.query<{legacy_sanity_id: string | null}>(
      `select legacy_sanity_id
       from staff_users
       where username = $1
       limit 1`,
      [config.username],
    )

    if (existing.rows[0] && existing.rows[0].legacy_sanity_id !== marker) {
      return 'username-taken'
    }

    await client.query(
      `insert into staff_users (
         name, username, password_hash, role, active, legacy_sanity_id
       ) values ($1, $2, $3, 'admin', true, $4)
       on conflict (legacy_sanity_id) do update set
         name = excluded.name,
         username = excluded.username,
         password_hash = excluded.password_hash,
         role = 'admin',
         active = true,
         updated_at = now()`,
      [config.name || 'Administrador de preview', config.username, passwordHash, marker],
    )

    return 'ready'
  })
}

let policyPromise: Promise<void> | null = null

export const applyPreviewAdminPolicy = async (): Promise<void> => {
  if (policyPromise) return policyPromise

  policyPromise = syncPreviewAdminPolicy()
    .then((result) => {
      if (result === 'ready') {
        console.warn(
          'Preview administrator enabled. Disable PREVIEW_ADMIN_ENABLED before a production launch.',
        )
      } else if (result === 'missing-password') {
        console.warn('PREVIEW_ADMIN_ENABLED is true, but PREVIEW_ADMIN_PASSWORD is empty.')
      } else if (result === 'invalid-username') {
        console.warn('PREVIEW_ADMIN_USERNAME must contain a valid username.')
      } else if (result === 'username-taken') {
        console.warn('The preview administrator username belongs to a normal staff account; it was not changed.')
      }
    })
    .catch((error) => {
      policyPromise = null
      console.warn('Preview administrator policy could not be applied.', error)
    })

  return policyPromise
}
