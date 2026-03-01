import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http";

export async function adminContextMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const tenantId =
    (req.headers["x-tenant-id"] as string) ||
    req.auth_context?.app_metadata?.tenant_id ||
    "default";

  req.cityosContext = {
    tenantId,
    storeId: (req.headers["x-store-id"] as string) || null,
    locale: (req.headers["x-locale"] as string) || "en",
  };

  next();
}
