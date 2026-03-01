import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../../lib/api-error-handler";

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    property_type: z
      .enum([
        "apartment",
        "house",
        "villa",
        "land",
        "commercial",
        "office",
        "warehouse",
        "studio",
      ])
      .optional(),
    listing_type: z.enum(["sale", "rent", "lease", "auction"]).optional(),
    price: z.number().optional(),
    currency_code: z.string().optional(),
    price_period: z
      .enum(["total", "monthly", "yearly", "weekly"])
      .nullable()
      .optional(),
    address_line1: z.string().optional(),
    address_line2: z.string().nullable().optional(),
    city: z.string().optional(),
    state: z.string().nullable().optional(),
    postal_code: z.string().optional(),
    country_code: z.string().optional(),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    bedrooms: z.number().nullable().optional(),
    bathrooms: z.number().nullable().optional(),
    area_sqm: z.number().nullable().optional(),
    year_built: z.number().nullable().optional(),
    agent_id: z.string().nullable().optional(),
    features: z.any().nullable().optional(),
    images: z.any().nullable().optional(),
    virtual_tour_url: z.string().nullable().optional(),
    floor_plan_url: z.string().nullable().optional(),
    status: z
      .enum([
        "draft",
        "active",
        "under_offer",
        "sold",
        "rented",
        "expired",
        "withdrawn",
      ])
      .optional(),
    metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .passthrough();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("realEstate") as unknown as any;
  const { id } = req.params;
  const [item] = await moduleService.listPropertyListings({ id }, { take: 1 });
  if (!item) return res.status(404).json({ message: "Not found" });
  return res.json({ item });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("realEstate") as unknown as any;
  const { id } = req.params;
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  const item = await moduleService.updatePropertyListings({
    id,
    ...parsed.data,
  });
  return res.json({ item });
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const moduleService = req.scope.resolve("realEstate") as unknown as any;
  const { id } = req.params;
  await moduleService.deletePropertyListings([id]);
  return res.status(204).send();
}
