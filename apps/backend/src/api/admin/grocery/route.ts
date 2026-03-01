import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    product_id: z.string(),
    storage_type: z.enum(["ambient", "chilled", "frozen", "live"]),
    shelf_life_days: z.number(),
    optimal_temp_min: z.number().optional(),
    optimal_temp_max: z.number().optional(),
    origin_country: z.string().optional(),
    organic: z.boolean().optional(),
    unit_type: z.enum(["piece", "kg", "gram", "liter", "bunch", "pack"]),
    min_order_quantity: z.number().optional(),
    is_seasonal: z.boolean().optional(),
    season_start: z.string().optional(),
    season_end: z.string().optional(),
    nutrition_info: z.any().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("grocery") as unknown as any;
  const { limit = "20", offset = "0" } = req.query as Record<
    string,
    string | undefined
  >;
  const items = await mod.listFreshProducts(
    {},
    { skip: Number(offset), take: Number(limit) },
  );
  return res.json({
    items,
    count: Array.isArray(items) ? items.length : 0,
    limit: Number(limit),
    offset: Number(offset),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("grocery") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  const item = await mod.createFreshProducts(validation.data);
  return res.status(201).json({ item });
}
