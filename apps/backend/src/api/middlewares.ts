import { defineMiddlewares } from "@medusajs/medusa";
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

export default defineMiddlewares({
  routes: [
    {
      matcher: "/platform/**",
      middlewares: [storeCorsMiddleware],
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
  ],
});
