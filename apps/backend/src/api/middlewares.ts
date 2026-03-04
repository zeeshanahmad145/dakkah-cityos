import { defineMiddlewares, authenticate } from "@medusajs/medusa";
import * as Sentry from "@sentry/node";
import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

function storeCorsMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type,Authorization,x-publishable-api-key",
  );

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}

function sentryRequestMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const client = Sentry.getClient();
  if (!client) {
    next();
    return;
  }

  Sentry.withScope((scope) => {
    scope.setTag("http.method", req.method);
    scope.setTag("http.url", req.originalUrl || req.url);
    scope.setTransactionName(
      `${req.method} ${req.route?.path || req.originalUrl || req.url}`,
    );

    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      if (res.statusCode >= 500) {
        const errorMessage =
          body?.message ||
          body?.error ||
          `Server error on ${req.method} ${req.originalUrl}`;
        Sentry.captureException(new Error(errorMessage), {
          extra: {
            statusCode: res.statusCode,
            method: req.method,
            url: req.originalUrl || req.url,
            responseBody: body,
          },
        });
      } else if (res.statusCode >= 400) {
        Sentry.captureMessage(
          `${res.statusCode} ${req.method} ${req.originalUrl}: ${body?.message || JSON.stringify(body?.errors || "")}`,
          {
            level: res.statusCode >= 500 ? "error" : "warning",
            extra: {
              statusCode: res.statusCode,
              method: req.method,
              url: req.originalUrl || req.url,
              responseBody: body,
            },
          },
        );
      }

      return originalJson(body);
    };

    next();
  });
}

/**
 * Phase 4b — Healthcare RBAC
 * Ensures a customer can only access their own patient records.
 * Applied to /store/healthcare routes that carry a :patient_id param.
 */
function ensurePatientOwnership(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const patientId = (req.params as Record<string, string>)?.patient_id;
  const actorId = (req as any).auth_context?.actor_id;

  if (!actorId) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  if (patientId && patientId !== actorId) {
    res.status(403).json({
      message: "Access denied: you may only access your own patient records",
    });
    return;
  }

  next();
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/**",
      middlewares: [sentryRequestMiddleware],
    },
    {
      matcher: "/admin/volume-pricing*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/vendors*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/legal*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/quotes*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/charities*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/fitness*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/grocery*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/**",
      middlewares: [sentryRequestMiddleware],
    },
    {
      matcher: "/platform/**",
      middlewares: [storeCorsMiddleware, sentryRequestMiddleware],
    },
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
      matcher: "/store/reviews",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/reviews/**",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/volume-pricing",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/volume-pricing/**",
      middlewares: [storeCorsMiddleware],
    },
    // Phase 4a-4b: Healthcare RBAC + Travel CORS
    {
      matcher: "/store/healthcare",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/healthcare/**",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/healthcare/appointments/:patient_id*",
      middlewares: [ensurePatientOwnership],
    },
    {
      matcher: "/store/healthcare/records/:patient_id*",
      middlewares: [ensurePatientOwnership],
    },
    {
      matcher: "/store/travel",
      middlewares: [storeCorsMiddleware],
    },
    {
      matcher: "/store/travel/**",
      middlewares: [storeCorsMiddleware],
    },
  ],
});
