import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { handleApiError } from "../../../../lib/api-error-handler";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("shippingExtension") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.carrier_id) filters.carrier_id = req.query.carrier_id;
    if (req.query.is_active !== undefined)
      filters.is_active = req.query.is_active === "true";
    const rates = await service.listShippingRates(filters);
    res.json({ rates: Array.isArray(rates) ? rates : [rates].filter(Boolean) });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-SHIPPING-EXT-RATES");
  }
}
