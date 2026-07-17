import {databaseConfigured, query} from './db'

// Generic admin-editable settings store (see migrations/0009_app_settings.sql).
// Values are plain text, readable by any server code that knows the key —
// this is for low-sensitivity operational values (e.g. a swappable DeepL API
// key) where the worst case of exposure is quota abuse, not customer or
// payment data. Never store customer/order data here.

export const getSetting = async (key: string): Promise<string | null> => {
  if (!databaseConfigured()) return null
  const result = await query<{value: string}>('select value from app_settings where key = $1', [key])
  return result.rows[0]?.value ?? null
}

export const setSetting = async (key: string, value: string, updatedBy: string): Promise<void> => {
  await query(
    `insert into app_settings (key, value, updated_by, updated_at)
     values ($1, $2, $3, now())
     on conflict (key) do update
     set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`,
    [key, value, updatedBy],
  )
}

export const deleteSetting = async (key: string): Promise<void> => {
  await query('delete from app_settings where key = $1', [key])
}

export const getSettingMeta = async (
  key: string,
): Promise<{updatedAt: string; updatedBy: string} | null> => {
  if (!databaseConfigured()) return null
  const result = await query<{updated_at: string; updated_by: string}>(
    'select updated_at, updated_by from app_settings where key = $1',
    [key],
  )
  const row = result.rows[0]
  return row ? {updatedAt: row.updated_at, updatedBy: row.updated_by} : null
}
