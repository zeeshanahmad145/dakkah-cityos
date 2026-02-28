import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string().optional(),
    product_id: z.string(),
    rental_type: z.enum(["daily", "weekly", "monthly", "hourly", "custom"]),
    base_price: z.number(),
    currency_code: z.string(),
    deposit_amount: z.number().optional(),
    late_fee_per_day: z.number().optional(),
    min_duration: z.number().optional(),
    max_duration: z.number().optional(),
    is_available: z.boolean().optional(),
    condition_on_listing: z
      .enum(["new", "like_new", "good", "fair"])
      .optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;
    const items = await mod.listRentalProducts(
      {},
      { skip: Number(offset), take: Number(limit) },
    );
    return res.json({
      items,
      count: Array.isArray(items) ? items.length : 0,
      limit: Number(limit),
      offset: Number(offset),
    });
  } catch (error: any) {
    handleApiError(res, error, "GET admin rentals");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const mod = req.scope.resolve("rental") as any;
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: parsed.error.issues });

    const cityosContext = (req as any).cityosContext as any;
    const tenant_id = cityosContext?.tenantId || "default";

    const item = await mod.createRentalProducts({
      ...parsed.data,
      tenant_id,
    });
    return res.status(201).json({ item });
  } catch (error: any) {
    handleApiError(res, error, "POST admin rentals");
  }
}
