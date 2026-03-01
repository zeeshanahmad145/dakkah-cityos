import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { handleApiError } from "../../../lib/api-error-handler";

const createSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    property_type: z.enum([
      "apartment",
      "house",
      "villa",
      "land",
      "commercial",
      "office",
      "warehouse",
      "studio",
    ]),
    listing_type: z.enum(["sale", "rent", "lease", "auction"]),
    price: z.number(),
    currency_code: z.string().min(1),
    price_period: z
      .enum(["total", "monthly", "yearly", "weekly"])
      .nullable()
      .optional(),
    address_line1: z.string().min(1),
    address_line2: z.string().nullable().optional(),
    city: z.string().min(1),
    state: z.string().nullable().optional(),
    postal_code: z.string().min(1),
    country_code: z.string().min(1),
    latitude: z.number().nullable().optional(),
    longitude: z.number().nullable().optional(),
    bedrooms: z.number().nullable().optional(),
    bathrooms: z.number().nullable().optional(),
    area_sqm: z.number().nullable().optional(),
    year_built: z.number().nullable().optional(),
    tenant_id: z.string().min(1),
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
  const { limit = "20", offset = "0" } = req.query as Record<
    string,
    string | undefined
  >;
  const items = await moduleService.listPropertyListings(
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
  const moduleService = req.scope.resolve("realEstate") as unknown as any;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Validation failed", errors: parsed.error.issues });
  const item = await moduleService.createPropertyListings(parsed.data);
  return res.status(201).json({ item });
}
