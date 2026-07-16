import pg from 'pg'
import type {QueryResultRow} from 'pg'

const {Pool} = pg

// This module runs only under the Node/Railway adapter. Reading process.env
// keeps the database layer usable by Node-side integration tests as well as
// SvelteKit request handlers.
const databaseUrl = () => process.env.DATABASE_URL

let pool: pg.Pool | null | undefined

const sslFor = (databaseUrl: string) =>
  databaseUrl.includes('railway.app') || databaseUrl.includes('proxy.rlwy.net')
    ? {rejectUnauthorized: false}
    : undefined

export const databaseConfigured = () => Boolean(databaseUrl())

export const getPool = () => {
  const connectionString = databaseUrl()
  if (!connectionString) return null
  if (pool !== undefined) return pool

  pool = new Pool({
    connectionString,
    ssl: sslFor(connectionString),
    max: 8,
    idleTimeoutMillis: 30_000,
  })

  return pool
}

export const query = async <T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
) => {
  const connection = getPool()
  if (!connection) throw new Error('DATABASE_URL is not configured')
  return connection.query<T>(text, params)
}

export const withTransaction = async <T>(work: (client: pg.PoolClient) => Promise<T>) => {
  const connection = getPool()
  if (!connection) throw new Error('DATABASE_URL is not configured')

  const client = await connection.connect()
  try {
    await client.query('begin')
    const result = await work(client)
    await client.query('commit')
    return result
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
