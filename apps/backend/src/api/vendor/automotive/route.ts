import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z.object({
  listing_type: z.enum(["sale", "lease", "auction"]),
  title: z.string().min(1),
  make: z.string().min(1),
  model_name: z.string().min(1),
  year: z.number(),
  mileage_km: z.number().optional(),
  fuel_type: z
    .enum(["petrol", "diesel", "electric", "hybrid", "hydrogen"])
    .optional(),
  transmission: z.enum(["automatic", "manual", "cvt"]).optional(),
  body_type: z
    .enum([
      "sedan",
      "suv",
      "hatchback",
      "truck",
      "van",
      "coupe",
      "convertible",
      "wagon",
    ])
    .optional(),
  color: z.string().optional(),
  vin: z.string().optional(),
  condition: z
    .enum(["new", "certified_pre_owned", "used", "salvage"])
    .optional(),
  price: z.number(),
  currency_code: z.string().min(1),
  description: z.string().optional(),
  features: z.any().optional(),
  images: z.any().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  status: z
    .enum(["draft", "active", "reserved", "sold", "withdrawn"])
    .optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const vendorId = req.vendor_id;
  if (!vendorId) {
    return res.status(401).json({ message: "Vendor authentication required" });
  }

  const mod = req.scope.resolve("automotive") as unknown as any;
  const {
    limit = "20",
    offset = "0",
    status,
  } = req.query as Record<string, string | undefined>;

  const filters: Record<string, any> = { seller_id: vendorId };
  if (status) filters.status = status;

  const items = await mod.listVehicleListings(filters, {
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

  const mod = req.scope.resolve("automotive") as unknown as any;
  const validation = createSchema.safeParse(req.body);
  if (!validation.success) {
    return res
      .status(400)
      .json({ message: "Validation failed", errors: validation.error.issues });
  }

  const item = await mod.createVehicleListings({
    ...validation.data,
    seller_id: vendorId,
  });

  return res.status(201).json({ item });
}
