import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    vendor_id: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    property_type: z
      .enum([
        "hotel",
        "resort",
        "hostel",
        "apartment",
        "villa",
        "guesthouse",
        "motel",
        "boutique",
      ])
      .optional(),
    star_rating: z.number().optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country_code: z.string().optional(),
    postal_code: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    check_in_time: z.string().optional(),
    check_out_time: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    amenities: z.any().optional(),
    policies: z.any().optional(),
    images: z.any().optional(),
    is_active: z.boolean().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("travel") as unknown as any;
  const { id } = req.params;
  const [item] = await mod.listTravelProperties({ id }, { take: 1 });
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json({ item });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("travel") as unknown as any;
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  const item = await mod.updateTravelProperties({ id, ...parsed.data });
  return res.json({ item });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const mod = req.scope.resolve("travel") as unknown as any;
  const { id } = req.params;
  await mod.deleteTravelProperties([id]);
  return res.status(204).send();
}
