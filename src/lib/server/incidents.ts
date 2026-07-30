import {createHash} from 'node:crypto'
import {databaseConfigured, query} from './db'

/**
 * A developer-side record of failures that leave no other trace — checkout losing
 * the catalogue, an order that could not be created, an email that did not send.
 *
 * It used to have a backoffice screen. That screen was removed: it asked the
 * client to triage infrastructure faults, for a shop that is not fully wired yet,
 * and every entry in that sidebar is something they have to understand. The
 * writes stay because they cost nothing and the plumbing should already exist
 * when checkout does go live — read them from the database or the logs, both of
 * which are ours, not theirs.
 */
export type IncidentSeverity = 'warning' | 'error' | 'critical'

export type OperationalIncident = {
  id: string
  category: string
  severity: IncidentSeverity
  title: string
  detail: string
  context: Record<string, unknown>
  occurrences: number
  firstSeenAt: string
  lastSeenAt: string
  resolvedAt: string | null
}

type IncidentRow = {
  id: string
  category: string
  severity: IncidentSeverity
  title: string
  detail: string
  context_json: Record<string, unknown> | null
  occurrences: number
  first_seen_at: string
  last_seen_at: string
  resolved_at: string | null
}

const clean = (value: unknown, max: number) =>
  String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const safeContext = (input: Record<string, unknown> | undefined) =>
  Object.fromEntries(
    Object.entries(input ?? {})
      .slice(0, 20)
      .map(([key, value]) => [clean(key, 60), clean(value, 300)]),
  )

export const recordOperationalIncident = async (input: {
  fingerprint: string
  category: string
  severity?: IncidentSeverity
  title: string
  detail?: unknown
  context?: Record<string, unknown>
}) => {
  const title = clean(input.title, 180)
  const detail = clean(input.detail, 2000)
  const fingerprint = createHash('sha256')
    .update(`${clean(input.category, 60)}:${clean(input.fingerprint, 300)}`)
    .digest('hex')

  if (!databaseConfigured()) {
    console.error(`[incident] ${title}: ${detail}`)
    return
  }

  await query(
    `insert into operational_incidents
       (fingerprint, category, severity, title, detail, context_json)
     values ($1, $2, $3, $4, $5, $6::jsonb)
     on conflict (fingerprint) where resolved_at is null
     do update set
       severity = excluded.severity,
       title = excluded.title,
       detail = excluded.detail,
       context_json = excluded.context_json,
       occurrences = operational_incidents.occurrences + 1,
       last_seen_at = now()`,
    [
      fingerprint,
      clean(input.category, 60) || 'system',
      input.severity ?? 'warning',
      title || 'Falha operacional',
      detail,
      JSON.stringify(safeContext(input.context)),
    ],
  ).catch((error) => {
    console.error(
      `[incident] failed to persist "${title}": ${error instanceof Error ? error.message : String(error)}`,
    )
  })
}

const mapIncident = (row: IncidentRow): OperationalIncident => ({
  id: row.id,
  category: row.category,
  severity: row.severity,
  title: row.title,
  detail: row.detail,
  context: row.context_json ?? {},
  occurrences: Number(row.occurrences),
  firstSeenAt: row.first_seen_at,
  lastSeenAt: row.last_seen_at,
  resolvedAt: row.resolved_at,
})

export const listOperationalIncidents = async (
  includeResolved = false,
): Promise<OperationalIncident[]> => {
  if (!databaseConfigured()) return []
  const result = await query<IncidentRow>(
    `select id, category, severity, title, detail, context_json, occurrences,
            first_seen_at, last_seen_at, resolved_at
     from operational_incidents
     where ($1::boolean = true or resolved_at is null)
     order by resolved_at nulls first, last_seen_at desc
     limit 200`,
    [includeResolved],
  )
  return result.rows.map(mapIncident)
}

export const countOpenOperationalIncidents = async () => {
  if (!databaseConfigured()) return 0
  const result = await query<{count: string}>(
    'select count(*)::text as count from operational_incidents where resolved_at is null',
  )
  return Number(result.rows[0]?.count ?? 0)
}

export const resolveOperationalIncident = async (id: string, staffId: string) => {
  if (!databaseConfigured()) return false
  const result = await query(
    `update operational_incidents
     set resolved_at = now(), resolved_by = $2
     where id = $1 and resolved_at is null`,
    [id, staffId],
  )
  return Boolean(result.rowCount)
}
