import pg from 'pg'
import type {QueryResultRow} from 'pg'
import {env} from '$env/dynamic/private'

const {Pool} = pg

let pool: pg.Pool | null | undefined

const sslFor = (databaseUrl: string) =>
  databaseUrl.includes('railway.app') || databaseUrl.includes('proxy.rlwy.net')
    ? {rejectUnauthorized: false}
    : undefined

export const databaseConfigured = () => Boolean(env.DATABASE_URL)

export const getPool = () => {
  if (!env.DATABASE_URL) return null
  if (pool !== undefined) return pool

  pool = new Pool({
    connectionString: env.DATABASE_URL,
    ssl: sslFor(env.DATABASE_URL),
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
