import { defineMiddlewares } from "@medusajs/medusa"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { storeRateLimiter, adminRateLimiter } from "./middleware/rate-limiter"
import { requestLogger } from "./middleware/request-logger"
import { securityHeaders } from "./middleware/security-headers"
import { requireCustomerAuth } from "./middleware/require-customer-auth"

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

    // Financial routes
    { matcher: "/store/subscriptions/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/wallet/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/credit/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/financial-products/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    // Commerce routes
    { matcher: "/store/bookings/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/freelance/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/rentals/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/memberships/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/digital-products/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/classifieds/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/crowdfunding/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/auctions/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/automotive/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/government/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/shipping/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/gift-cards/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    // User data routes
    { matcher: "/store/notification-preferences/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/wishlists/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/reviews/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    // Vendor routes
    { matcher: "/store/vendors/register", method: ["POST"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/vendors/*/stripe-connect", method: ["POST"], middlewares: [requireCustomerAuth] },
    // Other commerce
    { matcher: "/store/advertising/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/affiliate/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/affiliates/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
    { matcher: "/store/cart-extension/**", method: ["POST", "PUT", "PATCH", "DELETE"], middlewares: [requireCustomerAuth] },
  ],
})
