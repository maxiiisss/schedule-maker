import "server-only"

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

import type { SharedSchedule } from "./schema"

/** Links expire after 90 days without being opened; every view renews them. */
export const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90

export interface ShareRecord extends SharedSchedule {
  createdAt: number
  /** SHA-256 of the owner's edit token. The token itself is never stored. */
  tokenHash: string
}

interface ShareStore {
  save(id: string, record: ShareRecord): Promise<void>
  get(id: string): Promise<ShareRecord | null>
  renew(id: string): Promise<void>
  remove(id: string): Promise<void>
  /** True when the caller is still under the limit. */
  allow(key: string): Promise<boolean>
}

const key = (id: string) => `share:${id}`

function redisFromEnv(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  return url && token ? new Redis({ url, token }) : null
}

function upstashStore(redis: Redis): ShareStore {
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 m"),
    prefix: "ratelimit:share",
  })

  return {
    async save(id, record) {
      await redis.set(key(id), record, { ex: SHARE_TTL_SECONDS })
    },
    async get(id) {
      return (await redis.get<ShareRecord>(key(id))) ?? null
    },
    async renew(id) {
      await redis.expire(key(id), SHARE_TTL_SECONDS)
    },
    async remove(id) {
      await redis.del(key(id))
    },
    async allow(who) {
      return (await limiter.limit(who)).success
    },
  }
}

/** In-memory store for local development only. Data is lost on restart. */
function memoryStore(): ShareStore {
  const records = new Map<string, ShareRecord>()
  const hits = new Map<string, number[]>()

  return {
    async save(id, record) {
      records.set(id, record)
    },
    async get(id) {
      return records.get(id) ?? null
    },
    async renew() {},
    async remove(id) {
      records.delete(id)
    },
    async allow(who) {
      const now = Date.now()
      const recent = (hits.get(who) ?? []).filter((time) => now - time < 60_000)
      recent.push(now)
      hits.set(who, recent)
      return recent.length <= 10
    },
  }
}

const globalForStore = globalThis as unknown as { __shareStore?: ShareStore }

/**
 * Upstash Redis when its env vars are set, otherwise an in-memory store in
 * development. In production without credentials this returns null so the
 * API answers 503 instead of silently losing links.
 */
export function getShareStore(): ShareStore | null {
  if (globalForStore.__shareStore) return globalForStore.__shareStore

  const redis = redisFromEnv()
  if (redis) return (globalForStore.__shareStore = upstashStore(redis))
  if (process.env.NODE_ENV !== "production") return (globalForStore.__shareStore = memoryStore())
  return null
}
