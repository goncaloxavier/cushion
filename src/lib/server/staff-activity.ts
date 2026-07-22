import {databaseConfigured, query} from './db'
import type {StaffUser} from './staff-auth'

export type StaffActivityInput = {
  staff: StaffUser
  action: string
  entityType: string
  entityId?: string
  entityLabel?: string
  detail?: string
}

export const logStaffActivity = async (input: StaffActivityInput) => {
  if (!databaseConfigured()) return
  await query(
    `insert into staff_activity_log
       (staff_id, staff_name, staff_role, action, entity_type, entity_id, entity_label, detail)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      input.staff.id,
      input.staff.name,
      input.staff.role,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.entityLabel ?? '',
      input.detail ?? '',
    ],
  ).catch((error) => {
    console.error(
      `[staff-activity] failed to log ${input.action} on ${input.entityType}: ${error instanceof Error ? error.message : String(error)}`,
    )
  })
}

export type StaffActivityRow = {
  id: string
  staffName: string
  staffRole: string
  action: string
  entityType: string
  entityId: string | null
  entityLabel: string
  detail: string
  createdAt: string
}

type ActivityRow = {
  id: string
  staff_name: string
  staff_role: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_label: string
  detail: string
  created_at: string
}

const mapActivity = (row: ActivityRow): StaffActivityRow => ({
  id: row.id,
  staffName: row.staff_name,
  staffRole: row.staff_role,
  action: row.action,
  entityType: row.entity_type,
  entityId: row.entity_id,
  entityLabel: row.entity_label,
  detail: row.detail,
  createdAt: row.created_at,
})

export const listStaffActivity = async (
  input: {limit?: number; offset?: number} = {},
): Promise<StaffActivityRow[]> => {
  if (!databaseConfigured()) return []
  const limit = Math.min(Math.max(input.limit ?? 200, 1), 500)
  const offset = Math.max(input.offset ?? 0, 0)
  const result = await query<ActivityRow>(
    `select id, staff_name, staff_role, action, entity_type, entity_id, entity_label, detail, created_at
     from staff_activity_log
     order by created_at desc
     limit $1 offset $2`,
    [limit, offset],
  )
  return result.rows.map(mapActivity)
}
