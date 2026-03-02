// @ts-nocheck
import { createLogger } from "./logger";

const logger = createLogger("lib:booking-slot-lock");

const LOCK_TTL_SECONDS = 30; // max time held during booking creation
const LOCK_RETRY_DELAY_MS = 150; // poll interval
const LOCK_MAX_RETRIES = 20; // 20 × 150ms = 3s max wait

// Lazy Redis client — only connects if REDIS_URL is set
let _redis: any = null;
async function getRedis(): Promise<any | null> {
  if (_redis) return _redis;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;
  try {
    // Dynamic import avoids bundling issues when ioredis is not installed
    const { default: Redis } = await import("ioredis");
    _redis = new Redis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
    });
    return _redis;
  } catch {
    return null;
  }
}

function lockKey(
  entityType: string,
  entityId: string,
  date: string,
  time: string,
) {
  return `dakkah:slot-lock:${entityType}:${entityId}:${date}:${time}`;
}

/**
 * Acquire a distributed Redis lock on a booking slot.
 *
 * Uses SET NX EX (atomic "set if not exists with expiry").
 * Returns the lock token on success, null if the slot is locked.
 *
 * If Redis is unavailable (no REDIS_URL or ioredis not installed),
 * returns a "no-redis" token and skips locking (dev mode).
 *
 * Usage:
 *   const token = await acquireSlotLock("service_product", productId, date, time)
 *   if (!token) throw new Error("Slot is currently being booked")
 *   try {
 *     await createBooking(...)
 *   } finally {
 *     await releaseSlotLock(entityType, entityId, date, time, token)
 *   }
 */
export async function acquireSlotLock(
  entityType: string,
  entityId: string,
  date: string,
  time: string,
): Promise<string | null> {
  const redis = await getRedis();
  if (!redis) {
    logger.warn("Redis not available — booking slot lock skipped");
    return "no-redis";
  }

  const key = lockKey(entityType, entityId, date, time);
  const token = `${Date.now()}-${Math.random().toString(36).substring(2)}`;

  for (let attempt = 0; attempt < LOCK_MAX_RETRIES; attempt++) {
    const result = await redis.set(key, token, "EX", LOCK_TTL_SECONDS, "NX");
    if (result === "OK") {
      logger.debug(`Slot lock acquired: ${key}`);
      return token;
    }
    await new Promise((r) => setTimeout(r, LOCK_RETRY_DELAY_MS));
  }

  logger.warn(`Slot lock timeout: ${key}`);
  return null;
}

/**
 * Release a slot lock. Only deletes if the token matches (avoids
 * releasing another request's lock after TTL expiry).
 */
export async function releaseSlotLock(
  entityType: string,
  entityId: string,
  date: string,
  time: string,
  token: string,
): Promise<void> {
  if (token === "no-redis") return;
  const redis = await getRedis();
  if (!redis) return;

  const key = lockKey(entityType, entityId, date, time);
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  await redis.eval(script, 1, key, token);
  logger.debug(`Slot lock released: ${key}`);
}
