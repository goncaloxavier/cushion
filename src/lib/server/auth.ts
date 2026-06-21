import {createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions} from 'node:crypto'
import {crmClient, crmHashSecret, notDraft} from './crm-client'

const scrypt = (password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    // N=2^15 needs ~33MB, above Node's 32MB default maxmem — raise it.
    scryptCb(password, salt, keylen, {maxmem: 64 * 1024 * 1024, ...options}, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })

// scrypt parameters (OWASP baseline). Stored alongside the hash so they can be
// raised later without breaking existing passwords.
const SCRYPT_N = 2 ** 15
const SCRYPT_R = 8
const SCRYPT_P = 1
const SALT_LEN = 16
const KEY_LEN = 64

const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // sliding window

export const sessionCookieName = 'df4y_painel_session'

export type StaffUser = {_id: string; name: string; username: string; role: string}

// ---- rate limiting (per-instance, in-memory) ----
const rateBuckets = new Map<string, {count: number; resetAt: number}>()

export const rateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now()
  const current = rateBuckets.get(key)
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, {count: 1, resetAt: now + windowMs})
    return false
  }
  current.count += 1
  return current.count > limit
}

// ---- password hashing ----
// scrypt + per-user random salt (no global pepper) so hashes stay portable:
// an account created locally by the CLI verifies on the server regardless of
// env. Must stay byte-for-byte identical to scripts/create-staff.ts.
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LEN)
  const derived = (await scrypt(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })) as Buffer
  return ['scrypt', `${SCRYPT_N}.${SCRYPT_R}.${SCRYPT_P}`, salt.toString('base64'), derived.toString('base64')].join(
    '$',
  )
}

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false
  const [n, r, p] = parts[1].split('.').map(Number)
  if (!n || !r || !p) return false

  const salt = Buffer.from(parts[2], 'base64')
  const expected = Buffer.from(parts[3], 'base64')
  const derived = (await scrypt(password, salt, expected.length, {N: n, r, p})) as Buffer
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

// A valid-format hash with the standard cost, used to keep login timing uniform
// when an email is unknown (mitigates account enumeration).
const dummyHash = `scrypt$${SCRYPT_N}.${SCRYPT_R}.${SCRYPT_P}$${Buffer.alloc(SALT_LEN).toString(
  'base64',
)}$${Buffer.alloc(KEY_LEN).toString('base64')}`

export const normalizeUsername = (value: string) => value.trim().toLowerCase()

// ---- authentication ----
export const authenticate = async (username: string, password: string): Promise<StaffUser | null> => {
  const client = crmClient()
  if (!client) return null

  const user = await client.fetch<{
    _id: string
    name: string
    username: string
    role: string
    active?: boolean
    passwordHash?: string
  } | null>(
    `*[_type=="staffUser" && username==$u && ${notDraft}][0]{_id, name, username, role, active, passwordHash}`,
    {u: normalizeUsername(username)},
  )

  const ok = await verifyPassword(password, user?.passwordHash || dummyHash)
  if (!user || user.active === false || !user.passwordHash || !ok) return null

  await client
    .patch(user._id)
    .set({lastLoginAt: new Date().toISOString()})
    .commit()
    .catch(() => undefined)

  return {_id: user._id, name: user.name, username: user.username, role: user.role}
}

// ---- sessions (only the token hash is stored) ----
const tokenHashOf = (token: string) =>
  createHmac('sha256', crmHashSecret() || 'df4y-session-pepper').update(token).digest('hex')

export const createSession = async (
  userId: string,
  ipHash: string,
  userAgent: string,
): Promise<{token: string; expiresAt: string} | null> => {
  const client = crmClient()
  if (!client) return null

  const token = randomBytes(32).toString('base64url')
  const now = Date.now()
  const expiresAt = new Date(now + SESSION_TTL_MS).toISOString()

  await client.create({
    _id: `staffSession.${randomBytes(16).toString('hex')}`,
    _type: 'staffSession',
    tokenHash: tokenHashOf(token),
    user: {_type: 'reference', _ref: userId},
    createdAt: new Date(now).toISOString(),
    expiresAt,
    ...(ipHash ? {ipHash} : {}),
    userAgent: userAgent.slice(0, 240),
  })

  return {token, expiresAt}
}

export const validateSession = async (token: string | undefined): Promise<StaffUser | null> => {
  if (!token) return null
  const client = crmClient()
  if (!client) return null

  const session = await client.fetch<{
    _id: string
    expiresAt: string
    user: {_id: string; name: string; username: string; role: string; active?: boolean} | null
  } | null>(
    `*[_type=="staffSession" && tokenHash==$h && ${notDraft}][0]{
      _id, expiresAt, "user": user->{_id, name, username, role, active}
    }`,
    {h: tokenHashOf(token)},
  )

  if (!session || !session.user || session.user.active === false) return null

  const remaining = new Date(session.expiresAt).getTime() - Date.now()
  if (remaining <= 0) {
    await client.delete(session._id).catch(() => undefined)
    return null
  }

  // Sliding renewal, but only once past the halfway mark to avoid a write per request.
  if (remaining < SESSION_TTL_MS / 2) {
    await client
      .patch(session._id)
      .set({expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()})
      .commit()
      .catch(() => undefined)
  }

  const {user} = session
  return {_id: user._id, name: user.name, username: user.username, role: user.role}
}

export const destroySession = async (token: string | undefined) => {
  if (!token) return
  const client = crmClient()
  if (!client) return

  const ids = await client.fetch<string[]>(`*[_type=="staffSession" && tokenHash==$h]._id`, {
    h: tokenHashOf(token),
  })
  if (Array.isArray(ids) && ids.length) {
    await ids
      .reduce((tx, id) => tx.delete(id), client.transaction())
      .commit()
      .catch(() => undefined)
  }
}
