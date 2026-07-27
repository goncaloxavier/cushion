import type {Cookies} from '@sveltejs/kit'
import {databaseConfigured, query, withTransaction} from './db'
import {dummyHash, hashPassword, randomToken, tokenHashOf, verifyPassword} from './password-auth'

const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // sliding window, matches the previous Sanity-backed session length

export const sessionCookieName = 'df4y_painel_session'

export type StaffRole = 'admin' | 'staff'

export type StaffUser = {
  id: string
  name: string
  username: string
  role: StaffRole
}

export type StaffListRow = StaffUser & {
  active: boolean
  createdAt: string
  lastLoginAt: string | null
}

type StaffRow = {
  id: string
  name: string
  username: string
  role: string
}

const mapStaff = (row: StaffRow): StaffUser => ({
  id: row.id,
  name: row.name,
  username: row.username,
  role: row.role === 'admin' ? 'admin' : 'staff',
})

export const canManageStaff = (staff: StaffUser | null | undefined) => staff?.role === 'admin'

export const normalizeUsername = (value: string) => value.trim().toLowerCase()

export const authenticate = async (username: string, password: string): Promise<StaffUser | null> => {
  if (!databaseConfigured()) return null

  const result = await query<StaffRow & {active: boolean; password_hash: string | null}>(
    `select id, name, username, role, active, password_hash
     from staff_users
     where username = $1
     limit 1`,
    [normalizeUsername(username)],
  )
  const user = result.rows[0]

  const ok = await verifyPassword(password, user?.password_hash || dummyHash)
  if (!user || !user.active || !user.password_hash || !ok) return null

  await query('update staff_users set last_login_at = now() where id = $1', [user.id]).catch(() => undefined)

  return mapStaff(user)
}

export const createSession = async (
  staffId: string,
  input: {ipHash?: string; userAgent?: string} = {},
): Promise<{token: string; expiresAt: Date}> => {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await query(
    `insert into staff_sessions (staff_id, token_hash, expires_at, ip_hash, user_agent)
     values ($1, $2, $3, $4, $5)`,
    [staffId, tokenHashOf(token), expiresAt.toISOString(), input.ipHash ?? '', (input.userAgent ?? '').slice(0, 240)],
  )

  return {token, expiresAt}
}

export const setStaffSessionCookie = (cookies: Cookies, token: string, expiresAt: Date, secure: boolean) => {
  cookies.set(sessionCookieName, token, {
    path: '/painel',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: expiresAt,
  })
}

export const clearStaffSessionCookie = (cookies: Cookies, secure: boolean) => {
  cookies.delete(sessionCookieName, {
    path: '/painel',
    httpOnly: true,
    sameSite: 'lax',
    secure,
  })
}

export const validateSession = async (token: string | undefined): Promise<StaffUser | null> => {
  if (!token || !databaseConfigured()) return null

  let row: (StaffRow & {active: boolean; session_id: string; expires_at: string}) | undefined

  try {
    const result = await query<StaffRow & {active: boolean; session_id: string; expires_at: string}>(
      `select
         s.id as session_id,
         s.expires_at,
         u.id,
         u.name,
         u.username,
         u.role,
         u.active
       from staff_sessions s
       join staff_users u on u.id = s.staff_id
       where s.token_hash = $1
       limit 1`,
      [tokenHashOf(token)],
    )
    row = result.rows[0]
  } catch (error) {
    console.warn('Staff session validation failed; continuing as logged out.', error)
    return null
  }

  if (!row || !row.active) return null

  const remaining = new Date(row.expires_at).getTime() - Date.now()
  if (remaining <= 0) {
    await query('delete from staff_sessions where id = $1', [row.session_id]).catch(() => undefined)
    return null
  }

  // Sliding renewal, but only once past the halfway mark to avoid a write per request.
  if (remaining < SESSION_TTL_MS / 2) {
    await query('update staff_sessions set expires_at = $1 where id = $2', [
      new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      row.session_id,
    ]).catch(() => undefined)
  }

  return mapStaff(row)
}

export const destroySession = async (token: string | undefined) => {
  if (!token || !databaseConfigured()) return
  await query('delete from staff_sessions where token_hash = $1', [tokenHashOf(token)]).catch(() => undefined)
}

// ---- in-app staff account management (admin-only, enforced by callers via canManageStaff) ----

const mapStaffListRow = (
  row: StaffRow & {active: boolean; created_at: string; last_login_at: string | null},
): StaffListRow => ({
  ...mapStaff(row),
  active: row.active,
  createdAt: row.created_at,
  lastLoginAt: row.last_login_at,
})

