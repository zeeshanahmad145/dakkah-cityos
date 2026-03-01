import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const createCarrierSchema = z
  .object({
    name: z.string(),
    carrier_code: z.string(),
    api_key: z.string().optional(),
    account_number: z.string().optional(),
    is_active: z.boolean().optional(),
    supported_services: z.array(z.string()).optional(),
    default_service: z.string().optional(),
    weight_unit: z.enum(["kg", "lb"]).optional(),
    dimension_unit: z.enum(["cm", "in"]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("shippingExtension") as unknown as any;
    const filters: Record<string, any> = {};
    if (req.query.is_active !== undefined)
      filters.is_active = req.query.is_active === "true";
    const carriers = await service.listCarrierConfigs(filters);
    res.json({
      carriers: Array.isArray(carriers) ? carriers : [carriers].filter(Boolean),
    });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-SHIPPING-EXT-CARRIERS");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const service = req.scope.resolve("shippingExtension") as unknown as any;
    const parsed = createCarrierSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });
    }
    const carrier = await service.createCarrierConfigs(parsed.data);
    res.status(201).json({ carrier });
  } catch (error: unknown) {
    return handleApiError(res, error, "ADMIN-SHIPPING-EXT-CARRIERS");
  }
}
