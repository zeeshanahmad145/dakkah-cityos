import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  product_id: z.string().optional(),
  variant_id: z.string().optional(),
  collection_id: z.string().optional(),
  category_id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  min_quantity: z.number().int().min(1),
  max_quantity: z.number().int().nullable().optional(),
  discount_type: z
    .enum(["percentage", "fixed", "price_override"])
    .default("percentage"),
  discount_value: z.number(),
  currency_code: z.string().default("usd"),
  priority: z.number().int().optional(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("volumePricing") as unknown as any;
    const { limit = "20", offset = "0" } = req.query as Record<
      string,
      string | undefined
    >;

    const filters: Record<string, any> = { vendor_id: vendorId };

    const items = await mod.listVolumePricings(filters, {
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
  } catch (error: unknown) {
    handleApiError(res, error, "GET vendor volume-pricing");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const vendorId = req.vendor_id;
    if (!vendorId) {
      return res
        .status(401)
        .json({ message: "Vendor authentication required" });
    }

    const mod = req.scope.resolve("volumePricing") as unknown as any;
    const validation = createSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: validation.error.issues,
      });
    }

    const item = await mod.createVolumePricings({
      ...validation.data,
      vendor_id: vendorId,
    });

    return res.status(201).json({ item });
  } catch (error: unknown) {
    handleApiError(res, error, "POST vendor volume-pricing");
  }
}
