import { defineMiddlewares } from "@medusajs/framework/http";
import {
  detectTenantMiddleware,
  requireTenantMiddleware,
  injectTenantContextMiddleware,
} from "./tenant-context";
import {
  scopeToTenantMiddleware,
  scopeToVendorMiddleware,
  scopeToCompanyMiddleware,
} from "./scope-guards";
import { nodeContextMiddleware } from "./node-context";
import { platformContextMiddleware } from "./platform-context";
import { abacVcMiddleware, buildPolicyContextMiddleware } from "./abac-vc";
import { securityHeadersMiddleware } from "../../lib/middleware/security-headers";
import { requestLoggerMiddleware } from "../../lib/middleware/request-logger";
import {
  storeApiRateLimiter,
  adminApiRateLimiter,
  authRateLimiter,
  webhookRateLimiter,
  healthCheckRateLimiter,
} from "../../lib/middleware/rate-limiter";

export default defineMiddlewares({
  routes: [
    {
      matcher: "/*",
      middlewares: [securityHeadersMiddleware, requestLoggerMiddleware],
    },

    {
      matcher: "/auth/*",
      middlewares: [authRateLimiter],
    },

    {
      matcher: "/webhooks/*",
      middlewares: [webhookRateLimiter],
    },

    {
      matcher: "/store/health",
      middlewares: [healthCheckRateLimiter],
    },

    {
      matcher: "/admin/health",
      middlewares: [healthCheckRateLimiter],
    },

    {
      matcher: "/platform/*",
      middlewares: [platformContextMiddleware],
    },

    {
      matcher: "/store/cityos/*",
      middlewares: [nodeContextMiddleware],
    },

    {
      matcher: "/store/*",
      middlewares: [
        storeApiRateLimiter,
        buildPolicyContextMiddleware,
        abacVcMiddleware,
        detectTenantMiddleware,
        requireTenantMiddleware,
        injectTenantContextMiddleware,
      ],
    },

    {
      matcher: "/admin/*",
      middlewares: [
        adminApiRateLimiter,
        buildPolicyContextMiddleware,
        abacVcMiddleware,
      ],
    },

    {
      matcher: "/admin/*",
      middlewares: [
        detectTenantMiddleware,
        injectTenantContextMiddleware,
        scopeToTenantMiddleware,
      ],
      method: ["POST", "PUT", "PATCH", "DELETE"],
    },

    {
      matcher: "/vendor/*",
      middlewares: [
        storeApiRateLimiter,
        detectTenantMiddleware,
        injectTenantContextMiddleware,
        scopeToVendorMiddleware,
      ],
    },

    {
      matcher: "/store/b2b/*",
      middlewares: [
        storeApiRateLimiter,
        detectTenantMiddleware,
        requireTenantMiddleware,
        injectTenantContextMiddleware,
        scopeToCompanyMiddleware,
      ],
    },
  ],
});

export * from "./tenant-context";
export * from "./scope-guards";
export * from "./node-context";
export * from "./platform-context";
export * from "./abac-vc";
