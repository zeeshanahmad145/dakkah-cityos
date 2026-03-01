import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    tenant_id: z.string(),
    vendor_id: z.string().optional(),
    name: z.string(),
    description: z.string().optional(),
    property_type: z.enum([
      "hotel",
      "resort",
      "hostel",
      "apartment",
      "villa",
      "guesthouse",
      "motel",
      "boutique",
    ]),
    star_rating: z.number().optional(),
    address_line1: z.string(),
    address_line2: z.string().optional(),
    city: z.string(),
    state: z.string().optional(),
    country_code: z.string(),
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
  const { limit = "20", offset = "0" } = req.query as Record<
    string,
    string | undefined
  >;
  const items = await mod.listTravelProperties(
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
  const mod = req.scope.resolve("travel") as unknown as any;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  const item = await mod.createTravelProperties(parsed.data);
  return res.status(201).json({ item });
}
