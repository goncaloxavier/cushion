import {readdir, readFile} from 'node:fs/promises'
import {join} from 'node:path'
import pg from 'pg'

const {Pool} = pg

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('DATABASE_URL is required to run migrations.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl:
    process.env.DATABASE_SSL_MODE === 'disable'
      ? undefined
      : databaseUrl.includes('railway.app') ||
          databaseUrl.includes('proxy.rlwy.net') ||
          process.env.DATABASE_SSL_MODE === 'require'
        ? {rejectUnauthorized: false}
        : process.env.DATABASE_SSL_MODE === 'verify-full'
          ? {rejectUnauthorized: true}
          : undefined,
  connectionTimeoutMillis: 10_000,
  query_timeout: 60_000,
  statement_timeout: 60_000,
})

const migrationsDir = join(process.cwd(), 'migrations')

try {
  const files = (await readdir(migrationsDir)).filter((file) => file.endsWith('.sql')).sort()
  const client = await pool.connect()

  try {
    await client.query(`select pg_advisory_lock(hashtext('df4y-schema-migrations'))`)
    await client.query(`
      create table if not exists schema_migrations (
        version text primary key,
        applied_at timestamptz not null default now()
      )
    `)

    for (const file of files) {
      const applied = await client.query('select 1 from schema_migrations where version = $1', [file])
      if (applied.rowCount) {
        console.log(`skip ${file}`)
        continue
      }

      const sql = await readFile(join(migrationsDir, file), 'utf8')
      await client.query('begin')
      try {
        await client.query(sql)
        await client.query('insert into schema_migrations (version) values ($1)', [file])
        await client.query('commit')
        console.log(`applied ${file}`)
      } catch (error) {
        await client.query('rollback')
        throw error
      }
    }
  } finally {
    await client
      .query(`select pg_advisory_unlock(hashtext('df4y-schema-migrations'))`)
      .catch(() => undefined)
    client.release()
  }
} finally {
  await pool.end()
}
