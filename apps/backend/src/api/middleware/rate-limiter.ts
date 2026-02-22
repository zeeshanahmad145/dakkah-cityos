import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitMaps = {
  store: new Map<string, RateLimitEntry>(),
  subscriptionCheckout: new Map<string, RateLimitEntry>(),
  wallet: new Map<string, RateLimitEntry>(),
  newsletter: new Map<string, RateLimitEntry>(),
  admin: new Map<string, RateLimitEntry>(),
}

const RATE_LIMITS = {
  store: 30,
  subscriptionCheckout: 5,
  wallet: 10,
  newsletter: 3,
  admin: 1000,
}

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
  for (const map of Object.values(rateLimitMaps)) {
    cleanupExpired(map)
  }
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

function getStoreRateCategory(path: string): { map: Map<string, RateLimitEntry>; limit: number; useCustomerId: boolean } {
  if (path.startsWith("/store/subscriptions/checkout") || path === "/store/subscriptions/checkout") {
    return { map: rateLimitMaps.subscriptionCheckout, limit: RATE_LIMITS.subscriptionCheckout, useCustomerId: true }
  }
  if (path.startsWith("/store/wallet")) {
    return { map: rateLimitMaps.wallet, limit: RATE_LIMITS.wallet, useCustomerId: true }
  }
  if (path.startsWith("/store/newsletter")) {
    return { map: rateLimitMaps.newsletter, limit: RATE_LIMITS.newsletter, useCustomerId: false }
  }
  return { map: rateLimitMaps.store, limit: RATE_LIMITS.store, useCustomerId: false }
}

function sendRateLimitResponse(
  res: MedusaResponse,
  limit: number,
  remaining: number,
  resetTime: number,
  allowed: boolean
): boolean {
  res.setHeader("X-RateLimit-Limit", String(limit))
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)))
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)))

  if (!allowed) {
    res.status(429).json({
      message: "Too Many Requests",
      type: "rate_limit_exceeded",
    })
    return true
  }
  return false
}

export function storeRateLimiter(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"]
  if (!mutationMethods.includes(req.method)) {
    return next()
  }

  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown"
  const category = getStoreRateCategory(req.path)

  let key: string
  if (category.useCustomerId) {
    const customerId = (req as any).auth_context?.actor_id
    key = customerId || ip
  } else {
    key = ip
  }

  const { allowed, remaining, resetTime } = checkRateLimit(category.map, key, category.limit)
  const blocked = sendRateLimitResponse(res, category.limit, remaining, resetTime, allowed)

  if (!blocked) {
    next()
  }
}

export function adminRateLimiter(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const mutationMethods = ["POST", "PUT", "PATCH", "DELETE"]
  if (!mutationMethods.includes(req.method)) {
    return next()
  }

  const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown"
  const { allowed, remaining, resetTime } = checkRateLimit(rateLimitMaps.admin, ip, RATE_LIMITS.admin)
  const blocked = sendRateLimitResponse(res, RATE_LIMITS.admin, remaining, resetTime, allowed)

  if (!blocked) {
    next()
  }
}
