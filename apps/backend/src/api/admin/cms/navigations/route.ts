import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("cmsContent") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.is_active !== undefined)
      filters.is_active = req.query.is_active === "true";
    const navigations = await service.listCmsNavigations(filters);
    res.json({
      navigations: Array.isArray(navigations)
        ? navigations
        : [navigations].filter(Boolean),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-CMS-NAVIGATIONS");
  }
}
