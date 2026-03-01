import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
    category_id: z.string().optional(),
    subcategory_id: z.string().optional(),
    listing_type: z.enum(["sell", "buy", "trade", "free", "wanted"]).optional(),
    condition: z.enum(["new", "like_new", "good", "fair", "poor"]).optional(),
    price: z.number().optional(),
    currency_code: z.string().optional(),
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
  const { id } = req.params;
  const [item] = await mod.listClassifiedListings({ id }, { take: 1 });
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json({ item });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("classified") as unknown as any;
  const { id } = req.params;
  const validation = updateSchema.safeParse(req.body);
  if (!validation.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  const item = await mod.updateClassifiedListings({ id, ...validation.data });
  return res.json({ item });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("classified") as unknown as any;
  const { id } = req.params;
  await mod.deleteClassifiedListings([id]);
  return res.status(204).send();
}
