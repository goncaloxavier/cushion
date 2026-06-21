import {createHash, randomBytes, scrypt as scryptCb, type ScryptOptions} from 'node:crypto'
import {createClient} from '@sanity/client'

// Creates (or updates the password of) a /painel staff account in the private
// crm dataset. Run locally:
//   SANITY_CRM_WRITE_TOKEN=... npm run staff:create -- --name "Ana" --username ana --password 'secret'
// Password hashing MUST stay identical to src/lib/server/auth.ts (scrypt, no pepper).

const scrypt = (password: string, salt: Buffer, keylen: number, options: ScryptOptions): Promise<Buffer> =>
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

const hashPassword = async (password: string) => {
  const salt = randomBytes(SALT_LEN)
  const derived = (await scrypt(password, salt, KEY_LEN, {N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P})) as Buffer
  return ['scrypt', `${SCRYPT_N}.${SCRYPT_R}.${SCRYPT_P}`, salt.toString('base64'), derived.toString('base64')].join(
    '$',
  )
}

const arg = (name: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? process.argv[index + 1] : undefined
}

const name = arg('name')
const username = arg('username')?.trim().toLowerCase()
const password = arg('password') ?? process.env.STAFF_PASSWORD
const role = arg('role') ?? 'admin'

const token = process.env.SANITY_CRM_WRITE_TOKEN
const dataset = process.env.SANITY_CRM_DATASET || 'crm'

if (!token) throw new Error('Set SANITY_CRM_WRITE_TOKEN in the environment.')
if (!name || !username || !password) {
  throw new Error('Usage: npm run staff:create -- --name "Nome" --username nome --password "secret"')
}
if (!/^[a-z0-9._-]{3,}$/.test(username)) {
  throw new Error('Username must be 3+ chars: lowercase letters, numbers, dot, dash or underscore.')
}
if (password.length < 10) throw new Error('Password must be at least 10 characters.')

const client = createClient({projectId: 'u4uyfix8', dataset, apiVersion: '2026-06-10', useCdn: false, token})

const id = `staffUser.${createHash('sha256').update(username).digest('hex').slice(0, 32)}`
const passwordHash = await hashPassword(password)

await client
  .transaction()
  .createIfNotExists({_id: id, _type: 'staffUser', username, createdAt: new Date().toISOString(), active: true, role})
  .patch(id, (patch) => patch.set({name, username, role, active: true, passwordHash}))
  .commit()

console.log(`Staff account ready: ${username} (${role})  id=${id}`)
