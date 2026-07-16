import {createHash, randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions} from 'node:crypto'

// Shared by customer-auth.ts and staff-auth.ts. Both account systems must
// hash passwords identically — a stored hash string is only ever verifiable
// by the exact params that produced it, so keeping this in one place makes
// that a structural guarantee instead of a comment-enforced convention.

const scrypt = (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, {maxmem: 64 * 1024 * 1024, ...options}, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey as Buffer)
    })
  })

const SCRYPT_N = 2 ** 15
const SCRYPT_R = 8
const SCRYPT_P = 1
const SALT_LEN = 16
const KEY_LEN = 64

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

// A valid-format hash with all-zero salt/derived bytes, verified against on
// unknown usernames/emails so failed-login timing doesn't reveal whether the
// account exists.
export const dummyHash = `scrypt$${SCRYPT_N}.${SCRYPT_R}.${SCRYPT_P}$${Buffer.alloc(SALT_LEN).toString(
  'base64',
)}$${Buffer.alloc(KEY_LEN).toString('base64')}`

export const tokenHashOf = (token: string) => createHash('sha256').update(token).digest('hex')

export const randomToken = () => randomBytes(32).toString('base64url')
