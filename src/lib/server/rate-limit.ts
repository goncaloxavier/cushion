import {createHash} from 'node:crypto'
import {databaseConfigured, query} from './db'

type RateBucket = {count: number; resetAt: number}

const buckets = new Map<string, RateBucket>()
const maxBuckets = 5_000

const pruneExpiredBuckets = (now: number) => {
  if (buckets.size < maxBuckets) return

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }

  // This is intentionally a small, in-process abuse guard. Retain a firm
  // memory ceiling under traffic from many one-off addresses; a production
  // edge rate limit is still the scalable outer layer.
  while (buckets.size >= maxBuckets) {
    const oldest = buckets.keys().next().value
    if (!oldest) break
    buckets.delete(oldest)
  }
}

export const rateLimit = (key: string, limit: number, windowMs: number, now = Date.now()) => {
  pruneExpiredBuckets(now)
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, {count: 1, resetAt: now + windowMs})
    return false
  }
  current.count += 1
  return current.count > limit
}

export const rateLimitKey = (namespace: string, identifier: string) =>
  `${namespace}:${createHash('sha256').update(identifier).digest('hex')}`

export const distributedRateLimit = async (
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> => {
  if (!databaseConfigured()) return rateLimit(key, limit, windowMs)

  try {
    const result = await query<{request_count: number}>(
      `insert into rate_limit_buckets (key, request_count, reset_at, updated_at)
       values ($1, 1, now() + ($2::double precision * interval '1 millisecond'), now())
       on conflict (key) do update
       set request_count = case
             when rate_limit_buckets.reset_at <= now() then 1
             else rate_limit_buckets.request_count + 1
           end,
           reset_at = case
             when rate_limit_buckets.reset_at <= now()
               then now() + ($2::double precision * interval '1 millisecond')
             else rate_limit_buckets.reset_at
           end,
           updated_at = now()
       returning request_count`,
      [key, windowMs],
    )
    return Number(result.rows[0]?.request_count ?? 1) > limit
  } catch (error) {
    console.warn(
      `[rate-limit] distributed counter unavailable; using local fallback: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return rateLimit(key, limit, windowMs)
  }
}
