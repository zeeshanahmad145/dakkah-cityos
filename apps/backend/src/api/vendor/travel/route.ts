import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
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
  star_rating: z.number().nullable().optional(),
  address_line1: z.string().min(1),
  address_line2: z.string().nullable().optional(),
  city: z.string().min(1),
  state: z.string().nullable().optional(),
  country_code: z.string().min(1),
  postal_code: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  check_in_time: z.string().optional(),
  check_out_time: z.string().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  amenities: z.any().nullable().optional(),
  policies: z.any().nullable().optional(),
  images: z.any().nullable().optional(),
  is_active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("travel") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    status,
  } = req.query as Record<string, string | undefined>;

  const filters: Record<string, any> = { vendor_id: vendorId };
  if (status) filters.is_active = status === "active";

  const items = await mod.listTravelProperties(filters, {
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

  const mod = req.scope.resolve("travel") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  }

  const item = await mod.createTravelProperties({
    ...validation.data,
    vendor_id: vendorId,
  });

  return res.status(201).json({ item });
}
