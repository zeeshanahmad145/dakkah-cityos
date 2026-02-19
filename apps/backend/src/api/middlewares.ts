import { defineMiddlewares } from "@medusajs/medusa"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { storeRateLimiter, adminRateLimiter } from "./middleware/rate-limiter"
import { requestLogger } from "./middleware/request-logger"
import { securityHeaders } from "./middleware/security-headers"

function storeCorsMiddleware(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const origin = req.headers.origin
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin)
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*")
  }
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,x-publishable-api-key")

  if (req.method === "OPTIONS") {
    res.status(204).end()
    return
  }

  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/rentals",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/rentals/**",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/memberships",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/memberships/**",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/bookings",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/bookings/**",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/*",
      middlewares: [securityHeaders, requestLogger, storeRateLimiter],
    },
    {
      matcher: "/admin/*",
      middlewares: [securityHeaders, requestLogger, adminRateLimiter],
    },
  ],
})
