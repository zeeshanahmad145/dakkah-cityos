import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface RateLimitEntry {
  count: number
  resetTime: number
}

const storeLimits = new Map<string, RateLimitEntry>()
const adminLimits = new Map<string, RateLimitEntry>()

const STORE_MAX_REQUESTS = 100
const ADMIN_MAX_REQUESTS = 1000
const WINDOW_MS = 60 * 1000

function cleanupExpired(map: Map<string, RateLimitEntry>) {
  const now = Date.now()
  for (const [key, entry] of map) {
    if (now > entry.resetTime) {
      map.delete(key)
    }
  }
}

setInterval(() => {
  cleanupExpired(storeLimits)
  cleanupExpired(adminLimits)
}, 60 * 1000)

function checkRateLimit(
  map: Map<string, RateLimitEntry>,
  key: string,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = map.get(key)

  if (!entry || now > entry.resetTime) {
    map.set(key, { count: 1, resetTime: now + WINDOW_MS })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + WINDOW_MS }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime }
}

export function storeRateLimiter(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"]
  if (!mutationMethods.includes(req.method)) {
    return next()
  }

  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown"
  const { allowed, remaining, resetTime } = checkRateLimit(storeLimits, ip, STORE_MAX_REQUESTS)

  res.setHeader("X-RateLimit-Limit", String(STORE_MAX_REQUESTS))
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)))
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)))

  if (!allowed) {
    res.status(429).json({
      message: "Too Many Requests",
      type: "rate_limit_exceeded",
    })
    return
  }

  next()
}

export function adminRateLimiter(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"]
  if (!mutationMethods.includes(req.method)) {
    return next()
  }

  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown"
  const { allowed, remaining, resetTime } = checkRateLimit(adminLimits, ip, ADMIN_MAX_REQUESTS)

  res.setHeader("X-RateLimit-Limit", String(ADMIN_MAX_REQUESTS))
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)))
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)))

  if (!allowed) {
    res.status(429).json({
      message: "Too Many Requests",
      type: "rate_limit_exceeded",
    })
    return
  }

  next()
}
