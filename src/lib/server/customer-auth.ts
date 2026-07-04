import {
  createHash,
  randomBytes,
  scrypt as scryptCb,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'
import type {Cookies} from '@sveltejs/kit'
import {databaseConfigured, query, withTransaction} from './db'

const scrypt = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, {maxmem: 64 * 1024 * 1024, ...options}, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey)
    })
  })

const SCRYPT_N = 2 ** 15
const SCRYPT_R = 8
const SCRYPT_P = 1
const SALT_LEN = 16
const KEY_LEN = 64
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000

export const customerSessionCookieName = 'df4y_customer_session'

export type CustomerUser = {
  id: string
  email: string
  name: string
  phone: string
  nif: string
  purchaseType: string
  emailVerifiedAt: string | null
}

type CustomerRow = {
  id: string
  email: string
  name: string
  phone: string
  nif: string
  purchase_type: string
  email_verified_at: string | null
}

const mapCustomer = (row: CustomerRow): CustomerUser => ({
  id: row.id,
  email: row.email,
  name: row.name ?? '',
  phone: row.phone ?? '',
  nif: row.nif ?? '',
  purchaseType: row.purchase_type ?? 'individual',
  emailVerifiedAt: row.email_verified_at,
})

const rateBuckets = new Map<string, {count: number; resetAt: number}>()

export const customerRateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now()
  const current = rateBuckets.get(key)
  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, {count: 1, resetAt: now + windowMs})
    return false
  }
  current.count += 1
  return current.count > limit
}

export const normalizeCustomerEmail = (value: string) => value.trim().toLowerCase()

export const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254

export const normalizePhoneForCustomer = (value: string) => value.replace(/[^\d+]/g, '').slice(0, 32)

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(SALT_LEN)
  const derived = await scrypt(password, salt, KEY_LEN, {N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P})
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
  const derived = await scrypt(password, salt, expected.length, {N: n, r, p})
  return derived.length === expected.length && timingSafeEqual(derived, expected)
}

const dummyHash = `scrypt$${SCRYPT_N}.${SCRYPT_R}.${SCRYPT_P}$${Buffer.alloc(SALT_LEN).toString(
  'base64',
)}$${Buffer.alloc(KEY_LEN).toString('base64')}`

export const tokenHashOf = (token: string) => createHash('sha256').update(token).digest('hex')

const randomToken = () => randomBytes(32).toString('base64url')

export const findCustomerByEmail = async (email: string) => {
  if (!databaseConfigured()) return null
  const result = await query<(CustomerRow & {password_hash: string | null})>(
    `select id, email, name, phone, nif, purchase_type, email_verified_at, password_hash
     from customers
     where email_normalized = $1
     limit 1`,
    [normalizeCustomerEmail(email)],
  )
  return result.rows[0] ?? null
}

export const createCustomer = async (input: {
  email: string
  password: string
  name: string
  phone?: string
  nif?: string
  purchaseType?: string
}) => {
  const email = input.email.trim()
  const emailNormalized = normalizeCustomerEmail(email)
  const passwordHash = await hashPassword(input.password)

  const result = await query<CustomerRow>(
    `insert into customers (email, email_normalized, password_hash, name, phone, nif, purchase_type)
     values ($1, $2, $3, $4, $5, $6, $7)
     returning id, email, name, phone, nif, purchase_type, email_verified_at`,
    [
      email,
      emailNormalized,
      passwordHash,
      input.name.trim().slice(0, 160),
      normalizePhoneForCustomer(input.phone ?? ''),
      (input.nif ?? '').replace(/\D/g, '').slice(0, 16),
      input.purchaseType === 'company' ? 'company' : 'individual',
    ],
  )

  return mapCustomer(result.rows[0])
}

export const authenticateCustomer = async (email: string, password: string) => {
  const row = await findCustomerByEmail(email)
  const ok = await verifyPassword(password, row?.password_hash || dummyHash)
  if (!row || !row.password_hash || !ok) return null
  return mapCustomer(row)
}