export const listStaff = async (): Promise<StaffListRow[]> => {
  if (!databaseConfigured()) return []
  const result = await query<StaffRow & {active: boolean; created_at: string; last_login_at: string | null}>(
    `select id, name, username, role, active, created_at, last_login_at
     from staff_users
     order by created_at asc`,
  )
  return result.rows.map(mapStaffListRow)
}

export const getStaff = async (id: string): Promise<StaffListRow | null> => {
  if (!databaseConfigured()) return null
  const result = await query<StaffRow & {active: boolean; created_at: string; last_login_at: string | null}>(
    `select id, name, username, role, active, created_at, last_login_at
     from staff_users
     where id = $1
     limit 1`,
    [id],
  )
  return result.rows[0] ? mapStaffListRow(result.rows[0]) : null
}

export const findStaffByUsername = async (username: string): Promise<StaffListRow | null> => {
  if (!databaseConfigured()) return null
  const result = await query<StaffRow & {active: boolean; created_at: string; last_login_at: string | null}>(
    `select id, name, username, role, active, created_at, last_login_at
     from staff_users
     where username = $1
     limit 1`,
    [normalizeUsername(username)],
  )
  return result.rows[0] ? mapStaffListRow(result.rows[0]) : null
}

export const createStaff = async (input: {
  name: string
  username: string
  password: string
  role: StaffRole
}): Promise<StaffUser> => {
  const passwordHash = await hashPassword(input.password)
  const result = await query<StaffRow>(
    `insert into staff_users (name, username, password_hash, role)
     values ($1, $2, $3, $4)
     returning id, name, username, role`,
    [input.name.trim().slice(0, 160), normalizeUsername(input.username).slice(0, 120), passwordHash, input.role],
  )
  return mapStaff(result.rows[0])
}

export type StaffMutationError = 'self' | 'last-admin'
export type StaffMutationResult = {ok: true} | {ok: false; error: StaffMutationError}

export const updateStaffRole = async (
  actorId: string,
  targetId: string,
  role: StaffRole,
): Promise<StaffMutationResult> => {
  if (actorId === targetId) return {ok: false, error: 'self'}

  return withTransaction(async (client) => {
    await client.query(`select pg_advisory_xact_lock(hashtext('staff-active-admin-guard'))`)
    const targetResult = await client.query<{role: string; active: boolean}>(
      'select role, active from staff_users where id = $1 for update',
      [targetId],
    )
    const target = targetResult.rows[0]
    if (!target) return {ok: true as const}

    if (target.role === 'admin' && role !== 'admin' && target.active) {
      const admins = await client.query<{count: string}>(
        `select count(*)::text as count
         from staff_users
         where role = 'admin' and active = true and id != $1`,
        [targetId],
      )
      if (Number(admins.rows[0]?.count ?? '0') < 1) {
        return {ok: false as const, error: 'last-admin' as const}
      }
    }

    await client.query('update staff_users set role = $2, updated_at = now() where id = $1', [
      targetId,
      role,
    ])
    return {ok: true as const}
  })
}

export const setStaffActive = async (
  actorId: string,
  targetId: string,
  active: boolean,
): Promise<StaffMutationResult> => {
  if (actorId === targetId) return {ok: false, error: 'self'}

  return withTransaction(async (client) => {
    await client.query(`select pg_advisory_xact_lock(hashtext('staff-active-admin-guard'))`)
    const targetResult = await client.query<{role: string; active: boolean}>(
      'select role, active from staff_users where id = $1 for update',
      [targetId],
    )
    const target = targetResult.rows[0]
    if (!target) return {ok: true as const}

    if (target.role === 'admin' && !active && target.active) {
      const admins = await client.query<{count: string}>(
        `select count(*)::text as count
         from staff_users
         where role = 'admin' and active = true and id != $1`,
        [targetId],
      )
      if (Number(admins.rows[0]?.count ?? '0') < 1) {
        return {ok: false as const, error: 'last-admin' as const}
      }
    }

    await client.query('update staff_users set active = $2, updated_at = now() where id = $1', [
      targetId,
      active,
    ])
    return {ok: true as const}
  })
}

export const resetStaffPassword = async (targetId: string, password: string): Promise<void> => {
  const passwordHash = await hashPassword(password)
  await query('update staff_users set password_hash = $2, updated_at = now() where id = $1', [
    targetId,
    passwordHash,
  ])
  await query('delete from staff_sessions where staff_id = $1', [targetId]).catch(() => undefined)
}
