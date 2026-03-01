import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    seller_id: z.string(),
    title: z.string(),
    description: z.string(),
    category_id: z.string().optional(),
    subcategory_id: z.string().optional(),
    listing_type: z.enum(["sell", "buy", "trade", "free", "wanted"]),
    condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional(),
    price: z.number().optional(),
    currency_code: z.string(),
    is_negotiable: z.boolean().optional(),
    location_city: z.string().optional(),
    location_state: z.string().optional(),
    location_country: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    status: z
      .enum(["draft", "active", "sold", "expired", "flagged", "removed"])
      .optional(),
    expires_at: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("classified") as unknown as any;
  const { limit = "20", offset = "0" } = req.query as Record<
    string,
    string | undefined
  >;
  const items = await mod.listClassifiedListings(
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
  const mod = req.scope.resolve("classified") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  const item = await mod.createClassifiedListings(validation.data);
  return res.status(201).json({ item });
}
