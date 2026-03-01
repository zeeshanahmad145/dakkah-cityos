import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  product_id: z.string().min(1),
  storage_type: z.enum(["ambient", "chilled", "frozen", "live"]),
  shelf_life_days: z.number(),
  optimal_temp_min: z.number().nullable().optional(),
  optimal_temp_max: z.number().nullable().optional(),
  origin_country: z.string().nullable().optional(),
  organic: z.boolean().optional(),
  unit_type: z.enum(["piece", "kg", "gram", "liter", "bunch", "pack"]),
  min_order_quantity: z.number().optional(),
  is_seasonal: z.boolean().optional(),
  season_start: z.string().nullable().optional(),
  season_end: z.string().nullable().optional(),
  nutrition_info: z.any().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("grocery") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    category,
  } = req.query as Record<string, string | undefined>;

  const filters: Record<string, any> = { vendor_id: vendorId };
  if (category) filters.storage_type = category;

  const items = await mod.listFreshProducts(filters, {
    skip: Number(offset),
    take: Number(limit),
    order: { created_at: "DESC" },
  });

  return res.json({
    items,
    count: Array.isArray(items) ? items.length : 0,
    limit: Number(limit),
    offset: Number(offset),
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("grocery") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  }

  const item = await mod.createFreshProducts({
    ...validation.data,
    vendor_id: vendorId,
  });

  return res.status(201).json({ item });
}
