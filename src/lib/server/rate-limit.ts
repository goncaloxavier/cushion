import {createHash} from 'node:crypto'

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