export const createCustomerSession = async (
  customerId: string,
  input: {ipHash?: string; userAgent?: string} = {},
) => {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await query(
    `insert into customer_sessions (customer_id, token_hash, expires_at, ip_hash, user_agent)
     values ($1, $2, $3, $4, $5)`,
    [customerId, tokenHashOf(token), expiresAt.toISOString(), input.ipHash ?? '', (input.userAgent ?? '').slice(0, 240)],
  )

  return {token, expiresAt}
}

export const setCustomerSessionCookie = (
  cookies: Cookies,
  token: string,
  expiresAt: Date,
  secure: boolean,
) => {
  cookies.set(customerSessionCookieName, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: expiresAt,
  })
}

export const clearCustomerSessionCookie = (cookies: Cookies, secure: boolean) => {
  cookies.delete(customerSessionCookieName, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
  })
}

export const validateCustomerSession = async (token: string | undefined) => {
  if (!token || !databaseConfigured()) return null

  const result = await query<
    CustomerRow & {
      session_id: string
      expires_at: string
    }
  >(
    `select
       s.id as session_id,
       s.expires_at,
       c.id,
       c.email,
       c.name,
       c.phone,
       c.nif,
       c.purchase_type,
       c.email_verified_at
     from customer_sessions s
     join customers c on c.id = s.customer_id
     where s.token_hash = $1
     limit 1`,
    [tokenHashOf(token)],
  )
  const row = result.rows[0]
  if (!row) return null

  const remaining = new Date(row.expires_at).getTime() - Date.now()
  if (remaining <= 0) {
    await query('delete from customer_sessions where id = $1', [row.session_id]).catch(() => undefined)
    return null
  }

  if (!row.email_verified_at) {
    await query('delete from customer_sessions where id = $1', [row.session_id]).catch(() => undefined)
    return null
  }

  if (remaining < SESSION_TTL_MS / 2) {
    await query('update customer_sessions set expires_at = $1 where id = $2', [
      new Date(Date.now() + SESSION_TTL_MS).toISOString(),
      row.session_id,
    ]).catch(() => undefined)
  }

  return mapCustomer(row)
}

export const destroyCustomerSession = async (token: string | undefined) => {
  if (!token || !databaseConfigured()) return
  await query('delete from customer_sessions where token_hash = $1', [tokenHashOf(token)]).catch(() => undefined)
}

export const createEmailVerificationToken = async (customerId: string) => {
  const token = randomToken()
  await query(
    `insert into email_verification_tokens (customer_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [customerId, tokenHashOf(token), new Date(Date.now() + EMAIL_TOKEN_TTL_MS).toISOString()],
  )
  return token
}

export const verifyCustomerEmailToken = async (token: string) => {
  const hash = tokenHashOf(token)
  return withTransaction(async (client) => {
    const found = await client.query<{id: string; customer_id: string}>(
      `select id, customer_id
       from email_verification_tokens
       where token_hash = $1 and used_at is null and expires_at > now()
       limit 1`,
      [hash],
    )
    const row = found.rows[0]
    if (!row) return {ok: false as const, customerId: ''}

    await client.query('update email_verification_tokens set used_at = now() where id = $1', [row.id])
    await client.query('update customers set email_verified_at = now(), updated_at = now() where id = $1', [
      row.customer_id,
    ])
    return {ok: true as const, customerId: row.customer_id}
  })
}

export const createPasswordResetToken = async (customerId: string) => {
  const token = randomToken()
  await query(
    `insert into password_reset_tokens (customer_id, token_hash, expires_at)
     values ($1, $2, $3)`,
    [customerId, tokenHashOf(token), new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString()],
  )
  return token
}

export const resetCustomerPasswordWithToken = async (token: string, password: string) => {
  const passwordHash = await hashPassword(password)
  const hash = tokenHashOf(token)

  return withTransaction(async (client) => {
    const found = await client.query<{id: string; customer_id: string}>(
      `select id, customer_id
       from password_reset_tokens
       where token_hash = $1 and used_at is null and expires_at > now()
       limit 1`,
      [hash],
    )
    const row = found.rows[0]
    if (!row) return false

    await client.query('update password_reset_tokens set used_at = now() where id = $1', [row.id])
    await client.query('update customers set password_hash = $1, updated_at = now() where id = $2', [
      passwordHash,
      row.customer_id,
    ])
    await client.query('delete from customer_sessions where customer_id = $1', [row.customer_id])
    return true
  })
}
