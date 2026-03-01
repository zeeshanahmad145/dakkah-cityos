import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category_id: z.string().nullable().optional(),
  subcategory_id: z.string().nullable().optional(),
  listing_type: z.enum(["sell", "buy", "trade", "free", "wanted"]),
  condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional(),
  price: z.number().nullable().optional(),
  currency_code: z.string().min(1),
  is_negotiable: z.boolean().optional(),
  location_city: z.string().nullable().optional(),
  location_state: z.string().nullable().optional(),
  location_country: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  status: z
    .enum(["draft", "active", "sold", "expired", "flagged", "removed"])
    .optional(),
  expires_at: z.string().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("classified") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    status,
    category,
  } = req.query as Record<string, string | undefined>;

  const filters: Record<string, any> = { seller_id: vendorId };
  if (status) filters.status = status;
  if (category) filters.category_id = category;

  const items = await mod.listClassifiedListings(filters, {
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

  const mod = req.scope.resolve("classified") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  }

  const item = await mod.createClassifiedListings({
    ...validation.data,
    seller_id: vendorId,
  });

  return res.status(201).json({ item });
}
