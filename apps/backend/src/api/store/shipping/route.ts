import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const shippingRateQuerySchema = z.object({
  origin: z.string().min(1),
  destination: z.string().min(1),
  weight: z.number(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("shippingExtension") as unknown as any;
    const filters: Record<string, any> = { is_active: true };
    if (req.query.tenant_id) filters.tenant_id = req.query.tenant_id;
    const carriers = await service.listCarrierConfigs(filters);
    res.json({
      carriers: Array.isArray(carriers) ? carriers : [carriers].filter(Boolean),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-SHIPPING");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = req.auth_context?.actor_id;
    if (!customerId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const parsed = shippingRateQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }

    const { origin, destination, weight } = parsed.data;
    const service = req.scope.resolve("shippingExtension") as unknown as any;
    const rates = await service.listShippingRates({ is_active: true });
    const rateList = Array.isArray(rates) ? rates : [rates].filter(Boolean);
    res.json({ rates: rateList, origin, destination, weight });
  } catch (error: unknown) {
    return handleApiError(res, error, "STORE-SHIPPING");
  }
}
